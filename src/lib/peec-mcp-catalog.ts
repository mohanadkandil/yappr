/**
 * Peec MCP tool catalog — every tool the Peec MCP Server exposes.
 *
 * Source: https://docs.peec.ai/mcp/tools (mirrored 2026-04-26).
 *
 * Used by:
 *  - Wire canvas properties panel — sub-picker when user selects a peec-read
 *    or peec-write node, so they can pick the exact tool.
 *  - /api/wire/synthesize-patch — system prompt embeds this so the LLM can
 *    craft graphs that name the right tool slug per node.
 */

export type PeecToolKind = "read" | "write";

export type PeecTool = {
  slug: string;            // e.g., "get_brand_report"
  kind: PeecToolKind;
  label: string;           // human-readable button text
  /** One-line description shown under the button + sent to the LLM. */
  description: string;
  /** Key params (excluding project_id, start/end_date) — for the LLM. */
  params?: string[];
  /** Whether the tool is destructive (used to gate write nodes in the UI). */
  destructive?: boolean;
};

export const PEEC_READ_TOOLS: PeecTool[] = [
  { slug: "list_projects",        kind: "read", label: "List projects",        description: "Lists all projects your account has access to. Always called first." },
  { slug: "list_brands",          kind: "read", label: "List brands",          description: "Lists brand DEFINITIONS only (names + ids). Does NOT include citation counts. Use get_brand_report for visibility/sentiment/share-of-voice.", params: ["limit", "offset"] },
  { slug: "list_topics",          kind: "read", label: "List topics",          description: "Lists topic DEFINITIONS only (names + ids). For per-topic visibility/citations use get_brand_report or get_url_report with topic_id dimension.", params: ["limit", "offset"] },
  { slug: "list_tags",            kind: "read", label: "List tags",            description: "Lists tags (cross-cutting prompt labels).", params: ["limit", "offset"] },
  { slug: "list_models",          kind: "read", label: "List models",          description: "Lists AI engines (ChatGPT, Perplexity, etc.) configured for this project." },
  { slug: "list_prompts",         kind: "read", label: "List prompts",         description: "Lists prompt DEFINITIONS only (text + ids). Does NOT include citation counts. For citation gaps use get_url_report.", params: ["topic_id", "tag_id", "limit", "offset"] },
  { slug: "list_chats",           kind: "read", label: "List chats",           description: "Lists individual AI responses for a date range. One chat = one prompt × one engine × one date.", params: ["start_date", "end_date", "brand_id", "prompt_id", "model_id"] },
  { slug: "get_chat",             kind: "read", label: "Get chat",             description: "Full content of one chat: response text, every source URL, brands, queries, products.", params: ["chat_id"] },
  { slug: "list_search_queries",  kind: "read", label: "List search queries",  description: "Sub-queries an AI engine fanned out to while answering. One row = one sub-query.", params: ["start_date", "end_date", "prompt_id", "chat_id", "model_id"] },
  { slug: "list_shopping_queries", kind: "read", label: "List shopping queries", description: "Product/shopping sub-queries with the distinct products returned.", params: ["start_date", "end_date", "prompt_id", "chat_id"] },
  { slug: "get_brand_report",     kind: "read", label: "Brand report",         description: "PRIMARY tool for brand-level signal: visibility, sentiment, position, share-of-voice across AI engines. Use this when the user asks about how their brand is performing, anomalies, or competitor surge.", params: ["start_date", "end_date", "dimensions", "filters"] },
  { slug: "get_domain_report",    kind: "read", label: "Domain report",        description: "Domain-level citation signal (e.g. youtube.com vs reddit.com). Use when the user wants UGC/editorial source insight rather than per-URL detail.", params: ["start_date", "end_date", "dimensions", "filters"] },
  { slug: "get_url_report",       kind: "read", label: "URL report",           description: "PRIMARY tool for URL-level citation signal. Returns mentioned_brand_ids per URL. Use this when the user asks about citation gaps (where competitors are cited and they are absent), schema gaps, or content recommendations. Supports gap filter (mentioned_brand_count >= N).", params: ["start_date", "end_date", "dimensions", "filters"] },
  { slug: "get_url_content",      kind: "read", label: "Get URL content",      description: "Scraped markdown of a Peec-indexed source URL. Useful for content gap analysis.", params: ["url", "max_length"] },
  { slug: "get_actions",          kind: "read", label: "Get actions",          description: "Peec's opportunity-scored recommendations. Two-step: scope=overview first, then drill into owned/editorial/reference/ugc.", params: ["start_date", "end_date", "scope", "tag_ids", "topic_ids"] },
];

export const PEEC_WRITE_TOOLS: PeecTool[] = [
  { slug: "create_brand",   kind: "write", label: "Create brand",   description: "Create a tracked brand (your own or a competitor).", params: ["name", "domains", "aliases", "regex"] },
  { slug: "update_brand",   kind: "write", label: "Update brand",   description: "Update a brand's name, regex, aliases, or domains.", params: ["brand_id", "name", "domains", "aliases", "regex"] },
  { slug: "delete_brand",   kind: "write", label: "Delete brand",   description: "Soft-delete a brand.", params: ["brand_id"], destructive: true },
  { slug: "create_prompt",  kind: "write", label: "Create prompt",  description: "Create a new tracked prompt. May consume plan credits.", params: ["text", "country_code", "topic_id", "tag_ids"] },
  { slug: "update_prompt",  kind: "write", label: "Update prompt",  description: "Update a prompt's topic and/or tags.", params: ["prompt_id", "topic_id", "tag_ids"] },
  { slug: "delete_prompt",  kind: "write", label: "Delete prompt",  description: "Soft-delete a prompt. Cascades to its chats.", params: ["prompt_id"], destructive: true },
  { slug: "create_tag",     kind: "write", label: "Create tag",     description: "Create a cross-cutting tag.", params: ["name", "color"] },
  { slug: "update_tag",     kind: "write", label: "Update tag",     description: "Rename or recolor a tag.", params: ["tag_id", "name", "color"] },
  { slug: "delete_tag",     kind: "write", label: "Delete tag",     description: "Soft-delete a tag and detach it from every prompt.", params: ["tag_id"], destructive: true },
  { slug: "create_topic",   kind: "write", label: "Create topic",   description: "Create a topic to group related prompts.", params: ["name", "country_code"] },
  { slug: "update_topic",   kind: "write", label: "Update topic",   description: "Rename a topic.", params: ["topic_id", "name"] },
  { slug: "delete_topic",   kind: "write", label: "Delete topic",   description: "Soft-delete a topic; associated prompts are detached.", params: ["topic_id"], destructive: true },
];

export const PEEC_TOOLS_ALL: PeecTool[] = [...PEEC_READ_TOOLS, ...PEEC_WRITE_TOOLS];

export function findPeecTool(slug: string): PeecTool | undefined {
  return PEEC_TOOLS_ALL.find((t) => t.slug === slug);
}

/** Compact catalog for embedding in the synthesizer system prompt. */
export function peecCatalogForPrompt(): string {
  const reads = PEEC_READ_TOOLS.map((t) =>
    `  - ${t.slug}: ${t.description}${t.params?.length ? ` (params: ${t.params.join(", ")})` : ""}`,
  ).join("\n");
  const writes = PEEC_WRITE_TOOLS.map((t) =>
    `  - ${t.slug}${t.destructive ? " [destructive]" : ""}: ${t.description}${t.params?.length ? ` (params: ${t.params.join(", ")})` : ""}`,
  ).join("\n");
  return `Peec MCP READ tools (peec-read nodes):\n${reads}\n\nPeec MCP WRITE tools (peec-write nodes — destructive ones require user confirmation):\n${writes}`;
}
