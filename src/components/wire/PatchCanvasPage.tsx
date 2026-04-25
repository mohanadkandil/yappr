"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { PatchCanvasInline } from "./PatchCanvasInline";
import type { CanvasNode, CanvasEdge } from "@/lib/wire/graph-builder";

const LS_USER = "beacon.userId";

function isUserPatchId(id: string): boolean {
  return id.startsWith("p_");
}

export function PatchCanvasPage({
  patchId, patchName, nodes, edges, mode, status,
}: {
  patchId: string;
  patchName: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  mode: "new" | "edit";
  status?: string;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const uid = localStorage.getItem(LS_USER) || "";
        setUserId(uid);
      } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const onBack = () => router.push("/studio");

  const onSave = async (n: CanvasNode[], e: CanvasEdge[], name: string) => {
    if (!userId) {
      toast.error("No user id yet — try refreshing");
      return;
    }
    if (!isUserPatchId(patchId)) {
      // Saving over a built-in recipe — fork it to a new ID instead
      toast("Built-in patches can't be overwritten", {
        description: "Use “+ new patch” to fork this into a saveable copy.",
      });
      return;
    }
    const tid = toast.loading("Saving patch…");
    try {
      const res = await fetch(`/api/wire/patches/${patchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId, nodes: n, edges: e }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "save failed");
      toast.success("Patch saved", {
        id: tid,
        description: `${n.length} nodes · ${e.length} edges · "${name}"`,
      });
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
    }
  };

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: "#FAF6EE", color: "#1A1612",
          border: "1px solid rgba(26,22,18,0.08)",
          boxShadow: "0 24px 60px rgba(26,22,18,0.18)",
          borderRadius: 16,
          fontFamily: '-apple-system, "SF Pro Text", system-ui',
        },
      }}/>
      <PatchCanvasInline
        patchId={patchId}
        patchName={patchName}
        initialNodes={nodes}
        initialEdges={edges}
        mode={mode}
        status={status}
        userId={userId}
        onBack={onBack}
        onSave={onSave}
      />
    </>
  );
}
