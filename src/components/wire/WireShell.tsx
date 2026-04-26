"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RecipeCard } from "./RecipeCard";
import { StatusFeed } from "./StatusFeed";
import type { Recipe } from "@/lib/wire/recipes";
import type { Run } from "@/lib/wire/runs";

const LS_ENABLED = "beacon.wire.enabled";

export function WireShell({ activeProjectId, projectName }: {
  activeProjectId: string | null;
  projectName: string;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  // Restore enabled flags
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_ENABLED);
      if (saved) setEnabled(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const persistEnabled = useCallback((next: Set<string>) => {
    try { localStorage.setItem(LS_ENABLED, JSON.stringify([...next])); } catch {}
  }, []);

  const loadRecipes = useCallback(async () => {
    const r = await fetch("/api/wire/recipes").then((r) => r.json());
    if (r.ok) setRecipes(r.recipes);
  }, []);

  const loadRuns = useCallback(async () => {
    const r = await fetch("/api/wire/runs").then((r) => r.json());
    if (r.ok) setRuns(r.runs);
  }, []);

  useEffect(() => {
    Promise.all([loadRecipes(), loadRuns()]).finally(() => setLoading(false));
  }, [loadRecipes, loadRuns]);

  const onToggle = useCallback((recipeId: string, next: boolean) => {
    setEnabled((cur) => {
      const set = new Set(cur);
      if (next) set.add(recipeId); else set.delete(recipeId);
      persistEnabled(set);
      return set;
    });
  }, [persistEnabled]);

  const onRun = useCallback(async (recipeId: string) => {
    if (!activeProjectId) {
      toast.error("Pick a project first");
      return;
    }
    const recipe = recipes.find((r) => r.id === recipeId);
    const tid = toast.loading(`${recipe?.emoji ?? ""} Running ${recipe?.name ?? recipeId}…`);
    try {
      const res = await fetch(`/api/wire/run/${recipeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      const data = await res.json();
      if (data.ok) {
        const r: Run = data.run;
        if (r.status === "success") {
          toast.success(r.message, { id: tid, duration: 5000, description: r.artifactUrl ? `Artifact: ${r.artifactLabel ?? "open ↗"}` : undefined });
        } else if (r.status === "failed") {
          toast.error(r.message, { id: tid, description: r.error });
        } else {
          toast(r.message, { id: tid });
        }
        // Re-load runs to show fresh entry
        loadRuns();
      } else {
        toast.error(data.error || "Run failed", { id: tid });
      }
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
    }
  }, [activeProjectId, recipes, loadRuns]);

  const onRunAllEnabled = useCallback(async () => {
    const live = recipes.filter((r) => enabled.has(r.id) && r.status !== "coming_soon");
    if (!live.length) {
      toast("Toggle on at least one recipe first.");
      return;
    }
    toast(`▸ Running ${live.length} agent${live.length === 1 ? "" : "s"}…`);
    for (const r of live) {
      // serial, brief breath between
      await onRun(r.id);
      await new Promise((res) => setTimeout(res, 350));
    }
  }, [recipes, enabled, onRun]);

  const lastRunByRecipe = new Map<string, Run>();
  for (const r of runs) {
    if (!lastRunByRecipe.has(r.recipeId)) lastRunByRecipe.set(r.recipeId, r);
  }

  return (
    <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: "1fr 380px" }}>
      <div className="overflow-y-auto beacon-editor-scroll" style={{ overscrollBehavior: "contain" }}>
        <div className="px-12 py-12 max-w-[1100px] mx-auto">
          <div className="text-[11px] font-bold uppercase tracking-[0.26em] mb-3" style={{ color: "#B5601E" }}>
            BEACON · WIRE · {projectName.toUpperCase()}
          </div>
          <h1 className="font-extrabold leading-[1.04] tracking-[-0.03em] mb-4 text-[#1A1612]"
              style={{ fontSize: 48, fontFamily: '-apple-system, "SF Pro Display", system-ui' }}>
            Wire MCP <em className="font-medium" style={{ fontFamily: '"New York", "Iowan Old Style", Georgia, serif', color: "#B73B4F" }}>
              triggers
            </em> to <em className="font-medium" style={{ fontFamily: '"New York", "Iowan Old Style", Georgia, serif', color: "#2F8466" }}>actions.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] max-w-[720px] mb-6" style={{
            fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
            color: "#4A413A",
          }}>
            Recipes are pre-built agents. Each one reads from <strong>{projectName}</strong>'s Peec data, decides if action is needed, and ships a real artifact — a GitHub PR, a Slack post, a Notion draft. Toggle them on, set thresholds, hit Run now to fire on stage.
          </p>

          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={onRunAllEnabled}
              className="beacon-keycap"
            >
              ▸ Run all enabled · {[...enabled].length}
            </button>
            <span className="text-[12px]" style={{ color: "#8E8478" }}>
              {[...enabled].length === 0 ? "(toggle a recipe to enable)" : `${[...enabled].length} enabled`}
            </span>
          </div>

          {loading ? (
            <div className="text-[14px]" style={{ color: "#4A413A" }}>Loading recipes…</div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {recipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  enabled={enabled.has(r.id)}
                  onToggle={(next) => onToggle(r.id, next)}
                  onRun={() => onRun(r.id)}
                  lastRun={lastRunByRecipe.get(r.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <StatusFeed runs={runs} onRefresh={loadRuns} />
    </div>
  );
}
