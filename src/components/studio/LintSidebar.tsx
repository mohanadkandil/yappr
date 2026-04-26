"use client";

import { useState } from "react";
import type { Lint } from "@/lib/lints";

const PIGMENT_LIGHT: Record<string, string> = {
  rose: "#FBDADA", peach: "#FDE3CC", sage: "#D6E5C9", mint: "#CFEAD9", lavender: "#E2DCF3",
};
const PIGMENT_DEEP: Record<string, string> = {
  rose: "#B73B4F", peach: "#B5601E", sage: "#4A7A45", mint: "#2F8466", lavender: "#6E4FAE",
};

export type FixPreview = {
  /** lint id this preview belongs to — lets the parent remove the pill on apply */
  lintId: string;
  target: "h1" | "intro" | "section" | "add-schema-block" | "append-counter";
  newHtml: string;
  rationale: string;
  model: string;
  oldSpan: string;
};

export function LintSidebar({
  lints, errors, auditing, dataCounts, onRequestFix, onApplyFix, onFixAll,
}: {
  lints: Lint[];
  errors: string[];
  auditing: boolean;
  dataCounts: { brands: number; topics: number; urlRows: number };
  /** Fetch a fix from /api/lint-fix; returns preview data (does NOT apply yet). */
  onRequestFix: (lint: Lint) => Promise<FixPreview>;
  /** User confirmed; apply the preview to the editor. */
  onApplyFix: (preview: FixPreview) => void;
  /** Run the request-then-apply loop on every fixable lint sequentially. */
  onFixAll: () => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, FixPreview>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [fixingAll, setFixingAll] = useState(false);

  const fixable = lints.filter((l) => ["h1_extractability", "jtbd_framing", "schema_gap", "comparison_structure"].includes(l.kind));

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const requestFix = async (lint: Lint) => {
    setPending(lint.id); setErrs((p) => ({ ...p, [lint.id]: "" }));
    try {
      const preview = await onRequestFix(lint);
      setPreviews((p) => ({ ...p, [lint.id]: preview }));
    } catch (err) {
      setErrs((p) => ({ ...p, [lint.id]: (err as Error).message }));
    } finally { setPending(null); }
  };

  const apply = (lint: Lint) => {
    const p = previews[lint.id];
    if (!p) return;
    onApplyFix(p);
    setPreviews((curr) => { const next = { ...curr }; delete next[lint.id]; return next; });
  };

  const cancel = (lintId: string) => {
    setPreviews((curr) => { const next = { ...curr }; delete next[lintId]; return next; });
  };

  const runAll = async () => {
    setFixingAll(true);
    try { await onFixAll(); }
    finally { setFixingAll(false); }
  };

  return (
    <aside className="border-l flex flex-col" style={{
      borderColor: "rgba(26,22,18,0.08)",
      background: "linear-gradient(180deg, rgba(0,0,0,0.015), transparent)",
      height: "calc(100vh - 110px)",
    }}>
      <div className="flex items-center justify-between px-6 pt-6 pb-3" style={{
        background: "rgba(250,246,238,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(26,22,18,0.06)",
      }}>
        <div>
          <div className="font-extrabold text-[16px] tracking-tight">Lints</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5" style={{ color: auditing ? "#6E4FAE" : "#8E8478" }}>
            {auditing ? "AUDITING…" : `${lints.length} · LIVE FROM PEEC`}
          </div>
        </div>
        {fixable.length > 0 && (
          <button
            onClick={runAll}
            disabled={fixingAll || auditing}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
            style={{
              background: fixingAll ? "#4A413A" : "#1A1612",
              color: fixingAll ? "#F4D265" : "#FAF6EE",
              cursor: fixingAll || auditing ? "wait" : "pointer",
              opacity: auditing ? 0.5 : 1,
            }}
          >
            {fixingAll ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "#F4D265" }} />
                Fixing…
              </>
            ) : (
              <>⚡ Fix all · {fixable.length}</>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 flex flex-col gap-3.5 beacon-sidebar-scroll" style={{ overscrollBehavior: "contain" }}>
        {errors.length > 0 && (
          <div className="rounded-[14px] p-3 text-[11px] font-mono" style={{
            background: "rgba(251, 218, 218, 0.5)", color: "#B73B4F",
          }}>
            <div className="font-bold uppercase tracking-[0.18em] mb-1">Peec API errors</div>
            {errors.map((e, i) => <div key={i}>· {e}</div>)}
          </div>
        )}

        {lints.length === 0 && errors.length === 0 && !auditing && (
          <div className="rounded-[18px] p-5 text-[13px]" style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(26,22,18,0.06)",
            color: "#4A413A",
          }}>
            <div className="font-bold mb-1.5" style={{ color: "#1A1612" }}>No lints — looking good</div>
            <div className="leading-relaxed">
              Beacon found {dataCounts.brands} tracked brand{dataCounts.brands === 1 ? "" : "s"},
              {" "}{dataCounts.topics} topic{dataCounts.topics === 1 ? "" : "s"}, and
              {" "}{dataCounts.urlRows} cited URL{dataCounts.urlRows === 1 ? "" : "s"}.
              Either coverage is too thin yet, or this draft is well-anchored.
            </div>
          </div>
        )}

        {lints.map((lint) => {
          const expanded = expandedId === lint.id;
          const isPending = pending === lint.id;
          const preview = previews[lint.id];
          const fixErr = errs[lint.id];
          const accepts = ["h1_extractability", "jtbd_framing", "schema_gap", "comparison_structure", "competitor_url"].includes(lint.kind);

          return (
            <article key={lint.id} className="rounded-[22px] p-4 relative overflow-hidden flex-none" style={{
              background: PIGMENT_LIGHT[lint.pigment] ?? PIGMENT_LIGHT.rose,
              boxShadow: "0 1px 2px rgba(26,22,18,0.06), 0 4px 12px rgba(26,22,18,0.04)",
            }}>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none" style={{
                  background: "#FAF6EE",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 6px rgba(0,0,0,0.06)",
                }}>
                  <LintIcon kind={lint.kind} color={PIGMENT_DEEP[lint.pigment] ?? PIGMENT_DEEP.rose} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[14px] tracking-tight" style={{ color: PIGMENT_DEEP[lint.pigment] }}>
                    {lint.title}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] opacity-70 mt-0.5" style={{ color: PIGMENT_DEEP[lint.pigment] }}>
                    {lint.severity} · {lint.pigment.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] mb-1.5" style={{ color: "#8E8478" }}>
                {lint.cite}
              </div>
              <p className="text-[14px] leading-[1.4] mb-3 pl-2.5 italic" style={{
                fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
                color: "#4A413A",
                borderLeft: `2px solid ${PIGMENT_DEEP[lint.pigment]}`,
              }}>
                {lint.quote}
              </p>

              {/* Evidence panel */}
              {expanded && (
                <div className="rounded-[14px] p-3 mb-3" style={{
                  background: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(26,22,18,0.06)",
                }}>
                  {lint.evidence?.notes && lint.evidence.notes.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-1" style={{ color: "#8E8478" }}>
                        How Beacon found this
                      </div>
                      <ul className="text-[12px] leading-snug pl-3 list-disc" style={{ color: "#4A413A" }}>
                        {lint.evidence.notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                  {lint.evidence?.primaryUrl && (
                    <div className="mb-2">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-1" style={{ color: "#8E8478" }}>
                        Cited URL
                      </div>
                      <a href={lint.evidence.primaryUrl} target="_blank" rel="noreferrer"
                         className="text-[12px] font-mono break-all underline"
                         style={{ color: PIGMENT_DEEP[lint.pigment] }}>
                        {lint.evidence.primaryUrlTitle ? `"${lint.evidence.primaryUrlTitle}" — ` : ""}{lint.evidence.primaryUrl}
                      </a>
                      {lint.evidence.citationCount !== undefined && (
                        <span className="ml-2 text-[10px]" style={{ color: "#8E8478" }}>
                          {lint.evidence.citationCount} citations
                        </span>
                      )}
                    </div>
                  )}
                  {lint.evidence?.jtbdTerms && lint.evidence.jtbdTerms.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-1" style={{ color: "#8E8478" }}>
                        JTBD terms cited URLs use
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lint.evidence.jtbdTerms.map((t, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{
                            background: "rgba(26,22,18,0.05)", color: "#4A413A",
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lint.evidence?.competitors && lint.evidence.competitors.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-1" style={{ color: "#8E8478" }}>
                        Tracked competitors
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lint.evidence.competitors.map((c, i) => (
                          <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                            background: "rgba(26,22,18,0.06)", color: "#1A1612",
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lint.evidence?.citedTitles && lint.evidence.citedTitles.length > 0 && (
                    <div>
                      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-1" style={{ color: "#8E8478" }}>
                        Top cited URL titles
                      </div>
                      <ul className="text-[12px] leading-snug" style={{ color: "#4A413A" }}>
                        {lint.evidence.citedTitles.map((t, i) => (
                          <li key={i} className="italic mb-0.5" style={{ fontFamily: '"New York", Georgia, serif' }}>· {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Diff preview — appears after Claude returns, before applying */}
              {preview && (
                <div className="rounded-[14px] p-3 mb-3" style={{
                  background: "rgba(207, 234, 217, 0.55)",
                  border: "1px solid rgba(47, 132, 102, 0.25)",
                }}>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] mb-2" style={{ color: "#2F8466" }}>
                    PROPOSED · {preview.model}
                  </div>
                  <div className="mb-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] mb-0.5" style={{ color: "#8E8478" }}>
                      Was
                    </div>
                    <div className="text-[12px] line-through opacity-70" style={{ color: "#4A413A" }}>
                      {preview.oldSpan || "(empty)"}
                    </div>
                  </div>
                  <div className="mb-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] mb-0.5" style={{ color: "#2F8466" }}>
                      Now
                    </div>
                    <div className="text-[13px] font-medium leading-snug" style={{
                      color: "#1A1612",
                      fontFamily: preview.target === "add-schema-block" ? "ui-monospace, monospace" : '"New York", Georgia, serif',
                      whiteSpace: preview.target === "add-schema-block" ? "pre-wrap" : "normal",
                    }}>
                      {preview.newHtml.slice(0, 400)}{preview.newHtml.length > 400 ? "…" : ""}
                    </div>
                  </div>
                  <p className="text-[11px] italic mb-2" style={{ color: "#4A413A" }}>{preview.rationale}</p>
                  <div className="flex gap-2">
                    <button onClick={() => apply(lint)} className="px-3 py-1.5 rounded-full text-[12px] font-extrabold" style={{
                      background: "#1A1612", color: "#FAF6EE",
                    }}>
                      Apply →
                    </button>
                    <button onClick={() => cancel(lint.id)} className="px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{
                      background: "transparent", borderColor: "rgba(26,22,18,0.15)", color: "#4A413A",
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {fixErr && (
                <div className="rounded-[12px] p-2.5 mb-2 text-[11px] font-mono" style={{
                  background: "rgba(183, 59, 79, 0.12)", color: "#B73B4F",
                }}>{fixErr}</div>
              )}

              {!preview && (
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => toggle(lint.id)}
                    className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border"
                    style={{
                      background: expanded ? "#1A1612" : "rgba(255,255,255,0.6)",
                      borderColor: "rgba(0,0,0,0.04)",
                      color: expanded ? "#FAF6EE" : "#4A413A",
                    }}
                  >
                    {expanded ? "Hide evidence" : "Show evidence"}
                    {!expanded && lint.evidenceCount ? (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full font-extrabold tracking-[0.06em]" style={{
                        background: "#F6E7AC", color: "#7E5A0E", fontSize: 9,
                      }}>{lint.evidenceCount}</span>
                    ) : null}
                  </button>
                  {accepts && (
                    <button
                      onClick={() => requestFix(lint)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
                      style={{
                        background: isPending ? "#4A413A" : "#1A1612",
                        color: "#FAF6EE",
                        opacity: isPending ? 0.85 : 1,
                        cursor: isPending ? "wait" : "pointer",
                      }}
                    >
                      {isPending ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "#F4D265" }} />
                          Asking AI…
                        </>
                      ) : (
                        <>Suggest fix →</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function LintIcon({ kind, color }: { kind: Lint["kind"]; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (kind) {
    case "topic_loss":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M3 21l9-9"/><path d="M14 6l4 4"/><path d="M9 11l4 4"/><path d="M21 14a8 8 0 1 1-3-6"/></svg>);
    case "topic_strength":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>);
    case "competitor_url":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1.5-1.5"/></svg>);
    case "h1_extractability":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M5 5v14"/><path d="M13 5v14"/><path d="M5 12h8"/><path d="M17 9l3-2v12"/></svg>);
    case "schema_gap":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 4h16v6H4z"/><path d="M4 14h16v6H4z"/><path d="M8 7h6"/><path d="M8 17h10"/></svg>);
    case "jtbd_framing":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M14 20a4 4 0 0 1 7 0"/></svg>);
    case "comparison_structure":
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 5h7v14H4z"/><path d="M13 5h7v14h-7z"/><path d="M4 12h16"/></svg>);
    case "missing_data":
    default:
      return (<svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/></svg>);
  }
}
