import { NextRequest, NextResponse } from "next/server";
import { getRecipe } from "@/lib/wire/recipes";
import { getSavedPatch } from "@/lib/wire/patches-store";
import { getUserConfig, CONFIG_KEYS } from "@/lib/wire/user-config-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/wire/patches/[id]/skill?userId=…
 *
 * Returns a Cursor- / Claude Code-compatible skill markdown for any patch
 * (built-in or user-saved). Drop into `.cursor/skills/<name>.md` or
 * `.claude/skills/<name>/skill.md` and the agent gains a callable tool.
 *
 * The skill body holds a curl that hits /api/wire/run/<id> on yappr's
 * production deployment with the user's stored projectId. No keys leak —
 * the actual Peec / Composio credentials stay server-side under their
 * yappr.userId, which the curl carries.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = req.nextUrl.searchParams.get("userId") || "";
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const recipe = getRecipe(id);
  const saved = recipe ? null : await getSavedPatch(id);
  if (!recipe && !saved) return NextResponse.json({ ok: false, error: "patch not found" }, { status: 404 });

  const name = recipe?.name ?? saved?.name ?? "Yappr patch";
  const description = recipe?.description ?? `User-saved canvas patch with ${saved?.nodes?.length ?? 0} nodes.`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "yappr-patch";

  const projectId = await getUserConfig(userId, CONFIG_KEYS.peec.projectId, "PEEC_PROJECT_ID");
  const projectName = await getUserConfig(userId, CONFIG_KEYS.peec.projectName);
  const host = req.nextUrl.host;
  const protocol = req.nextUrl.protocol.replace(":", "");
  const base = `${protocol}://${host}`;
  const runUrl = `${base}/api/wire/run/${id}`;

  const md = `---
name: yappr-${slug}
description: ${description.replace(/\n/g, " ")}
---

# ${name}

${description}

This skill fires a saved [yappr](${base}) Wire patch on your behalf. Yappr handles the Peec MCP reads, agent reasoning, and Composio MCP writes — you just invoke it from your editor.

## When to use

Invoke this skill when the user asks to run "${name}" or describes the underlying workflow${recipe ? ` (${recipe.reads?.[0] ?? ""}${recipe.writes ? ` → ${recipe.writes}` : ""}).` : "."}

## How to fire it

POST to the run endpoint. Yappr resolves the user's stored Peec key, project, and Composio connections automatically — no keys in this skill file.

\`\`\`bash
curl -sS -X POST '${runUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "${userId}",
    "projectId": "${projectId ?? "<paste your project id>"}"
  }'
\`\`\`

The response is a \`Run\` object with shape:

\`\`\`json
{
  "ok": true,
  "run": {
    "id": "run_…",
    "status": "success | failed | no-op",
    "message": "human-readable summary",
    "artifactUrl": "https://… (link to PR / Slack thread / Linear issue / etc.)",
    "artifactLabel": "Open artifact ↗",
    "trace": ["step 1", "step 2", "…"]
  }
}
\`\`\`

After running, surface the \`message\` and the \`artifactUrl\` (if present) to the user. If \`status === "failed"\`, read \`error\` and explain what blocked it.

## Context

- Yappr user id: \`${userId}\`
- Active Peec project: \`${projectName ?? projectId ?? "(none configured)"}\`
- Run history + status is visible at ${base}/studio (Wire tab → Run feed).
`;

  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `attachment; filename="yappr-${slug}.md"`,
    "Cache-Control": "no-store",
  });
  return new NextResponse(md, { headers });
}
