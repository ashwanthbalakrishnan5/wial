import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";

async function githubApi(path: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_REPO || "ashwanthbk/wial-chapters";
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

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const chapterId = body?.chapterId;
  if (!chapterId) {
    return NextResponse.json(
      { error: "chapterId is required" },
      { status: 400 }
    );
  }

  // Authorization
  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, chapterId);
  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select(
      "id, name, slug, subdomain, cloudflare_project_name, github_folder_path"
    )
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (!chapter.cloudflare_project_name || !chapter.github_folder_path) {
    return NextResponse.json(
      {
        error:
          "Chapter has not been provisioned. Provision the chapter first.",
      },
      { status: 422 }
    );
  }

  // Check no build is already in progress (exclude AI edit sessions)
  const { data: existing } = await supabase
    .from("deployments")
    .select("id")
    .eq("chapter_id", chapterId)
    .in("status", ["queued", "building", "deploying"])
    .is("approval_status", null)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A deployment is already in progress. Wait for it to finish." },
      { status: 409 }
    );
  }

  // Create deployment record
  const { data: deployment, error: insertError } = await supabase
    .from("deployments")
    .insert({
      chapter_id: chapterId,
      triggered_by: user.id,
      status: "queued",
    })
    .select()
    .single();

  if (insertError || !deployment) {
    return NextResponse.json(
      { error: "Failed to create deployment record" },
      { status: 500 }
    );
  }

  // Trigger deployment by pushing a deploy-trigger file to the chapter folder
  // on main. Cloudflare auto-deploys via build watch paths.
  try {
    const triggerPath = `${chapter.github_folder_path}/.deploy-trigger`;

    // Get main branch HEAD SHA
    const refRes = await githubApi("/git/ref/heads/main");
    if (!refRes.ok) throw new Error("Failed to get main branch reference");
    const refData = await refRes.json();
    const mainSha = refData.object.sha;

    // Get current tree
    const commitRes = await githubApi(`/git/commits/${mainSha}`);
    const commitData = await commitRes.json();

    // Create blob with timestamp
    const blobRes = await githubApi("/git/blobs", {
      method: "POST",
      body: JSON.stringify({
        content: `Deploy triggered at ${new Date().toISOString()} by ${user.id}`,
        encoding: "utf-8",
      }),
    });
    const blobData = await blobRes.json();

    // Create tree with trigger file
    const treeRes = await githubApi("/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: commitData.tree.sha,
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

    // Create commit
    const newCommitRes = await githubApi("/git/commits", {
      method: "POST",
      body: JSON.stringify({
        message: `chore: trigger deploy for ${chapter.slug}`,
        tree: treeData.sha,
        parents: [mainSha],
      }),
    });
    const newCommitData = await newCommitRes.json();

    // Push to main
    const updateRefRes = await githubApi("/git/refs/heads/main", {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommitData.sha }),
    });

    if (!updateRefRes.ok) throw new Error("Failed to push to main");

    // Move to building
    await supabase
      .from("deployments")
      .update({
        status: "building",
        commit_reference: newCommitData.sha,
        deploy_url: `https://${chapter.subdomain}`,
      })
      .eq("id", deployment.id);
  } catch (err) {
    await supabase
      .from("deployments")
      .update({
        status: "failed",
        error_message:
          err instanceof Error ? err.message : "Failed to trigger deployment",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);
    return NextResponse.json(
      { error: "Failed to trigger deployment" },
      { status: 502 }
    );
  }

  return NextResponse.json({ deploymentId: deployment.id });
}
