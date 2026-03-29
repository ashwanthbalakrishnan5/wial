import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function githubApi(path: string, options: RequestInit = {}) {
  const token = Deno.env.get("GITHUB_TOKEN")!;
  const repo = Deno.env.get("GITHUB_REPO") || "ashwanthbk/wial-chapters";
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  return res;
}

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate caller
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

    const { chapter_id } = await req.json();
    if (!chapter_id) {
      return new Response(JSON.stringify({ error: "chapter_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: super_admin or chapter_lead for this chapter
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = roles?.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      const { data: chapterRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("chapter_id", chapter_id)
        .single();

      if (!chapterRole || chapterRole.role !== "chapter_lead") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Read chapter
    const { data: chapter } = await supabase
      .from("chapters")
      .select(
        "id, slug, subdomain, cloudflare_project_name, github_folder_path"
      )
      .eq("id", chapter_id)
      .single();

    if (!chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chapter.cloudflare_project_name || !chapter.github_folder_path) {
      return new Response(
        JSON.stringify({
          error:
            "Chapter has not been provisioned yet. Provision the chapter first.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for in-progress deployment (exclude AI edit sessions)
    const { data: existing } = await supabase
      .from("deployments")
      .select("id")
      .eq("chapter_id", chapter_id)
      .in("status", ["queued", "building", "deploying"])
      .is("approval_status", null)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "A deployment is already in progress." }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create deployment record
    const { data: deployment, error: insertError } = await supabase
      .from("deployments")
      .insert({ chapter_id, triggered_by: user.id, status: "queued" })
      .select()
      .single();

    if (insertError || !deployment) {
      return new Response(
        JSON.stringify({ error: "Failed to create deployment record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Trigger deployment via GitHub API: create an empty commit to the chapter
    // folder that triggers Cloudflare auto-deploy via build watch paths.
    // We create a commit that touches a .deploy-trigger file in the chapter folder.
    const triggerPath = `${chapter.github_folder_path}/.deploy-trigger`;

    // Get current main branch SHA
    const refRes = await githubApi("/git/ref/heads/main");
    if (!refRes.ok) {
      await supabase
        .from("deployments")
        .update({
          status: "failed",
          error_message: "Failed to get main branch reference",
          completed_at: new Date().toISOString(),
        })
        .eq("id", deployment.id);
      return new Response(
        JSON.stringify({ error: "Failed to get main branch reference" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const refData = await refRes.json();
    const mainSha = refData.object.sha;

    // Get the current tree
    const commitRes = await githubApi(`/git/commits/${mainSha}`);
    const commitData = await commitRes.json();
    const treeSha = commitData.tree.sha;

    // Create a blob with timestamp to ensure unique content
    const blobRes = await githubApi("/git/blobs", {
      method: "POST",
      body: JSON.stringify({
        content: `Deploy triggered at ${new Date().toISOString()} by ${user.id}`,
        encoding: "utf-8",
      }),
    });
    const blobData = await blobRes.json();

    // Create a new tree with the trigger file
    const treeRes = await githubApi("/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: treeSha,
        tree: [
          {
            path: triggerPath,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          },
        ],
      }),
    });
    const treeData = await treeRes.json();

    // Create the commit
    const newCommitRes = await githubApi("/git/commits", {
      method: "POST",
      body: JSON.stringify({
        message: `chore: trigger deploy for ${chapter.slug}`,
        tree: treeData.sha,
        parents: [mainSha],
      }),
    });
    const newCommitData = await newCommitRes.json();

    // Update main branch ref
    const updateRefRes = await githubApi("/git/refs/heads/main", {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommitData.sha }),
    });

    if (!updateRefRes.ok) {
      await supabase
        .from("deployments")
        .update({
          status: "failed",
          error_message: "Failed to push deploy trigger to main",
          completed_at: new Date().toISOString(),
        })
        .eq("id", deployment.id);

      return new Response(
        JSON.stringify({
          error: "Failed to trigger deployment",
          deployment_id: deployment.id,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update to building - Cloudflare will auto-deploy from the push to main
    await supabase
      .from("deployments")
      .update({
        status: "building",
        commit_reference: newCommitData.sha,
        deploy_url: `https://${chapter.subdomain}`,
      })
      .eq("id", deployment.id);

    return new Response(
      JSON.stringify({ success: true, deployment_id: deployment.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
