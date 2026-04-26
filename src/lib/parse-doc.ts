import * as cheerio from "cheerio";

/**
 * Pure HTML parser. No Peec dependency, no IO. Given an editor's HTML output,
 * returns the structural facts the lint engine needs.
 *
 * Non-fabrication: if a feature is absent (no H1, no JSON-LD, no claims),
 * return undefined / empty arrays. Don't invent.
 */
export type DocFacts = {
  h1: string;
  h2s: string[];
  intro: string;          // first non-empty paragraph
  bodyText: string;       // all paragraph text concatenated
  claimSentences: string[]; // sentences with claim markers ("best", "fastest", numeric "%", etc.)
  hasJsonLd: boolean;
  hasFAQPattern: boolean; // h2/h3 + paragraph repetition shape
  hasComparisonPattern: boolean; // mentions "vs." or "versus" or "compared to"
  mentionedCompetitors: string[]; // intersection with provided competitor list
  wordCount: number;
};

const CLAIM_MARKERS = [
  /\b(fastest|easiest|best|leading|top|simplest|smartest|most\s+\w+)\b/i,
  /\b\d+%\b/,
  /\b\d+x\b/i,
  /\b(million|billion|thousand)\b/i,
  /\bguaranteed\b/i,
  /\bin minutes\b/i,
  /\bzero\b/i,
];

export function parseDoc(html: string, opts: { competitorNames?: string[] } = {}): DocFacts {
  const $ = cheerio.load(html);

  const h1 = ($("h1").first().text() || "").trim();
  const h2s = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean);

  const paragraphs = $("p").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const intro = paragraphs[0] ?? "";
  const bodyText = paragraphs.join(" ");

  const sentences = bodyText.split(/(?<=[.!?])\s+/).filter((s) => s.length > 8);
  const claimSentences = sentences.filter((s) => CLAIM_MARKERS.some((re) => re.test(s)));

  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;

  const repeatedH2Plus = $("h2, h3").length;
  const hasFAQPattern = repeatedH2Plus >= 3 && paragraphs.length >= repeatedH2Plus;

  const hasComparisonPattern = /\bvs\.?\b|\bversus\b|\bcompared to\b/i.test(bodyText) ||
    /\bvs\.?\b/i.test(h1);

  const lcText = bodyText.toLowerCase() + " " + h1.toLowerCase();
  const mentionedCompetitors = (opts.competitorNames ?? [])
    .filter((name) => name && lcText.includes(name.toLowerCase()));

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    h1,
    h2s,
    intro,
    bodyText,
    claimSentences,
    hasJsonLd,
    hasFAQPattern,
    hasComparisonPattern,
    mentionedCompetitors,
    wordCount,
  };
}

/**
 * Extract Job-To-Be-Done style terms from a string by simple heuristics.
 * Looks for noun-phrase patterns that appear in cited competitor titles.
 * V0 is keyword-extraction, not classification — the lint compares
 * intersection with the doc, so even rough extraction is useful.
 */
export function extractJTBDTerms(text: string): string[] {
  const lower = text.toLowerCase();
  const candidates = new Set<string>();
  // n-grams of 2 or 3 words separated by spaces
  const tokens = lower.replace(/[^\w\s-]/g, " ").split(/\s+/).filter((t) => t.length > 2);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (bigram.length > 6 && bigram.length < 32) candidates.add(bigram);
    if (i < tokens.length - 2) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (trigram.length > 10 && trigram.length < 36) candidates.add(trigram);
    }
  }
  return Array.from(candidates);
}
