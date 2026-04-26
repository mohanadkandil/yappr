/**
 * Agent catalog — purposeful "claude-think" agents the user can drop into a
 * patch. Each entry has a name, a one-line problem statement, a system prompt
 * (task + rules only), and an editable output schema (drives structured
 * outputs at execution time). The synthesizer also reads this catalog to pick
 * agents when generating workflows from a description.
 *
 * Add new agents here; they automatically show up in the canvas picker and
 * in the synthesizer's system prompt.
 */

export type AgentInputHint = "brand_report" | "url_report" | "domain_report" | "chat" | "search_queries" | "url_content" | "actions" | "free";

/** A single field in the agent's structured output. The canvas surfaces these
 * as editable rows; at execution time they're compiled into a JSON schema. */
export type OutputField = {
  name: string;
  type: "string" | "number" | "boolean" | "markdown" | "string[]" | "object[]";
  description: string;
};

export type Agent = {
  slug: string;
  name: string;
  pigment: string;          // hex without the leading #
  /** One-liner shown under the agent button + included in synthesizer prompt. */
  description: string;
  /** What upstream nodes typically feed this agent — for documentation only. */
  inputs: AgentInputHint[];
  /** Default editable output schema. Each field becomes a row in the canvas UI. */
  outputFields: OutputField[];
  /** The default system prompt — task + rules only, NO output schema (it lives
   * in outputFields). User can override per-node-instance. */
  systemPrompt: string;
};

export const AGENTS: Agent[] = [
  {
    slug: "citation-hunter",
    name: "Citation Hunter",
    pigment: "B5601E",
    description: "Finds prompts where competitors are cited but you are not, and ranks them by opportunity.",
    inputs: ["url_report", "brand_report"],
    outputFields: [
      { name: "gaps", type: "object[]", description: "Top opportunity gaps. Each item: { prompt_or_topic, gap_competitors[], opportunity_score (0..1), why }" },
    ],
    systemPrompt: `You are Citation Hunter. You receive a Peec URL/brand report and identify the highest-opportunity citation gaps.

Tasks:
1. First pass — find URLs where ANY competitor brand is mentioned but the user's own brand is absent. Prefer URLs with 2+ competitors when available.
2. If the first pass produces fewer than 3 gaps, fall back: surface the most-cited URLs in the upstream data and label them as "high-traffic to monitor" via the why field, even if no own-brand gap exists.
3. Score each by: citation_count × competitor_density × topic_relevance.
4. Always return at least 3 entries when any upstream data is present, and at most 7.
5. The why field MUST name the specific URL or topic from the upstream data — never invent.

Tone: ruthless but helpful. Every entry is something the user can act on this week.`,
  },
  {
    slug: "schema-author",
    name: "Schema.org Author",
    pigment: "2F8466",
    description: "Drafts JSON-LD schema (FAQPage / HowTo / Product) for a top-cited prompt's answer.",
    inputs: ["chat", "url_content"],
    outputFields: [
      { name: "json_ld", type: "string", description: "Full <script type=\"application/ld+json\">...</script> block ready to paste into a page" },
      { name: "schema_type", type: "string", description: "Which schema.org type was used: FAQPage | HowTo | Product | Article" },
      { name: "rationale", type: "string", description: "One sentence on why this schema fits the answer pattern" },
    ],
    systemPrompt: `You are Schema.org Author. You read an AI chat response and the canonical page content, then produce JSON-LD that mirrors the answer pattern AI engines reward.

Choose the right type:
- Q&A patterns → FAQPage with mainEntity[]
- Step-by-step → HowTo with step[]
- Product comparison → Product + AggregateRating where evidence supports it
- Otherwise → Article with mainEntityOfPage

Requirements:
- @context must be "https://schema.org"
- Every claim must trace to the chat response or the page content; never invent numbers or quotes
- Wrap json_ld in <script type="application/ld+json"> ... </script>`,
  },
  {
    slug: "competitor-counter",
    name: "Competitor Counter-Move",
    pigment: "B73B4F",
    description: "Given a competitor visibility surge, drafts the counter-content angle and an outline.",
    inputs: ["brand_report", "url_report"],
    outputFields: [
      { name: "title",         type: "string",   description: "5-9 word working title" },
      { name: "angle",         type: "string",   description: "One sentence on the wedge — what this content does that the competitor's doesn't" },
      { name: "outline",       type: "string[]", description: "H2 section headings, 3-5 entries" },
      { name: "target_prompts", type: "string[]", description: "3-5 Peec prompts this piece should win citations for" },
      { name: "proof_points",  type: "string[]", description: "Evidence/data the editor must include" },
    ],
    systemPrompt: `You are Competitor Counter-Move. You see a recent surge in a competitor's visibility, and you propose a single counter-content piece that would close the gap.

Be specific. "Comparison post" is lazy; "Side-by-side X vs Y on price, latency, and onboarding speed" is useful.`,
  },
  {
    slug: "anomaly-autopsy",
    name: "Anomaly Autopsy",
    pigment: "7E5A0E",
    description: "Explains why a Peec metric moved — pulls upstream signals into a tight narrative.",
    inputs: ["brand_report", "search_queries"],
    outputFields: [
      { name: "summary",       type: "markdown", description: "One paragraph (3 sentences max) for a Slack post" },
      { name: "likely_causes", type: "object[]", description: "Each item: { cause, confidence: low|medium|high, evidence }" },
      { name: "evidence",      type: "string[]", description: "Concrete data points the user can verify" },
      { name: "next_steps",    type: "string[]", description: "Specific actions, not platitudes" },
    ],
    systemPrompt: `You are Anomaly Autopsy. A metric moved sharply (visibility, sentiment, share of voice). Your job is to explain it.

Rules:
- Never speculate without naming the evidence
- Confidence MUST reflect how much the data actually supports the cause
- If the data is inconclusive, say so explicitly`,
  },
  {
    slug: "prompt-suggester",
    name: "Prompt Suggester",
    pigment: "6E4FAE",
    description: "Suggests new tracked prompts to fill coverage gaps. Pairs well with peec-write · create_prompt.",
    inputs: ["actions", "search_queries"],
    outputFields: [
      { name: "prompts", type: "object[]", description: "Each item: { text, country_code (ISO 3166-1 alpha-2), topic_id (or null), why }" },
    ],
    systemPrompt: `You are Prompt Suggester. Read Peec's opportunity report and the recent search queries, then propose new prompts the user should start tracking.

Rules:
- Each prompt should map to a real gap surfaced in the upstream data
- Don't duplicate existing tracked prompts
- Prefer high-volume, high-intent phrasings users actually type
- 3-7 prompts max`,
  },
  {
    slug: "outreach-drafter",
    name: "Outreach Drafter",
    pigment: "4A7A45",
    description: "Drafts a personal outreach email for UGC / editorial collab opportunities.",
    inputs: ["actions", "url_content"],
    outputFields: [
      { name: "to",      type: "string",   description: "Best-guess address or [find email] placeholder" },
      { name: "subject", type: "string",   description: "Short, specific, no clickbait — under 60 chars" },
      { name: "body",    type: "markdown", description: "5-8 sentence email, plain text" },
    ],
    systemPrompt: `You are Outreach Drafter. You receive a Peec UGC / editorial action recommendation — usually "contact [creator] at [domain] for a collab on [topic]" — and you draft the actual email.

Rules:
- Sound like a human who has actually read their content
- Reference one specific thing they made
- Make the ask small and concrete (a quote, a guest spot, an inclusion in a listicle)
- No "I hope this email finds you well"`,
  },
  {
    slug: "pr-narrator",
    name: "PR Narrator",
    pigment: "1A1612",
    description: "Writes the PR description for an automated schema/content fix — ties the diff to the citation gap it closes.",
    inputs: ["url_report", "free"],
    outputFields: [
      { name: "title",         type: "string",   description: "Imperative, under 70 chars, prefixed with 'schema:' or 'content:'" },
      { name: "body_markdown", type: "markdown", description: "PR body with sections: Why, What changed, Citation evidence, Verify" },
    ],
    systemPrompt: `You are PR Narrator. An automated fix is about to ship — typically JSON-LD added to a page that's losing AI citations. Write the PR title and description.

Rules:
- Cite the specific Peec metric that motivated the change (visibility delta, citation gap, etc.)
- 'Verify' must list concrete reviewer steps
- No fluff, no emojis, no project marketing copy`,
  },
  {
    slug: "topic-mapper",
    name: "Topic Mapper",
    pigment: "B5601E",
    description: "Clusters loose prompts into coherent topic groups. Pairs with peec-write · create_topic + update_prompt.",
    inputs: ["free"],
    outputFields: [
      { name: "clusters", type: "object[]", description: "Each item: { topic_name (1-3 words, Title Case), prompt_ids[], is_new (true if no existing topic fits) }" },
    ],
    systemPrompt: `You are Topic Mapper. You receive a list of prompts (some attached to topics, some not). Group the unattached ones into coherent topics.

Rules:
- Reuse existing topic names when a prompt clearly fits one
- A topic should bind 3+ prompts; lone prompts stay unassigned
- Names must be intuitive — what would a marketer call this folder?`,
  },
  {
    slug: "executive-brief",
    name: "Executive Brief",
    pigment: "8E5A14",
    description: "Compresses a week of Peec data into a 5-line founder-readable brief.",
    inputs: ["brand_report", "url_report", "actions"],
    outputFields: [
      { name: "headline",       type: "string", description: "Biggest single move this week (good or bad)" },
      { name: "why_it_matters", type: "string", description: "One sentence connecting it to revenue or positioning" },
      { name: "whats_working",  type: "string", description: "One specific tactic to double down on" },
      { name: "whats_broken",   type: "string", description: "One specific gap to fix" },
      { name: "do_this_monday", type: "string", description: "One concrete next action" },
    ],
    systemPrompt: `You are Executive Brief. You see a week of Peec metrics and opportunity actions. Output a 5-bullet brief a founder reads in 15 seconds.

Rules:
- No hedging language
- Numbers must be from the data, never invented
- If nothing material changed, say so on the headline instead of padding`,
  },
  {
    slug: "free-form",
    name: "Custom Agent",
    pigment: "6E4FAE",
    description: "Empty agent — write your own system prompt and output fields for a one-off task.",
    inputs: ["free"],
    outputFields: [
      { name: "result", type: "string", description: "Replace this with whatever your task should emit" },
    ],
    systemPrompt: `You are a Wire agent. Describe your task here — what data you receive, what you should output, and any constraints.`,
  },
];

export function findAgent(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

/** Compact catalog for the synthesizer system prompt. */
export function agentCatalogForPrompt(): string {
  return AGENTS.map((a) => `  - ${a.slug}: ${a.description}`).join("\n");
}
