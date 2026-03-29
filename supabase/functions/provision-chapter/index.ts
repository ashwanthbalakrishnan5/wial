import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Helper: call the GitHub API with auth
// ---------------------------------------------------------------------------
async function githubApi(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.github.com${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

type CloudflareEnvelope<T = unknown> = {
  success?: boolean;
  result?: T;
  errors?: Array<{ message?: string }>;
};

async function cloudflareApi<T = unknown>(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ response: Response; data: CloudflareEnvelope<T> | null }> {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.cloudflare.com/client/v4${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | CloudflareEnvelope<T>
    | null;

  return { response, data };
}

async function resolveZoneIdForDomain(
  token: string,
  fqdn: string
): Promise<string | null> {
  const labels = fqdn.split(".");
  for (let i = 0; i <= labels.length - 2; i++) {
    const candidateZone = labels.slice(i).join(".");
    const { response, data } = await cloudflareApi<Array<{ id: string }>>(
      token,
      `/zones?name=${encodeURIComponent(candidateZone)}&status=active&per_page=1`
    );

    if (
      response.ok &&
      data?.success &&
      Array.isArray(data.result) &&
      data.result.length > 0
    ) {
      return data.result[0].id;
    }
  }

  return null;
}

async function ensureCnameRecord(
  token: string,
  zoneId: string,
  recordName: string,
  recordContent: string
): Promise<string | null> {
  const { response: listRes, data: listData } = await cloudflareApi<
    Array<{ id: string; content: string }>
  >(
    token,
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(recordName)}&per_page=1`
  );

  if (!listRes.ok || !listData?.success || !Array.isArray(listData.result)) {
    return "Unable to read DNS records for CNAME verification";
  }

  const existing = listData.result[0];
  if (existing?.content === recordContent) {
    return null;
  }

  const payload = {
    type: "CNAME",
    name: recordName,
    content: recordContent,
    proxied: true,
    ttl: 1,
  };

  if (existing) {
    const { response: updateRes, data: updateData } = await cloudflareApi(
      token,
      `/zones/${zoneId}/dns_records/${existing.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    if (!updateRes.ok || !updateData?.success) {
      return `Failed to update CNAME record: ${updateData?.errors?.[0]?.message || updateRes.status}`;
    }
    return null;
  }

  const { response: createRes, data: createData } = await cloudflareApi(
    token,
    `/zones/${zoneId}/dns_records`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!createRes.ok || !createData?.success) {
    return `Failed to create CNAME record: ${createData?.errors?.[0]?.message || createRes.status}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Scaffold file content generators
// ---------------------------------------------------------------------------

function generatePackageJson(slug: string): string {
  return JSON.stringify(
    {
      name: `@repo/chapter-${slug}`,
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "astro dev",
        build: "astro build",
        preview: "astro preview",
      },
      dependencies: {
        "@repo/template-core": "*",
        "@repo/types": "*",
        "@supabase/supabase-js": "^2.49.4",
        astro: "^6.0.0",
      },
      devDependencies: {
        "@tailwindcss/vite": "^4.1.0",
        tailwindcss: "^4.1.0",
        typescript: "5.5.4",
      },
    },
    null,
    2
  );
}

function generateAstroConfig(): string {
  return `import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
`;
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      extends: "astro/tsconfigs/strict",
      include: [".astro/types.d.ts", "**/*"],
      exclude: ["dist"],
    },
    null,
    2
  );
}

function generateEnvExample(slug: string): string {
  return `CHAPTER_SLUG=${slug}
PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // -----------------------------------------------------------------------
    // Environment variables
    // -----------------------------------------------------------------------
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PUBLIC_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const cloudflareApiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const explicitCloudflareZoneId = Deno.env.get("CLOUDFLARE_ZONE_ID");
    const configuredDomainSuffix =
      Deno.env.get("CLOUDFLARE_CHAPTER_DOMAIN_SUFFIX") ??
      "wial.ashwanthbk.com";
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepoOwner = Deno.env.get("GITHUB_REPO_OWNER");
    const githubRepoName = Deno.env.get("GITHUB_REPO_NAME");
    const githubRepoFull = Deno.env.get("GITHUB_REPO"); // owner/repo
    const [fallbackOwner, fallbackRepo] = (githubRepoFull ?? "").split("/");
    const githubOwner = githubRepoOwner ?? fallbackOwner;
    const githubRepo = githubRepoName ?? fallbackRepo;

    const missingEnv: string[] = [];
    if (!supabaseUrl) missingEnv.push("SUPABASE_URL or PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!cloudflareAccountId) missingEnv.push("CLOUDFLARE_ACCOUNT_ID");
    if (!cloudflareApiToken) missingEnv.push("CLOUDFLARE_API_TOKEN");
    if (!githubToken) missingEnv.push("GITHUB_TOKEN");
    if (!githubOwner || !githubRepo) {
      missingEnv.push(
        "GITHUB_REPO_OWNER+GITHUB_REPO_NAME or GITHUB_REPO (owner/repo)"
      );
    }

    if (missingEnv.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required environment variables",
          missing: missingEnv,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // -----------------------------------------------------------------------
    // Auth: verify caller is an authenticated super_admin
    // -----------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .limit(1);

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: only super admins can provision chapters",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // -----------------------------------------------------------------------
    // Parse and validate request
    // -----------------------------------------------------------------------
    const { chapter_id } = await req.json();
    if (!chapter_id) {
      return new Response(
        JSON.stringify({ error: "chapter_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapter_id)
      .single();

    if (chapterError || !chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (chapter.cloudflare_project_name) {
      return new Response(
        JSON.stringify({
          error: "Chapter already has a Cloudflare project provisioned",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const slug = chapter.slug as string;
    const chapterFolder = `apps/chapter-${slug}`;
    const chapterDomainSuffix = configuredDomainSuffix
      .replace(/^\.+/, "")
      .trim();
    const customDomain = `${slug}.${chapterDomainSuffix}`;
    const repoPath = `/repos/${githubOwner}/${githubRepo}`;

    // =======================================================================
    // STEP 1 — Scaffold the chapter folder via GitHub API
    // =======================================================================

    // 1a) Get the main branch HEAD SHA
    const mainRefRes = await githubApi(
      githubToken,
      `${repoPath}/git/ref/heads/main`
    );
    if (!mainRefRes.ok) {
      const body = await mainRefRes.json();
      throw new Error(
        `Failed to get main branch ref: ${body?.message || mainRefRes.status}`
      );
    }
    const mainRefData = await mainRefRes.json();
    const mainHeadSha: string = mainRefData.object.sha;

    // 1b) Get the commit to find the base tree SHA
    const mainCommitRes = await githubApi(
      githubToken,
      `${repoPath}/git/commits/${mainHeadSha}`
    );
    if (!mainCommitRes.ok) {
      throw new Error("Failed to get main commit");
    }
    const mainCommitData = await mainCommitRes.json();
    const baseTreeSha: string = mainCommitData.tree.sha;

    // 1c) Get the scaffold pages tree from packages/template-core/scaffold/pages
    const scaffoldTreeRes = await githubApi(
      githubToken,
      `${repoPath}/git/trees/${baseTreeSha}?recursive=1`
    );
    if (!scaffoldTreeRes.ok) {
      throw new Error("Failed to get repository tree");
    }
    const fullTree = await scaffoldTreeRes.json();
    const scaffoldPrefix = "packages/template-core/scaffold/pages/";
    const scaffoldEntries: Array<{ path: string; sha: string; mode: string }> =
      (fullTree.tree as Array<{ path: string; sha: string; mode: string; type: string }>)
        .filter(
          (item) =>
            item.path.startsWith(scaffoldPrefix) && item.type === "blob"
        )
        .map((item) => ({
          path: item.path.slice(scaffoldPrefix.length), // relative path within pages/
          sha: item.sha,
          mode: item.mode,
        }));

    // 1d) Create blobs for the config files
    const configFiles: Array<{ path: string; content: string }> = [
      { path: "package.json", content: generatePackageJson(slug) },
      { path: "astro.config.mjs", content: generateAstroConfig() },
      { path: "tsconfig.json", content: generateTsConfig() },
      { path: ".env.example", content: generateEnvExample(slug) },
    ];

    const configBlobShas: Array<{ path: string; sha: string }> = [];
    for (const file of configFiles) {
      const blobRes = await githubApi(
        githubToken,
        `${repoPath}/git/blobs`,
        {
          method: "POST",
          body: JSON.stringify({
            content: file.content,
            encoding: "utf-8",
          }),
        }
      );
      if (!blobRes.ok) {
        const body = await blobRes.json();
        throw new Error(
          `Failed to create blob for ${file.path}: ${body?.message || blobRes.status}`
        );
      }
      const blobData = await blobRes.json();
      configBlobShas.push({ path: file.path, sha: blobData.sha });
    }

    // 1e) Build the new tree containing all chapter folder files
    const treeItems = [
      // Config files (new blobs)
      ...configBlobShas.map((item) => ({
        path: `${chapterFolder}/${item.path}`,
        mode: "100644" as const,
        type: "blob" as const,
        sha: item.sha,
      })),
      // Scaffold page files (reuse existing blob SHAs — no re-upload needed)
      ...scaffoldEntries.map((item) => ({
        path: `${chapterFolder}/src/pages/${item.path}`,
        mode: item.mode as "100644",
        type: "blob" as const,
        sha: item.sha,
      })),
    ];

    const newTreeRes = await githubApi(
      githubToken,
      `${repoPath}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );
    if (!newTreeRes.ok) {
      const body = await newTreeRes.json();
      throw new Error(
        `Failed to create tree: ${body?.message || newTreeRes.status}`
      );
    }
    const newTreeData = await newTreeRes.json();
    const newTreeSha: string = newTreeData.sha;

    // 1f) Create the provision branch from main HEAD
    const provisionBranch = `provision/${slug}`;
    const createBranchRes = await githubApi(
      githubToken,
      `${repoPath}/git/refs`,
      {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${provisionBranch}`,
          sha: mainHeadSha,
        }),
      }
    );
    if (!createBranchRes.ok) {
      const body = await createBranchRes.json();
      throw new Error(
        `Failed to create provision branch: ${body?.message || createBranchRes.status}`
      );
    }

    // 1g) Create a commit on the provision branch
    const commitRes = await githubApi(
      githubToken,
      `${repoPath}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({
          message: `chore: scaffold chapter ${chapterFolder}`,
          tree: newTreeSha,
          parents: [mainHeadSha],
        }),
      }
    );
    if (!commitRes.ok) {
      const body = await commitRes.json();
      throw new Error(
        `Failed to create commit: ${body?.message || commitRes.status}`
      );
    }
    const commitData = await commitRes.json();
    const newCommitSha: string = commitData.sha;

    // 1h) Update the provision branch ref to point to the new commit
    const updateRefRes = await githubApi(
      githubToken,
      `${repoPath}/git/refs/heads/${provisionBranch}`,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: newCommitSha }),
      }
    );
    if (!updateRefRes.ok) {
      const body = await updateRefRes.json();
      throw new Error(
        `Failed to update branch ref: ${body?.message || updateRefRes.status}`
      );
    }

    // 1i) Merge the provision branch to main
    const mergeRes = await githubApi(
      githubToken,
      `${repoPath}/merges`,
      {
        method: "POST",
        body: JSON.stringify({
          base: "main",
          head: provisionBranch,
          commit_message: `chore: scaffold chapter ${chapterFolder}`,
        }),
      }
    );
    if (!mergeRes.ok) {
      const body = await mergeRes.json();
      throw new Error(
        `Failed to merge provision branch: ${body?.message || mergeRes.status}`
      );
    }

    // 1j) Delete the provision branch (cleanup)
    await githubApi(
      githubToken,
      `${repoPath}/git/refs/heads/${provisionBranch}`,
      { method: "DELETE" }
    );
    // Branch deletion is best-effort; do not fail if it errors.

    // =======================================================================
    // STEP 2 — Create the Cloudflare Pages project
    // =======================================================================

    const projectName = `wial-${slug}`;
    const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/pages/projects`;
    const cfHeaders = {
      Authorization: `Bearer ${cloudflareApiToken}`,
      "Content-Type": "application/json",
    };

    // 2a) Fetch GitHub repo metadata for numeric IDs (required for source config)
    const ghRepoRes = await githubApi(githubToken, `${repoPath}`);
    if (!ghRepoRes.ok) {
      throw new Error("Failed to fetch GitHub repo metadata for Cloudflare integration");
    }
    const ghRepoData = await ghRepoRes.json();
    const repoId = ghRepoData.id; // numeric
    const ownerId = ghRepoData.owner?.id; // numeric

    const watchPathIncludes = [
      `${chapterFolder}/*`,
      `${chapterFolder}/**`,
      "packages/*",
      "packages/**",
    ];

    const envVars = {
      PUBLIC_SUPABASE_URL: { value: supabaseUrl, type: "plain_text" },
      SUPABASE_URL: { value: supabaseUrl, type: "plain_text" },
      SUPABASE_SERVICE_ROLE_KEY: {
        value: serviceRoleKey,
        type: "secret_text",
      },
      CHAPTER_SLUG: { value: slug, type: "plain_text" },
    };

    const createProjectRes = await fetch(cfBaseUrl, {
      method: "POST",
      headers: cfHeaders,
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
        build_config: {
          build_command: `cd ${chapterFolder} && npm install && npx astro build`,
          destination_dir: `${chapterFolder}/dist`,
          root_dir: "",
          build_caching: true,
        },
        source: {
          type: "github",
          config: {
            owner: githubOwner,
            repo_name: githubRepo,
            owner_id: ownerId,
            repo_id: repoId,
            production_branch: "main",
            pr_comments_enabled: true,
            deployments_enabled: true,
            production_deployments_enabled: true,
            preview_deployment_setting: "all",
            preview_branch_includes: ["*"],
            preview_branch_excludes: [],
            path_includes: watchPathIncludes,
            path_excludes: [],
          },
        },
        deployment_configs: {
          production: {
            env_vars: envVars,
          },
          preview: {
            env_vars: envVars,
          },
        },
      }),
    });

    const createProjectData = await createProjectRes.json();

    if (!createProjectRes.ok) {
      const errorMsg =
        createProjectData?.errors?.[0]?.message ||
        "Failed to create Cloudflare Pages project";
      return new Response(
        JSON.stringify({
          error: errorMsg,
          details: createProjectData,
          note: "GitHub scaffold succeeded but Cloudflare project creation failed. Retry provisioning.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const watchPathsWarning: string | null = null;

    // =======================================================================
    // STEP 3 — Configure custom domain
    // =======================================================================

    const domainRes = await fetch(
      `${cfBaseUrl}/${projectName}/domains`,
      {
        method: "POST",
        headers: cfHeaders,
        body: JSON.stringify({ name: customDomain }),
      }
    );

    const domainData = await domainRes.json();
    const domainWarning = !domainRes.ok
      ? `Custom domain setup needs attention: ${domainData?.errors?.[0]?.message || "unknown error"}`
      : null;

    // Resolve zone ID: prefer explicit env var, then auto-detect from domain
    const cloudflareZoneId = explicitCloudflareZoneId
      ? explicitCloudflareZoneId
      : await resolveZoneIdForDomain(cloudflareApiToken, customDomain);

    let dnsWarning: string | null = null;
    if (!cloudflareZoneId) {
      dnsWarning = `Could not resolve Cloudflare zone ID for ${customDomain}; CNAME record was not created. Set CLOUDFLARE_ZONE_ID env var.`;
    } else {
      dnsWarning = await ensureCnameRecord(
        cloudflareApiToken,
        cloudflareZoneId,
        customDomain,
        `${projectName}.pages.dev`
      );
    }

    // =======================================================================
    // STEP 4 — Update chapter record
    // =======================================================================

    const { error: updateError } = await supabase
      .from("chapters")
      .update({
        cloudflare_project_name: projectName,
        cloudflare_deploy_hook_url: null, // deploy hooks retired
        github_folder_path: chapterFolder,
      })
      .eq("id", chapter_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error:
            "Cloudflare project created but failed to update chapter record",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =======================================================================
    // STEP 5 — No deploy hook trigger needed.
    // The merge to main triggers Cloudflare auto-deploy via GitHub integration.
    // =======================================================================

    return new Response(
      JSON.stringify({
        success: true,
        project_name: projectName,
        github_folder_path: chapterFolder,
        custom_domain: customDomain,
        scaffold_commit_sha: newCommitSha,
        domain_warning: domainWarning,
        watch_paths_warning: watchPathsWarning,
        dns_warning: dnsWarning,
        build_watch_paths: watchPathIncludes,
        auto_deploy: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
