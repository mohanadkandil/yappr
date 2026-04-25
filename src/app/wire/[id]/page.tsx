import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/wire/recipes";
import { buildGraph, emptyGraph } from "@/lib/wire/graph-builder";
import { getSavedPatch, isUserPatchId } from "@/lib/wire/patches-store";
import { PatchCanvasPage } from "@/components/wire/PatchCanvasPage";

export const dynamic = "force-dynamic";

export default async function WirePatchRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. User-created patch (id like p_xxxxxxxxxxxx)
  if (isUserPatchId(id)) {
    const saved = await getSavedPatch(id);
    if (saved) {
      return (
        <PatchCanvasPage
          patchId={saved.id}
          patchName={saved.name}
          nodes={saved.nodes}
          edges={saved.edges}
          mode="edit"
          status="new"
        />
      );
    }
    // Brand new — empty canvas. First save POST will create it.
    const { nodes, edges } = emptyGraph();
    return (
      <PatchCanvasPage
        patchId={id}
        patchName="Untitled patch"
        nodes={nodes}
        edges={edges}
        mode="new"
        status="new"
      />
    );
  }

  // 2. Pre-built recipe (schema-sweeper, slack-brief, etc.) — derive graph
  const recipe = getRecipe(id);
  if (!recipe) return notFound();
  const { nodes, edges } = buildGraph(recipe);
  return (
    <PatchCanvasPage
      patchId={recipe.id}
      patchName={recipe.name}
      nodes={nodes}
      edges={edges}
      mode="edit"
      status={recipe.status}
    />
  );
}
