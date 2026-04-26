import { NextRequest, NextResponse } from "next/server";
import { getRecipe } from "@/lib/wire/recipes";
import { runRecipe } from "@/lib/wire/agents";
import { appendRun } from "@/lib/wire/runs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await context.params;
  const recipe = getRecipe(recipeId);
  if (!recipe) return NextResponse.json({ ok: false, error: "unknown recipe" }, { status: 404 });

  let projectId = "";
  try { const body = await req.json(); projectId = body.projectId || ""; } catch {}
  projectId = projectId || process.env.PEEC_PROJECT_ID || "";
  if (!projectId) return NextResponse.json({ ok: false, error: "no project selected" }, { status: 400 });

  const run = await runRecipe(recipe, projectId);
  appendRun(run);
  return NextResponse.json({ ok: true, run });
}
