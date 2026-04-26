"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/wire/recipes";
import type { Run } from "@/lib/wire/runs";

const PIGMENT_LIGHT: Record<string, string> = {
  rose: "#FBDADA", peach: "#FDE3CC", sage: "#D6E5C9", mint: "#CFEAD9",
  lavender: "#E2DCF3", clay: "#E9D6BE",
};
const PIGMENT_DEEP: Record<string, string> = {
  rose: "#B73B4F", peach: "#B5601E", sage: "#4A7A45", mint: "#2F8466",
  lavender: "#6E4FAE", clay: "#7E4F26",
};

const STATUS_CHIP: Record<string, { bg: string; fg: string; label: string }> = {
  live: { bg: "rgba(47, 132, 102, 0.15)", fg: "#2F8466", label: "LIVE" },
  stub: { bg: "rgba(126, 90, 14, 0.12)", fg: "#7E5A0E", label: "STUB" },
  coming_soon: { bg: "rgba(26, 22, 18, 0.06)", fg: "#8E8478", label: "SOON" },
};

export function RecipeCard({
  recipe, enabled, onToggle, onRun, lastRun,
}: {
  recipe: Recipe;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  onRun: () => Promise<void>;
  lastRun?: Run;
}) {
  const [running, setRunning] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  const fire = async () => {
    setRunning(true);
    try { await onRun(); }
    finally { setRunning(false); }
  };

  const chip = STATUS_CHIP[recipe.status];

  return (
    <article className="rounded-[24px] p-5 relative overflow-hidden flex flex-col gap-3" style={{
      background: PIGMENT_LIGHT[recipe.pigment] ?? PIGMENT_LIGHT.rose,
      boxShadow: "0 6px 18px rgba(26,22,18,0.06), 0 1px 2px rgba(26,22,18,0.04)",
      border: `1px solid ${enabled ? PIGMENT_DEEP[recipe.pigment] + "33" : "rgba(26,22,18,0.04)"}`,
    }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-none text-[20px]" style={{
          background: "#FAF6EE",
          boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 6px rgba(0,0,0,0.06)",
        }}>
          {recipe.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-[16px] tracking-tight m-0" style={{ color: PIGMENT_DEEP[recipe.pigment] }}>
              {recipe.name}
            </h3>
            <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] px-1.5 py-0.5 rounded-full" style={{
              background: chip.bg, color: chip.fg,
            }}>{chip.label}</span>
          </div>
          <p className="text-[12.5px] leading-snug mt-1 opacity-90" style={{ color: "#4A413A" }}>
            {recipe.description}
          </p>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(!enabled)}
          className="w-11 h-6 rounded-full flex-none transition-all"
          style={{
            background: enabled ? PIGMENT_DEEP[recipe.pigment] : "rgba(26,22,18,0.15)",
            boxShadow: enabled ? `0 0 12px ${PIGMENT_DEEP[recipe.pigment]}55` : "none",
          }}
          aria-label={enabled ? "Disable" : "Enable"}
        >
          <span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{
            transform: enabled ? "translateX(22px)" : "translateX(2px)",
            marginTop: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" style={{ color: "#4A413A" }}>
        <Detail label="TRIGGER">
          {recipe.trigger.kind === "cron" && recipe.trigger.humanLabel}
          {recipe.trigger.kind === "anomaly" && recipe.trigger.thresholdLabel}
          {recipe.trigger.kind === "manual" && recipe.trigger.humanLabel}
        </Detail>
        <Detail label="READS">
          {recipe.reads.join(" · ")}
        </Detail>
        <Detail label="WRITES">
          {recipe.writes}
        </Detail>
      </div>

      {recipe.requiresEnv.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.requiresEnv.map((e) => (
            <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold" style={{
              background: "rgba(26,22,18,0.06)", color: "#4A413A",
            }}>env: {e}</span>
          ))}
        </div>
      )}

      {/* Last run indicator */}
      {lastRun && (
        <div className="text-[11px] flex items-center gap-2" style={{ color: "#4A413A" }}>
          <RunDot status={lastRun.status} />
          <span className="opacity-80">{relTime(lastRun.endedAt ?? lastRun.startedAt)}</span>
          <span className="font-medium truncate flex-1">{lastRun.message}</span>
          {lastRun.artifactUrl && (
            <a href={lastRun.artifactUrl} target="_blank" rel="noreferrer" className="font-extrabold underline" style={{
              color: PIGMENT_DEEP[recipe.pigment],
            }}>
              {lastRun.artifactLabel || "open ↗"}
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-1">
        <button
          onClick={fire}
          disabled={running || recipe.status === "coming_soon"}
          className="px-3 py-1.5 rounded-full text-[12px] font-extrabold inline-flex items-center gap-1.5"
          style={{
            background: running ? "#4A413A" : "#1A1612",
            color: running ? "#F4D265" : "#FAF6EE",
            opacity: recipe.status === "coming_soon" ? 0.45 : 1,
            cursor: running || recipe.status === "coming_soon" ? "wait" : "pointer",
          }}
        >
          {running ? (
            <>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#F4D265" }} />
              Running…
            </>
          ) : recipe.status === "coming_soon" ? "Coming soon" : "▸ Run now"}
        </button>
        {recipe.configurable && recipe.configurable.length > 0 && (
          <button onClick={() => setOpenConfig((o) => !o)} className="px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{
            borderColor: "rgba(26,22,18,0.1)", background: "rgba(255,255,255,0.5)", color: "#4A413A",
          }}>
            {openConfig ? "Hide" : "Configure"}
          </button>
        )}
      </div>

      {openConfig && recipe.configurable && (
        <div className="rounded-[14px] p-3" style={{
          background: "rgba(255,255,255,0.55)", border: "1px solid rgba(26,22,18,0.05)",
        }}>
          <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-2" style={{ color: "#8E8478" }}>
            Configuration (local — not yet persisted)
          </div>
          {recipe.configurable.map((c) => (
            <div key={c.key} className="flex items-center gap-2 mb-1.5 text-[12px]">
              <span style={{ color: "#4A413A", flex: 1 }}>{c.label}</span>
              <code className="text-[11px] px-2 py-0.5 rounded font-mono" style={{
                background: "rgba(26,22,18,0.06)", color: "#1A1612",
              }}>{String(c.default)}</code>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="text-[8.5px] font-extrabold uppercase tracking-[0.22em] opacity-60">{label}</span>
      <span className="font-medium" style={{ color: "#1A1612" }}>{children}</span>
    </div>
  );
}

function RunDot({ status }: { status: Run["status"] }) {
  const c = status === "success" ? "#2F8466" : status === "failed" ? "#B73B4F" : status === "no-op" ? "#8E8478" : "#6E4FAE";
  return <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />;
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  return `${Math.floor(sec/86400)}d ago`;
}
