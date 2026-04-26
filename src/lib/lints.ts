import type { Brand, BrandReportRow, Topic, URLReportRow } from "./peec-rest";
import type { DocFacts } from "./parse-doc";
import { extractJTBDTerms } from "./parse-doc";

export type LintSeverity = "HIGH" | "MED" | "LOW";
export type LintPigment = "rose" | "peach" | "sage" | "mint" | "lavender";

/**
 * Structured evidence attached to every lint. The "Show evidence" button in
 * the sidebar pill renders this. The /api/lint-fix endpoint reads it to give
 * Claude the right context for rewriting.
 *
 * Non-fabrication: every field corresponds to a real Peec row. If a field
 * isn't supported by the data, it stays undefined.
 */
export type LintEvidence = {
  /** Free-form sentences explaining the data path, ≤3 lines. */
  notes?: string[];
  /** A primary URL the user can open to inspect the source. */
  primaryUrl?: string;
  primaryUrlTitle?: string;
  /** Top cited URL titles in the project. */
  citedTitles?: string[];
  /** JTBD candidate terms (extracted from cited URL titles). */
  jtbdTerms?: string[];
  /** Tracked competitor names (from Peec brands). */
  competitors?: string[];
  /** Topic info if relevant. */
  topicName?: string;
  ownVisibility?: number;
  competitorVisibility?: number;
  competitorName?: string;
  /** Citation count when relevant. */
  citationCount?: number;
};

export type Lint = {
  id: string;
  title: string;
  severity: LintSeverity;
  pigment: LintPigment;
  cite: string;
  quote: string;
  evidenceCount?: number;
  evidence?: LintEvidence;
  kind:
    | "topic_loss"
    | "topic_strength"
    | "competitor_url"
    | "h1_extractability"
    | "schema_gap"
    | "jtbd_framing"
    | "comparison_structure"
    | "domain_gap"
    | "missing_data";
};

type ProjectLintInputs = {
  ownBrandId?: string;
  ownBrandName?: string;
  brands: Brand[];
  topics: Topic[];
  topicRows: BrandReportRow[];
  urlRows: URLReportRow[];
};

const PCT = (n?: number) => `${Math.round((n ?? 0) * 100)}%`;

// =============================================================================
// PROJECT-WIDE LINTS
// =============================================================================

export function computeProjectLints(input: ProjectLintInputs): Lint[] {
  const { ownBrandId, ownBrandName, brands, topics, topicRows, urlRows } = input;
  const out: Lint[] = [];

  if (!ownBrandId) {
    out.push({
      id: "missing-own-brand",
      title: "Own brand not configured",
      severity: "MED",
      pigment: "peach",
      kind: "missing_data",
      cite: "PEEC · LIST_BRANDS",
      quote: "Mark one of your tracked brands as `is_own=true` in Peec to unlock topic-loss and citation-gap lints.",
      evidence: {
        notes: ["Beacon checked your brand list and found no brand marked as own.", "Once is_own is set, citation-gap lints unlock automatically."],
        competitors: brands.map((b) => b.name).filter(Boolean),
      },
    });
  }

  if (ownBrandId && topics.length && topicRows.length) {
    type Best = { topic: Topic; ownVis: number; topCompVis: number; topCompName: string };
    const byTopic = new Map<string, Best>();
    for (const t of topics) {
      const rowsForTopic = topicRows.filter((r) => topicIdOfRow(r) === t.id);
      if (!rowsForTopic.length) continue;
      const ownRow = rowsForTopic.find((r) => brandIdOfRow(r) === ownBrandId);
      const ownVis = (ownRow?.visibility as number | undefined) ?? 0;
      let topCompVis = 0; let topCompName = "";
      for (const r of rowsForTopic) {
        const bid = brandIdOfRow(r);
        if (bid === ownBrandId) continue;
        const v = (r.visibility as number | undefined) ?? 0;
        if (v > topCompVis) {
          topCompVis = v;
          const b = brands.find((b) => b.id === bid);
          topCompName = b?.name ?? bid ?? "competitor";
        }
      }
      if (topCompVis - ownVis > 0.05) byTopic.set(t.id, { topic: t, ownVis, topCompVis, topCompName });
    }
    const sorted = [...byTopic.values()].sort((a, b) => (b.topCompVis - b.ownVis) - (a.topCompVis - a.ownVis));
    for (const best of sorted.slice(0, 2)) {
      const gap = best.topCompVis - best.ownVis;
      out.push({
        id: `topic-loss-${best.topic.id}`,
        title: `Losing "${best.topic.name}" to ${best.topCompName}`,
        severity: gap > 0.2 ? "HIGH" : "MED",
        pigment: gap > 0.2 ? "rose" : "peach",
        kind: "topic_loss",
        cite: `PEEC · GET_BRAND_REPORT · DIM=topic_id`,
        quote: `${ownBrandName ?? "you"} ${PCT(best.ownVis)}, ${best.topCompName} ${PCT(best.topCompVis)} — ${PCT(gap)} gap on AI engine answers tagged with this topic.`,
        evidenceCount: 1,
        evidence: {
          topicName: best.topic.name,
          ownVisibility: best.ownVis,
          competitorVisibility: best.topCompVis,
          competitorName: best.topCompName,
          notes: [
            `Pulled from get_brand_report with dimensions=['topic_id'] over the last 30 days.`,
            `${ownBrandName ?? "Own brand"} appears in ${PCT(best.ownVis)} of AI answers tagged with this topic.`,
            `${best.topCompName} appears in ${PCT(best.topCompVis)}.`,
          ],
        },
      });
    }
  }

  if (ownBrandId && topics.length && topicRows.length) {
    let best: { topic: Topic; ownVis: number; gap: number } | null = null;
    for (const t of topics) {
      const ownRow = topicRows.find((r) => topicIdOfRow(r) === t.id && brandIdOfRow(r) === ownBrandId);
      if (!ownRow) continue;
      const ownVis = (ownRow.visibility as number | undefined) ?? 0;
      const competitorMax = Math.max(0, ...topicRows.filter((r) => topicIdOfRow(r) === t.id && brandIdOfRow(r) !== ownBrandId).map((r) => (r.visibility as number | undefined) ?? 0));
      const gap = ownVis - competitorMax;
      if (gap > 0 && (!best || gap > best.gap)) best = { topic: t, ownVis, gap };
    }
    if (best) {
      out.push({
        id: `topic-strength-${best.topic.id}`,
        title: `Strongest topic — defend "${best.topic.name}"`,
        severity: "LOW",
        pigment: "mint",
        kind: "topic_strength",
        cite: `PEEC · GET_BRAND_REPORT · DIM=topic_id`,
        quote: `${ownBrandName ?? "you"} ${PCT(best.ownVis)} on this topic vs ${PCT(best.ownVis - best.gap)} for the next best brand. This is where you defend.`,
        evidence: {
          topicName: best.topic.name,
          ownVisibility: best.ownVis,
          competitorVisibility: best.ownVis - best.gap,
          notes: [
            `Strongest topic by lead over the next-best brand.`,
            `Lead = ${PCT(best.gap)}.`,
          ],
        },
      });
    }
  }

  if (urlRows.length) {
    const ownDomains = (brands.find((b) => b.id === ownBrandId)?.domains ?? []).map((d) => d.toLowerCase());
    const isOwn = (url: string) => {
      try { const h = new URL(url).hostname.toLowerCase(); return ownDomains.some((d) => h.endsWith(d)); }
      catch { return false; }
    };
    const competitorURLs = urlRows
      .filter((r) => r.url && !isOwn(r.url))
      .filter((r) => (r.citation_count ?? 0) > 0 && (!r.mentioned_brand_ids || !r.mentioned_brand_ids.includes(ownBrandId ?? "")))
      .sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0));
    for (const u of competitorURLs.slice(0, 2)) {
      let host = "";
      try { host = new URL(u.url).hostname; } catch { host = u.url; }
      out.push({
        id: `competitor-url-${u.url}`,
        title: `${host} cited on prompts you target`,
        severity: "MED",
        pigment: "peach",
        kind: "competitor_url",
        cite: `PEEC · GET_URL_REPORT · ${u.classification ?? "URL"}`,
        quote: u.title ? `"${u.title}" — ${u.citation_count ?? 0} citations across tracked prompts.` : `${u.url} · ${u.citation_count ?? 0} citations.`,
        evidenceCount: u.citation_count,
        evidence: {
          primaryUrl: u.url,
          primaryUrlTitle: u.title ?? undefined,
          citationCount: u.citation_count ?? 0,
          notes: [
            `Returned by get_url_report sorted by citation_count, classification ${u.classification ?? "(none)"}.`,
            `Your own brand is NOT in mentioned_brand_ids on this row — meaning AI engines cited this URL on prompts you target without referencing your brand.`,
          ],
        },
      });
    }
  }

  return out;
}

// =============================================================================
// DOCUMENT-AWARE LINTS
// =============================================================================

type DocLintInputs = {
  doc: DocFacts;
  ownBrandName?: string;
  competitorNames: string[];
  topURLs: URLReportRow[];
};

export function computeDocLints(input: DocLintInputs): Lint[] {
  const { doc, ownBrandName, competitorNames, topURLs } = input;
  const out: Lint[] = [];

  // ---- 1. H1 extractability --------------------------------------------------
  if (doc.h1) {
    const lc = doc.h1.toLowerCase();
    const titlesPool = topURLs.filter((u) => u.title).map((u) => u.title!).slice(0, 12);
    const jtbdPool = new Set<string>();
    for (const t of titlesPool) for (const term of extractJTBDTerms(t)) jtbdPool.add(term);
    const jtbdHits = [...jtbdPool].filter((term) => lc.includes(term));
    const tooShort = doc.h1.split(/\s+/).filter(Boolean).length < 4;
    if (titlesPool.length && jtbdHits.length === 0) {
      out.push({
        id: "h1-extractability",
        title: tooShort ? "H1 too thin to be quoted by AI" : "H1 lacks JTBD anchor cited URLs use",
        severity: tooShort ? "HIGH" : "MED",
        pigment: tooShort ? "rose" : "peach",
        kind: "h1_extractability",
        cite: `PEEC · GET_URL_REPORT · TOP ${titlesPool.length} CITED TITLES`,
        quote: `Cited URLs frame their H1 around terms like: ${[...jtbdPool].slice(0, 4).join(" · ") || "(none extracted)"}. Your H1 — "${doc.h1.slice(0, 80)}" — doesn't anchor to any of them.`,
        evidenceCount: titlesPool.length,
        evidence: {
          jtbdTerms: [...jtbdPool].slice(0, 12),
          citedTitles: titlesPool.slice(0, 6),
          notes: [
            `Beacon analyzed ${titlesPool.length} top cited URL titles from Peec.`,
            `Extracted ${jtbdPool.size} candidate JTBD bigrams/trigrams.`,
            `Your H1 contains 0 of them — AI engines look for these phrases when extracting.`,
          ],
        },
      });
    }
  } else {
    out.push({
      id: "h1-missing",
      title: "Document has no H1",
      severity: "HIGH",
      pigment: "rose",
      kind: "h1_extractability",
      cite: "EDITOR · STRUCTURE",
      quote: "AI engines extract H1s as the canonical answer for queries that match the page's topic. A page with no H1 forfeits that match.",
      evidence: { notes: ["No H1 detected in the editor's HTML."] },
    });
  }

  // ---- 2. Schema gap ---------------------------------------------------------
  if ((doc.hasFAQPattern || doc.hasComparisonPattern) && !doc.hasJsonLd) {
    const triggers: string[] = [];
    if (doc.hasFAQPattern) triggers.push("FAQ-shaped content");
    if (doc.hasComparisonPattern) triggers.push("comparison pattern (\"vs.\" detected)");
    out.push({
      id: "schema-gap",
      title: "Schema markup missing",
      severity: "MED",
      pigment: "peach",
      kind: "schema_gap",
      cite: "EDITOR · STRUCTURE · NO LD+JSON",
      quote: `Detected ${triggers.join(" + ")} but no JSON-LD on the page. Top cited URLs in your space pair this content shape with FAQPage / ComparisonPage schema.`,
      evidence: {
        notes: [
          `Detected: ${triggers.join(", ")}.`,
          `No <script type="application/ld+json"> in the document.`,
          `AI engines pattern-match these structures via schema; without it, the content shape is invisible to extraction.`,
        ],
      },
    });
  }

  // ---- 3. JTBD framing -------------------------------------------------------
  if (doc.intro && topURLs.length) {
    const intro = doc.intro.toLowerCase();
    const titlesPool = topURLs.filter((u) => u.title).map((u) => u.title!).slice(0, 8);
    const jtbdPool = new Set<string>();
    for (const t of titlesPool) for (const term of extractJTBDTerms(t)) jtbdPool.add(term);
    const present = [...jtbdPool].filter((term) => intro.includes(term));
    if (titlesPool.length && jtbdPool.size && present.length < 2) {
      const missingExamples = [...jtbdPool].filter((t) => !intro.includes(t)).slice(0, 6);
      out.push({
        id: "jtbd-framing",
        title: "Intro thin on the terms cited URLs use",
        severity: "MED",
        pigment: "peach",
        kind: "jtbd_framing",
        cite: `PEEC · GET_URL_REPORT · TOP CITED TITLE TERMS`,
        quote: `Top citations use: ${missingExamples.slice(0,4).join(" · ") || "—"}. Your first paragraph uses ${present.length} of them.`,
        evidenceCount: titlesPool.length,
        evidence: {
          jtbdTerms: missingExamples,
          citedTitles: titlesPool,
          notes: [
            `Pulled JTBD terms from top ${titlesPool.length} cited URL titles.`,
            `Your intro paragraph contains ${present.length} of the ${jtbdPool.size} extracted terms.`,
            `AI engines anchor extraction to the first ~200 words.`,
          ],
        },
      });
    }
  }

  // ---- 4. Comparison structure ----------------------------------------------
  if (doc.hasComparisonPattern) {
    const knownNames = competitorNames.filter((n) => n && n.toLowerCase() !== (ownBrandName ?? "").toLowerCase());
    const docMentions = knownNames.filter((n) => doc.mentionedCompetitors?.some((m) => m.toLowerCase() === n.toLowerCase()));
    if (docMentions.length === 0 && knownNames.length > 0) {
      out.push({
        id: "comparison-structure-missing-competitors",
        title: "Comparison piece names no tracked competitor",
        severity: "LOW",
        pigment: "sage",
        kind: "comparison_structure",
        cite: `PEEC · LIST_BRANDS · ${knownNames.length} TRACKED`,
        quote: `Your draft uses "vs." but doesn't name any of the brands AI engines actively cite in your space — e.g. ${knownNames.slice(0, 3).join(" · ")}.`,
        evidenceCount: knownNames.length,
        evidence: {
          competitors: knownNames,
          notes: [
            `Beacon found ${knownNames.length} tracked competitors in your Peec project.`,
            `Your draft mentions 0 of them by name despite using a comparison pattern.`,
            `AI engines weight comparison content by the explicit competitor names it contains.`,
          ],
        },
      });
    } else if (docMentions.length > 0 && doc.h2s.length < 2) {
      out.push({
        id: "comparison-structure-thin",
        title: `Comparison vs. ${docMentions[0]} — structure too thin`,
        severity: "LOW",
        pigment: "sage",
        kind: "comparison_structure",
        cite: "EDITOR · STRUCTURE",
        quote: `Top cited comparison pages use 4+ extractable sections. Your draft has ${doc.h2s.length} H2 section${doc.h2s.length === 1 ? "" : "s"}.`,
        evidence: {
          competitors: docMentions,
          notes: [
            `Comparison pattern + named competitor detected.`,
            `Section count: ${doc.h2s.length}. Cited comparisons typically use 4+.`,
          ],
        },
      });
    }
  }

  return out;
}

// =============================================================================

export function computeAllLints(args: { project: ProjectLintInputs; doc?: DocFacts }): Lint[] {
  const project = computeProjectLints(args.project);
  if (!args.doc) return project;
  const competitorNames = args.project.brands
    .filter((b) => b.id !== args.project.ownBrandId)
    .map((b) => b.name)
    .filter(Boolean) as string[];
  const docLints = computeDocLints({
    doc: args.doc,
    ownBrandName: args.project.ownBrandName,
    competitorNames,
    topURLs: args.project.urlRows.slice(0, 20),
  });
  return [...docLints, ...project];
}

export const computeLints = computeProjectLints;

function brandIdOfRow(r: BrandReportRow): string | undefined {
  const direct = (r as { brand_id?: string }).brand_id;
  if (typeof direct === "string") return direct;
  const nested = (r as { brand?: { id?: string } }).brand;
  return nested?.id;
}
function topicIdOfRow(r: BrandReportRow): string | undefined {
  const nested = (r as { topic?: { id?: string } }).topic;
  if (nested?.id) return nested.id;
  return (r as { topic_id?: string }).topic_id;
}
