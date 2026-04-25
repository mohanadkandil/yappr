"use client";

import { useState } from "react";

type ForgeResp =
  | { ok: true; html: string; rationale: string; model: string; groundedIn: { competitors: string[]; citedTitles: string[] } }
  | { ok: false; error: string };

export function Forge({
  projectId, projectName, onOpenInQuill,
}: {
  projectId: string | null;
  projectName: string;
  onOpenInQuill: (html: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("editorial · confident · specific");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ForgeResp | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true); setResult(null);
    try {
      const r = await fetch("/api/forge-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, projectId, tone }),
      });
      setResult(await r.json());
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally { setGenerating(false); }
  };

  return (
    <div className="overflow-y-auto beacon-editor-scroll" style={{ overscrollBehavior: "contain", height: "100%" }}>
      <div className="max-w-[820px] mx-auto px-12 py-14">
        {/* Hero */}
        <div className="text-[11px] font-bold uppercase tracking-[0.26em] mb-3" style={{ color: "#B5601E" }}>
          YAPPR · FORGE
        </div>
        <h1 className="font-extrabold leading-[1.04] tracking-[-0.03em] mb-4 text-[#1A1612]"
            style={{ fontSize: 56, fontFamily: '-apple-system, "SF Pro Display", system-ui' }}>
          Generate a draft <em className="font-medium" style={{ fontFamily: '"New York", "Iowan Old Style", Georgia, serif', color: "#B73B4F" }}>
            grounded in Peec.
          </em>
        </h1>
        <p className="text-[19px] leading-[1.55] max-w-[640px] mb-10" style={{
          fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
          color: "#4A413A",
        }}>
          Pick a topic. Forge pulls top cited URLs and tracked competitors from <strong>{projectName}</strong>&apos;s Peec project, then drafts an article anchored in the JTBD terms AI engines actually quote. Open the result in Quill to refine and ship.
        </p>

        {/* Form */}
        <div className="rounded-[24px] p-7 mb-8" style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(26,22,18,0.06)",
          boxShadow: "0 24px 60px rgba(26,22,18,0.06), 0 6px 14px rgba(26,22,18,0.04)",
          backdropFilter: "blur(14px)",
        }}>
          <label className="block mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: "#8E8478" }}>
              TOPIC
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. your product vs top competitors"
              className="w-full text-[20px] font-medium px-0 py-2 border-0 outline-none bg-transparent"
              style={{
                fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
                color: "#1A1612",
                borderBottom: "2px solid rgba(26,22,18,0.12)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !generating) generate(); }}
            />
          </label>
          <label className="block mb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: "#8E8478" }}>
              TONE
            </div>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full text-[14px] font-medium px-0 py-2 border-0 outline-none bg-transparent"
              style={{ color: "#4A413A", borderBottom: "1px solid rgba(26,22,18,0.08)" }}
            />
          </label>

          <button
            onClick={generate}
            disabled={!topic.trim() || generating}
            className="px-6 py-3.5 rounded-[14px] text-[14px] font-bold inline-flex items-center gap-2 transition-transform"
            style={{
              background: generating
                ? "linear-gradient(180deg, #2C2317, #1A130B)"
                : "linear-gradient(180deg, #FFF8E8, #F4D58A)",
              color: generating ? "#F4D265" : "#3B2A0E",
              boxShadow: generating
                ? "0 1px 0 rgba(244, 210, 101, 0.18) inset, 0 -2px 0 #0A0703 inset, 0 2px 0 #0A0703, 0 6px 18px rgba(0, 0, 0, 0.4)"
                : "0 1px 0 rgba(255,255,255,0.9) inset, 0 -2px 0 #B98E2A inset, 0 6px 0 #B98E2A, 0 12px 28px rgba(185, 142, 42, 0.32)",
              opacity: !topic.trim() && !generating ? 0.4 : 1,
              cursor: !topic.trim() || generating ? "default" : "pointer",
              transform: generating ? "translateY(4px)" : "translateY(0)",
            }}
          >
            {generating ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#F4D265" }} />
                Forging draft…
              </>
            ) : (
              <>⚒ Generate draft · ⌘↵</>
            )}
          </button>
        </div>

        {/* Result */}
        {result && result.ok && (
          <div className="rounded-[24px] p-7" style={{
            background: "#FAF6EE",
            border: "1px solid rgba(26,22,18,0.06)",
            boxShadow: "0 24px 60px rgba(26,22,18,0.08)",
          }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#2F8466" }}>
                  DRAFT GENERATED · {result.model}
                </div>
                <div className="text-[12px] mt-1" style={{ color: "#4A413A" }}>
                  Grounded in: {result.groundedIn.competitors.length} competitors · {result.groundedIn.citedTitles.length} cited titles
                </div>
              </div>
              <button
                onClick={() => onOpenInQuill(result.html)}
                className="px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2"
                style={{ background: "#1A1612", color: "#FAF6EE" }}
              >
                Open in Quill →
              </button>
            </div>
            <p className="text-[12px] italic mb-5 pl-3 py-1" style={{
              fontFamily: '"New York", Georgia, serif',
              color: "#4A413A",
              borderLeft: "2px solid #B5601E",
            }}>
              {result.rationale}
            </p>
            <div
              className="beacon-editor"
              dangerouslySetInnerHTML={{ __html: result.html }}
            />
          </div>
        )}

        {result && !result.ok && (
          <div className="rounded-[14px] p-4 font-mono text-[12px]" style={{
            background: "rgba(251, 218, 218, 0.5)", color: "#B73B4F",
          }}>
            <div className="font-bold uppercase tracking-[0.18em] mb-1">Generation failed</div>
            {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
