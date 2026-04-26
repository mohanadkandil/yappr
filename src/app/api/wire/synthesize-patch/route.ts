import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { peecCatalogForPrompt, PEEC_READ_TOOLS, PEEC_WRITE_TOOLS, findPeecTool } from "@/lib/peec-mcp-catalog";
import { agentCatalogForPrompt, findAgent, AGENTS } from "@/lib/agent-catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * POST /api/wire/synthesize-patch
 *
 * Two-pass to suppress hallucination:
 *  1. PLAN — model picks tools from the literal catalogs. Slugs are constrained
 *     by Zod enums to the exact catalogs, so fabricated names cannot pass.
 *  2. GRAPH — server-side projection of the validated plan into nodes + edges.
 *     No second LLM call.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  }

  let body: { prompt?: string } = {};
  try { body = await req.json(); } catch {}
  const userPrompt = (body.prompt || "").trim();
  if (!userPrompt) return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 });

  const peecReadSlugs = PEEC_READ_TOOLS.map((t) => t.slug) as [string, ...string[]];
  const peecWriteSlugs = PEEC_WRITE_TOOLS.map((t) => t.slug) as [string, ...string[]];
  const agentSlugs = AGENTS.map((a) => a.slug) as [string, ...string[]];

  const planSchema = z.object({
    reasoning: z.array(z.string())
      .describe("2-5 short sentences explaining tool choices, in order. Each entry references the user's request directly."),
    patchName: z.string().describe("3-5 words, lowercase ok, summarizing the intent"),
    trigger: z.object({
      kind: z.enum(["cron", "anomaly"]),
      config: z.string().describe("e.g. 'Daily · 09:00' or 'Visibility ≥ 2σ drop'"),
    }),
    peecReads: z.array(z.object({
      slug: z.enum(peecReadSlugs),
      paramHint: z.string().describe("params/filters in parens, e.g. 'DIM=topic_id, last 30d'"),
      why: z.string(),
    })).describe("Peec MCP read tools needed, in execution order."),
    peecWrites: z.array(z.object({
      slug: z.enum(peecWriteSlugs),
      why: z.string(),
    })).describe("Peec MCP write tools the user explicitly asked for. Empty if none."),
    agent: z.object({
      slug: z.enum(agentSlugs),
      why: z.string(),
    }).nullable().describe("The agent that decides what to do with the data, or null if none is needed."),
    actions: z.array(z.object({
      tool: z.enum(["github", "slack", "notion", "linear", "gmail"]),
      artifact: z.string().describe("e.g. 'GitHub PR', 'Slack message', 'Linear issue'"),
      why: z.string(),
    })).describe("External Composio tools the workflow ends with. One per artifact."),
  });

  const system = `You are yappr Wire's planner. Given a user's automation request, reason about which Peec MCP read/write tools are needed, which agent (if any) should run, and which external tool ships the artifact. Only reference tools that exist in the catalogs below — never invent slugs.

PEEC MCP TOOL CATALOG:
${peecCatalogForPrompt()}

AGENT CATALOG:
${agentCatalogForPrompt()}

EXTERNAL TOOL CATALOG (Composio MCP, used in action nodes):
  - github: open PRs, file issues, commit files
  - slack:  post to channels, send DMs, add reactions
  - notion: create/update pages, add database rows
  - linear: create/update issues, add comments
  - gmail:  draft and send emails

RULES:
- Pick the smallest set of tools that actually answers the user's request.
- For citation gaps / "competitors are cited but I'm not" / which pages to fix: use get_url_report (it returns mentioned_brand_ids per URL).
- For brand-level performance, anomalies, share of voice: use get_brand_report.
- For UGC / editorial source insight: use get_domain_report.
- The list_* tools return DEFINITIONS only — never use them to answer "what's happening" or "find gaps". Use them only when the user explicitly asks for a list of brands/prompts/topics.
- Never include destructive Peec write tools (delete_*) unless the user explicitly asked.
- Each "reasoning" item should be a single short sentence tied to the user's words.`;

  let plan: z.infer<typeof planSchema>;
  try {
    const openrouter = createOpenRouter({ apiKey });
    const result = await generateObject({
      model: openrouter(modelId),
      schema: planSchema,
      system,
      prompt: userPrompt,
      temperature: 0.2,
    });
    plan = result.object;
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  // Defense-in-depth: drop anything that somehow slipped past the strict enums.
  let peecReads = plan.peecReads.filter((r) => findPeecTool(r.slug)?.kind === "read");
  const peecWrites = plan.peecWrites.filter((w) => findPeecTool(w.slug)?.kind === "write");
  const agent = plan.agent && findAgent(plan.agent.slug) ? plan.agent : null;

  // Guard: agents that need citation signal must have a *_report read upstream.
  // If the LLM picked only list_* tools (definitions), graft on the right report.
  const SIGNAL_REPORTS = new Set(["get_url_report", "get_brand_report", "get_domain_report"]);
  const needsSignal = agent?.slug && [
    "citation-hunter", "competitor-counter", "anomaly-autopsy",
    "executive-brief", "schema-author", "pr-narrator",
  ].includes(agent.slug);
  if (needsSignal && !peecReads.some((r) => SIGNAL_REPORTS.has(r.slug))) {
    const fallbackSlug = agent.slug === "anomaly-autopsy" ? "get_brand_report" : "get_url_report";
    peecReads = [
      ...peecReads,
      { slug: fallbackSlug, paramHint: "last 30d", why: `auto-added: ${agent.slug} needs citation signal, not just definitions` },
    ];
  }

  // -------------------------- GRAPH PROJECTION ------------------------------

  const COL_X = [60, 320, 580, 840, 1100];
  const ROW_GAP = 130;
  const colCounts = new Map<number, number>();
  const positionAt = (column: number) => {
    const idx = colCounts.get(column) ?? 0;
    colCounts.set(column, idx + 1);
    return { x: COL_X[Math.min(column, COL_X.length - 1)], y: 60 + idx * ROW_GAP };
  };

  type GraphNode = {
    id: string;
    kind: "trigger-cron" | "trigger-anomaly" | "peec-read" | "peec-write" | "claude-think" | "action";
    label: string;
    config: string;
    toolSlug?: string;
    agentSlug?: string;
    prompt?: string;
    x: number;
    y: number;
  };
  const nodes: GraphNode[] = [];
  const edges: { from: string; to: string }[] = [];

  const triggerKind: GraphNode["kind"] = plan.trigger.kind === "anomaly" ? "trigger-anomaly" : "trigger-cron";
  const triggerId = "trigger";
  nodes.push({
    id: triggerId,
    kind: triggerKind,
    label: triggerKind === "trigger-cron" ? "Schedule" : "Anomaly trigger",
    config: plan.trigger.config,
    ...positionAt(0),
  });

  const readIds: string[] = [];
  peecReads.forEach((r, i) => {
    const t = findPeecTool(r.slug)!;
    const id = `read-${i + 1}`;
    readIds.push(id);
    nodes.push({
      id,
      kind: "peec-read",
      label: `Peec · ${t.label}`,
      config: r.paramHint ? `${r.slug} (${r.paramHint})` : r.slug,
      ...positionAt(1),
    });
    edges.push({ from: triggerId, to: id });
  });

  let agentId: string | null = null;
  if (agent) {
    const a = findAgent(agent.slug)!;
    agentId = "agent";
    nodes.push({
      id: agentId,
      kind: "claude-think",
      label: a.name,
      config: a.slug,
      agentSlug: a.slug,
      prompt: a.systemPrompt,
      ...positionAt(2),
    });
    if (readIds.length === 0) edges.push({ from: triggerId, to: agentId });
    else for (const rid of readIds) edges.push({ from: rid, to: agentId });
  }

  peecWrites.forEach((w, i) => {
    const t = findPeecTool(w.slug)!;
    const id = `write-${i + 1}`;
    nodes.push({
      id,
      kind: "peec-write",
      label: `Peec · ${t.label}`,
      config: w.slug,
      ...positionAt(3),
    });
    const upstream = agentId ?? readIds[readIds.length - 1] ?? triggerId;
    edges.push({ from: upstream, to: id });
  });

  plan.actions.forEach((act, i) => {
    const id = `act-${i + 1}`;
    nodes.push({
      id,
      kind: "action",
      label: act.artifact,
      config: `Composio · ${act.tool.toUpperCase()}`,
      toolSlug: act.tool,
      ...positionAt(3),
    });
    const upstream = agentId ?? readIds[readIds.length - 1] ?? triggerId;
    edges.push({ from: upstream, to: id });
  });

  return NextResponse.json({
    ok: true,
    patchName: plan.patchName,
    nodes,
    edges,
    reasoning: plan.reasoning,
    plan,
    model: modelId,
  });
}
