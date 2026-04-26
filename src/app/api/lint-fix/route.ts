import { NextRequest, NextResponse } from "next/server";
import { parseDoc } from "@/lib/parse-doc";
import type { Lint } from "@/lib/lints";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not set in .env.local" }, { status: 500 });
  }

  let body: { lint?: Lint; html?: string } = {};
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 }); }

  const { lint, html } = body;
  if (!lint || !html) return NextResponse.json({ ok: false, error: "missing lint or html" }, { status: 400 });

  const doc = parseDoc(html);

  let target: "h1" | "intro" | "section" | "add-schema-block" | "append-counter";
  let task = "";
  let constraints = "";
  let currentSpan = "";

  switch (lint.kind) {
    case "h1_extractability":
      target = "h1";
      currentSpan = doc.h1 || "(no H1 yet)";
      task = `Rewrite the H1 so AI engines (ChatGPT, Perplexity, Gemini) are likely to extract it for prompts in this space.`;
      constraints = `Use one or more of these JTBD terms naturally: ${(lint.evidence?.jtbdTerms ?? []).slice(0, 8).join(", ") || "(none)"}. Punchy — under 12 words. Output only the H1 text (no <h1> tags, no quotes).`;
      break;
    case "jtbd_framing":
      target = "intro";
      currentSpan = doc.intro || "(no intro yet)";
      task = `Rewrite the FIRST PARAGRAPH so AI engines anchor extraction to the JTBD terms below.`;
      constraints = `Use 2-3 of these terms naturally: ${(lint.evidence?.jtbdTerms ?? []).slice(0, 8).join(", ") || "(none)"}. Keep original meaning. 2-4 sentences. Output as a single <p>...</p> element.`;
      break;
    case "schema_gap":
      target = "add-schema-block";
      currentSpan = doc.bodyText.slice(0, 600);
      task = `Generate a JSON-LD ${doc.hasFAQPattern ? "FAQPage" : "Article"} schema block based on the content below.`;
      constraints = `Output valid schema.org JSON only — no <script> tags, no markdown fences. Don't invent facts; if a value is unclear from the content, omit the field.`;
      break;
    case "comparison_structure":
      target = "section";
      currentSpan = doc.h2s[0] ? doc.h2s[0] : "(no H2 yet)";
      task = `Rewrite the first H2 section heading to be more extractable by AI engines as a comparison anchor.`;
      constraints = `Mention at least one of these tracked competitors if appropriate: ${(lint.evidence?.competitors ?? []).slice(0, 4).join(", ") || "(none)"}. Output only the H2 text (no <h2> tags, no quotes).`;
      break;
    case "competitor_url": {
      // Append a counter-claim paragraph at the end of the draft.
      target = "append-counter";
      const competitorURL = lint.evidence?.primaryUrl || "";
      const competitorTitle = lint.evidence?.primaryUrlTitle || "";
      const citationCount = lint.evidence?.citationCount ?? 0;
      currentSpan = doc.bodyText.slice(0, 800);
      task = `A competitor URL is winning ${citationCount} citations on prompts your brand targets. Draft ONE paragraph that names the competitor URL honestly, acknowledges what they cover, and pivots to a specific, defensible counter — something your draft already implies or asserts.`;
      constraints = `Cited competitor URL: ${competitorURL}\nCompetitor's listicle / page title: "${competitorTitle}"\n\nOutput as a single <p>...</p> element, 2-4 sentences. Don't fabricate features your draft doesn't already support. Don't be hostile — name the competitor's strength fairly, then pivot.`;
      break;
    }
    default:
      return NextResponse.json({ ok: false, error: `lint kind ${lint.kind} doesn't have an Accept Fix path yet` }, { status: 400 });
  }

  const evidenceLines = (lint.evidence?.notes ?? []).map((n) => `- ${n}`).join("\n");

  const userPrompt = `LINT ISSUE: ${lint.title}

EVIDENCE:
${evidenceLines}

CURRENT SPAN (target type: ${target}):
${currentSpan}

TASK: ${task}

CONSTRAINTS:
${constraints}

Return JSON with two fields:
- new_html: the rewritten span exactly as it should appear (no markdown, no code fences, no surrounding quotes)
- rationale: one short sentence explaining how the rewrite addresses the lint`;

  const reqBody = {
    model,
    messages: [
      { role: "system", content: "You are Beacon, a non-fabricating GEO writing assistant. You rewrite spans of content to be quotable by AI search engines. Output only what the schema requests." },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 700,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lint_fix_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            new_html: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["new_html", "rationale"],
          additionalProperties: false,
        },
      },
    },
  };

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beacon.so",
        "X-Title": "Beacon Studio",
      },
      body: JSON.stringify(reqBody),
    });
    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json({ ok: false, error: `OpenRouter ${r.status}: ${errText.slice(0, 400)}` }, { status: 500 });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ ok: false, error: "OpenRouter returned no content" }, { status: 500 });

    let parsed: { new_html: string; rationale: string };
    try { parsed = JSON.parse(raw); }
    catch { return NextResponse.json({ ok: false, error: `OpenRouter response wasn't JSON: ${String(raw).slice(0, 200)}` }, { status: 500 }); }

    return NextResponse.json({
      ok: true,
      target,
      newHtml: parsed.new_html,
      rationale: parsed.rationale,
      model,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
