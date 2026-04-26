"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ToolIcon } from "./PatchIcons";

type NodeKind = "trigger-cron" | "trigger-anomaly" | "peec-read" | "claude-think" | "action";

type CanvasNode = {
  id: string;
  kind: NodeKind;
  x: number; y: number;
  label: string;
  config?: string;
  /** Only for kind=action — which tool the user picked. */
  toolSlug?: string;
};

type NodeDef = {
  kind: NodeKind;
  label: string;
  pigment: string;
  config: string;
  group: "Triggers" | "Reads" | "Think" | "Actions" | "Logic";
  icon: { type: "shape"; key: string };
};

const NODE_LIBRARY: NodeDef[] = [
  { kind: "trigger-cron",    label: "Schedule",         pigment: "#6E4FAE", config: "Daily · 09:00",       group: "Triggers", icon: { type: "shape", key: "clock" } },
  { kind: "trigger-anomaly", label: "Anomaly trigger",  pigment: "#B73B4F", config: "≥ 2σ drop",           group: "Triggers", icon: { type: "shape", key: "spike" } },
  { kind: "peec-read",       label: "Peec · read",      pigment: "#B5601E", config: "get_brand_report",    group: "Reads",    icon: { type: "shape", key: "eye" } },
  { kind: "claude-think",    label: "Claude · decide",  pigment: "#7E5A0E", config: "structured output",   group: "Think",    icon: { type: "shape", key: "brain" } },
  { kind: "action",          label: "Action",            pigment: "#2F8466", config: "pick a tool ↓",       group: "Actions",  icon: { type: "shape", key: "bolt" } },
];

const TOOL_OPTIONS: { slug: string; label: string; config: string; pigment: string }[] = [
  { slug: "github", label: "GitHub PR",      config: "Composio · PULLS_CREATE",   pigment: "#1A1612" },
  { slug: "slack",  label: "Slack message",  config: "Composio · SEND_MESSAGE",   pigment: "#6E4FAE" },
  { slug: "notion", label: "Notion page",    config: "Composio · CREATE_PAGE",    pigment: "#7E5A0E" },
  { slug: "linear", label: "Linear issue",   config: "Composio · CREATE_ISSUE",   pigment: "#B73B4F" },
  { slug: "gmail",  label: "Gmail draft",    config: "Composio · CREATE_DRAFT",   pigment: "#B5601E" },
];

const STARTER_NODES: CanvasNode[] = [
  { id: "n1", kind: "trigger-anomaly", x: 60,  y: 60,  label: "Anomaly trigger",         config: "Visibility ≥ 2σ drop" },
  { id: "n2", kind: "peec-read",       x: 60,  y: 200, label: "Peec · get_brand_report",  config: "DIM=topic_id, 60d" },
  { id: "n3", kind: "claude-think",    x: 380, y: 130, label: "Claude · decide",          config: "Score severity" },
  { id: "n4", kind: "action",          x: 700, y: 60,  label: "Linear issue",             config: "Composio · CREATE_ISSUE", toolSlug: "linear" },
  { id: "n5", kind: "action",          x: 700, y: 200, label: "Slack message",            config: "Composio · SEND_MESSAGE",  toolSlug: "slack" },
];
const STARTER_EDGES: { from: string; to: string }[] = [
  { from: "n1", to: "n3" }, { from: "n2", to: "n3" },
  { from: "n3", to: "n4" }, { from: "n3", to: "n5" },
];

function NodeIcon({ def, color }: { def: NodeDef; color: string }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (def.icon.key) {
    case "clock": return (<svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>);
    case "spike": return (<svg {...props}><path d="M3 12h6l3-9 4 18 3-9h2"/></svg>);
    case "eye":   return (<svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>);
    case "brain": return (<svg {...props}><path d="M9 4a3 3 0 0 0-3 3v3a3 3 0 0 0-2 3 3 3 0 0 0 2 3v3a3 3 0 0 0 3 3"/><path d="M15 4a3 3 0 0 1 3 3v3a3 3 0 0 1 2 3 3 3 0 0 1-2 3v3a3 3 0 0 1-3 3"/><path d="M12 4v16"/></svg>);
    case "bolt":  return (<svg {...props}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>);
    case "fork":  return (<svg {...props}><path d="M6 4v6"/><path d="M18 4v6"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><path d="M6 16v3a3 3 0 0 0 3 3h6"/></svg>);
    default: return null;
  }
}

export function PatchCanvas({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nodes, setNodes] = useState<CanvasNode[]>(STARTER_NODES);
  const [edges, setEdges] = useState(STARTER_EDGES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPaletteDragStart = (e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData("application/x-beacon-node", kind);
  };
  const onCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/x-beacon-node") as NodeKind;
    if (!kind || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const def = NODE_LIBRARY.find((n) => n.kind === kind);
    if (!def) return;
    setNodes((cur) => [...cur, {
      id: `n_${Date.now().toString(36)}`,
      kind, x: e.clientX - rect.left - 90, y: e.clientY - rect.top - 30,
      label: def.label, config: def.config,
    }]);
  };

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
    if (!canvasRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-tool-pick]")) return; // don't drag when clicking the picker
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragId(id);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
  };
  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      setNodes((cur) => cur.map((n) => (n.id === dragId ? { ...n, x, y } : n)));
    };
    const onUp = () => setDragId(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [dragId, dragOffset]);

  const pickTool = (nodeId: string, tool: typeof TOOL_OPTIONS[number]) => {
    setNodes((cur) => cur.map((n) =>
      n.id === nodeId ? { ...n, toolSlug: tool.slug, label: tool.label, config: tool.config } : n
    ));
  };

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/wire/synthesize-patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(`Synthesizer failed: ${data.error || "unknown"}`);
        return;
      }
      // Replace canvas state with the LLM-generated graph.
      setNodes(data.nodes);
      setEdges(data.edges);
      toast.success(`Patch generated: ${data.patchName}`, {
        description: `${data.nodes.length} nodes · ${data.edges.length} edges · via ${data.model}`,
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      display: "flex", flexDirection: "column",
      background: "#FAF6EE",
      backgroundImage:
        "radial-gradient(900px 460px at 0% 0%, #CFEAD9 0%, transparent 55%)," +
        "radial-gradient(800px 540px at 100% 100%, #E2DCF3 0%, transparent 55%)",
      fontFamily: '-apple-system, "SF Pro Text", system-ui',
    }}>
      {/* TOP BAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid rgba(26,22,18,0.08)",
        background: "rgba(250,246,238,0.85)",
        backdropFilter: "blur(20px)",
        flex: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onClose} style={{
            padding: "7px 12px", borderRadius: 999,
            border: "1px solid rgba(26,22,18,0.1)",
            background: "rgba(255,255,255,0.55)",
            color: "#4A413A", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>← back</button>
          <div style={{
            fontSize: 10, fontWeight: 800,
            letterSpacing: "0.26em", textTransform: "uppercase",
            color: "#B5601E",
          }}>YAPPR · WIRE · NEW PATCH</div>
          <span style={{
            padding: "4px 10px", borderRadius: 999,
            background: "#E2DCF3", color: "#6E4FAE",
            fontSize: 9, fontWeight: 800,
            letterSpacing: "0.18em", textTransform: "uppercase",
          }}>untitled</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{
            padding: "7px 14px", borderRadius: 999,
            border: "1px solid rgba(26,22,18,0.1)",
            background: "rgba(255,255,255,0.55)",
            color: "#4A413A", fontSize: 12, fontWeight: 700, cursor: "pointer",
            height: 32,
          }}><svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" style={{marginRight:6}}><path d="M0 0 L8 4.5 L0 9 z"/></svg>test run</button>
          <button style={{
            padding: "7px 14px", borderRadius: 999,
            border: 0, background: "#1A1612", color: "#FAF6EE",
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(26,22,18,0.18)",
            height: 32,
          }}>save patch</button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "224px 1fr", minHeight: 0 }}>
        {/* PALETTE */}
        <aside className="beacon-sidebar-scroll" style={{
          overflowY: "auto",
          padding: "16px 14px",
          borderRight: "1px solid rgba(26,22,18,0.08)",
          background: "rgba(250,246,238,0.4)",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: "#8E8478" }}>
            Drag onto canvas
          </div>
          {(["Triggers", "Reads", "Think", "Actions", "Logic"] as const).map((group) => {
            const items = NODE_LIBRARY.filter((n) => n.group === group);
            return (
              <div key={group}>
                <div style={{
                  fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: "#B5601E", marginBottom: 6, paddingLeft: 4,
                }}>{group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {items.map((n) => (
                    <div
                      key={n.kind}
                      draggable
                      onDragStart={(e) => onPaletteDragStart(e, n.kind)}
                      style={{
                        padding: "8px 10px", borderRadius: 12,
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,0.65)",
                        border: "1px solid rgba(26,22,18,0.05)",
                        cursor: "grab",
                      }}
                    >
                      <span style={{ display: "inline-flex", color: n.pigment, flex: "none" }}>
                        <NodeIcon def={n} color={n.pigment} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 11.5, color: "#1A1612" }}>{n.label}</div>
                        <div style={{ fontSize: 9.5, color: "#8E8478" }}>{n.config}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p style={{
            margin: "8px 4px 0", fontSize: 10, lineHeight: 1.5,
            fontFamily: '"New York", Georgia, serif', fontStyle: "italic",
            color: "#8E8478",
          }}>
            One generic Action node — pick the tool after dropping.
          </p>
        </aside>

        {/* CANVAS */}
        <div ref={canvasRef}
             onDragOver={onCanvasDragOver}
             onDrop={onCanvasDrop}
             style={{
               position: "relative", overflow: "auto",
               background:
                 "repeating-linear-gradient(0deg, rgba(26,22,18,0.04) 0, rgba(26,22,18,0.04) 1px, transparent 1px, transparent 32px)," +
                 "repeating-linear-gradient(90deg, rgba(26,22,18,0.04) 0, rgba(26,22,18,0.04) 1px, transparent 1px, transparent 32px)",
               backgroundColor: "#F5EFE0",
             }}>
          {/* Edges */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.from);
              const b = nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const x1 = a.x + 170, y1 = a.y + 32, x2 = b.x + 10, y2 = b.y + 32;
              const cx = (x1 + x2) / 2;
              return (
                <path key={i}
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                      stroke="#B5601E" strokeWidth="1.4" fill="none" opacity="0.55"/>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((n) => {
            const def = NODE_LIBRARY.find((d) => d.kind === n.kind);
            const pigment = n.kind === "action" && n.toolSlug
              ? (TOOL_OPTIONS.find((t) => t.slug === n.toolSlug)?.pigment ?? def?.pigment ?? "#B73B4F")
              : (def?.pigment ?? "#B73B4F");
            const isUnconfiguredAction = n.kind === "action" && !n.toolSlug;
            return (
              <div
                key={n.id}
                onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                style={{
                  position: "absolute",
                  left: n.x, top: n.y, width: isUnconfiguredAction ? 200 : 180,
                  background: "#FAF6EE",
                  borderRadius: 12,
                  padding: "9px 11px",
                  cursor: "grab",
                  userSelect: "none",
                  boxShadow: dragId === n.id
                    ? `0 16px 36px rgba(26,22,18,0.18), 0 0 0 2px ${pigment}88`
                    : `0 2px 8px rgba(26,22,18,0.06), 0 0 0 1px ${pigment}33`,
                  zIndex: dragId === n.id ? 20 : 5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {/* If action with tool picked, show tool icon. Else show node icon. */}
                  {n.kind === "action" && n.toolSlug ? (
                    <ToolIcon slug={n.toolSlug} width={16} height={16} />
                  ) : def ? (
                    <span style={{ display: "inline-flex", color: pigment, flex: "none" }}>
                      <NodeIcon def={def} color={pigment} />
                    </span>
                  ) : null}
                  <div style={{ fontWeight: 800, fontSize: 11.5, color: pigment, letterSpacing: "-0.005em" }}>
                    {n.label}
                  </div>
                </div>
                {n.config && !isUnconfiguredAction && (
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: "#8E8478", lineHeight: 1.3 }}>
                    {n.config}
                  </div>
                )}

                {/* TOOL PICKER — only when action node has no tool yet */}
                {isUnconfiguredAction && (
                  <div data-tool-pick style={{ marginTop: 6 }}>
                    <div style={{
                      fontSize: 8.5, fontWeight: 800,
                      letterSpacing: "0.22em", textTransform: "uppercase",
                      color: "#8E8478", marginBottom: 4,
                    }}>pick tool</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {TOOL_OPTIONS.map((t) => (
                        <button
                          key={t.slug}
                          onClick={(e) => { e.stopPropagation(); pickTool(n.id, t); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title={t.label}
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(255,255,255,0.7)",
                            border: "1px solid rgba(26,22,18,0.08)",
                            cursor: "pointer", padding: 0,
                          }}
                        >
                          <ToolIcon slug={t.slug} width={14} height={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection dots */}
                <span style={{ position: "absolute", left: -5, top: 24, width: 10, height: 10, borderRadius: 999, background: pigment, border: "2px solid #FAF6EE" }} />
                <span style={{ position: "absolute", right: -5, top: 24, width: 10, height: 10, borderRadius: 999, background: pigment, border: "2px solid #FAF6EE" }} />
              </div>
            );
})}

          {/* FLOATING PROMPT */}
          <div style={{
            position: "sticky", bottom: 16, left: 0, right: 0,
            zIndex: 30,
            display: "flex", justifyContent: "center",
            padding: "0 16px", pointerEvents: "none",
          }}>
            <div style={{
              pointerEvents: "auto",
              display: "flex", alignItems: "center", gap: 10,
              width: "min(560px, 92%)",
              padding: "9px 9px 9px 18px",
              borderRadius: 999,
              background: "rgba(250, 246, 238, 0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(26,22,18,0.10)",
              boxShadow: "0 18px 40px rgba(26,22,18,0.10), 0 4px 12px rgba(26,22,18,0.06)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5601E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
              </svg>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="describe a patch — when visibility drops 2σ, file Linear + Slack"
                onKeyDown={(e) => { if (e.key === "Enter" && !generating) onGenerate(); }}
                style={{
                  flex: 1, minWidth: 0,
                  border: 0, outline: 0, background: "transparent",
                  fontSize: 13.5, color: "#1A1612",
                  fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
                  fontStyle: prompt ? "normal" : "italic",
                }}
              />
              <button
                onClick={onGenerate}
                disabled={!prompt.trim() || generating}
                style={{
                  flex: "none",
                  padding: "6px 13px", borderRadius: 999, border: 0,
                  background: generating ? "#4A413A" : "#1A1612",
                  color: generating ? "#F4D265" : "#FAF6EE",
                  fontSize: 11.5, fontWeight: 800,
                  cursor: !prompt.trim() ? "default" : "pointer",
                  opacity: !prompt.trim() ? 0.4 : 1,
                  display: "inline-flex", alignItems: "center", gap: 5, height: 28,
                }}
              >
                {generating ? "…" : "generate ⌘↵"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
