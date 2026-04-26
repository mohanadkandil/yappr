import type { Lint, LintPigment } from "@/lib/lints";

/**
 * Map a lint kind to which DOM element in the editor it visually targets.
 * Used by StudioShell to derive data-attributes that CSS uses to draw the
 * pigment underlines on the targeted elements.
 */
export type LintTarget = "h1" | "intro" | "section" | "claim";

export function targetOf(kind: Lint["kind"]): LintTarget | null {
  switch (kind) {
    case "h1_extractability":      return "h1";
    case "jtbd_framing":           return "intro";
    case "schema_gap":             return "section";
    case "comparison_structure":   return "h1"; // the comparison "vs." lives in the H1
    // project-wide lints don't decorate a specific span
    case "topic_loss":
    case "topic_strength":
    case "competitor_url":
    case "domain_gap":
    case "missing_data":
    default:
      return null;
  }
}

const SEVERITY_RANK: Record<Lint["severity"], number> = { HIGH: 3, MED: 2, LOW: 1 };

/**
 * Walk all lints, pick the highest-severity pigment per target, return a map
 * the editor wrapper can render as data-attrs. Document-aware lints (kinds
 * mapped via targetOf) participate; project-wide lints don't.
 */
export function buildLintTargetMap(lints: Lint[]): Partial<Record<LintTarget, LintPigment>> {
  const acc: Partial<Record<LintTarget, { rank: number; pigment: LintPigment }>> = {};
  for (const l of lints) {
    const t = targetOf(l.kind);
    if (!t) continue;
    const rank = SEVERITY_RANK[l.severity];
    const cur = acc[t];
    if (!cur || rank > cur.rank) acc[t] = { rank, pigment: l.pigment };
  }
  const out: Partial<Record<LintTarget, LintPigment>> = {};
  for (const [k, v] of Object.entries(acc)) {
    if (v) out[k as LintTarget] = v.pigment;
  }
  return out;
}
