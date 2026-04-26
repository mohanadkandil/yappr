import { NextResponse } from "next/server";
import { RECIPES } from "@/lib/wire/recipes";
import { runRecipe } from "@/lib/wire/agents";
import { appendRun } from "@/lib/wire/runs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Scheduled execution. Wire up via vercel.json with a cron schedule:
 *   { "crons": [{ "path": "/api/wire/cron", "schedule": "0 9 * * *" }] }
 *
 * For v0 this fires all live recipes daily. Phase 2 honors per-recipe
 * cron specs and per-user enable flags persisted in Postgres.
 */
export async function GET() {
  const projectId = process.env.PEEC_PROJECT_ID || "";
  if (!projectId) return NextResponse.json({ ok: false, error: "no project" }, { status: 400 });

  const liveRecipes = RECIPES.filter((r) => r.status === "live");
  const results = [];
  for (const recipe of liveRecipes) {
    const run = await runRecipe(recipe, projectId);
    appendRun(run);
    results.push({ recipe: recipe.id, status: run.status, message: run.message });
  }
  return NextResponse.json({ ok: true, results });
}
