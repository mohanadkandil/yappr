import Link from "next/link";
import { smoke } from "@/lib/peec-rest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await smoke();
  const configured = process.env.PEEC_PROJECT_ID || "";

  return (
    <main className="min-h-screen text-[#1A1612]" style={{
      background:
        "radial-gradient(1100px 500px at 18% -10%, #FDE3CC 0%, transparent 60%)," +
        "radial-gradient(900px 600px at 105% 20%, #FBDADA 0%, transparent 60%)," +
        "radial-gradient(800px 600px at 50% 110%, #E2DCF3 0%, transparent 55%)," +
        "#FAF6EE",
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    }}>
      <nav className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
          <span className="inline-block w-[26px] h-[26px] rounded-full relative" style={{
            background: "radial-gradient(circle at 30% 30%, #7E5A0E, #B5601E 70%)",
            boxShadow: "0 0 16px rgba(255,170,106,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
          }} />
          beacon
        </div>
        <Link href="/studio" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1612] text-[#FAF6EE] text-[13px] font-semibold shadow-md">
          Open Studio →
        </Link>
      </nav>

      <section className="grid grid-cols-[1.4fr_1fr] gap-14 items-center px-16 py-14 max-w-[1200px] mx-auto">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] mb-4" style={{ color: "#B5601E" }}>
            Built on Peec · #BuiltWithPeec
          </div>
          <h1 className="font-extrabold leading-[0.94] tracking-[-0.04em] mb-5"
              style={{ fontSize: 88, fontFamily: '-apple-system, "SF Pro Display", system-ui' }}>
            Be{" "}
            <em className="font-medium" style={{ fontFamily: '"New York", "Iowan Old Style", Georgia, serif', color: "#B73B4F" }}>
              seen
            </em>{" "}
            by AI.
          </h1>
          <p className="text-[22px] leading-[1.45] max-w-[520px] mb-8" style={{
            fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
            color: "#4A413A",
          }}>
            A writing surface for the AI search era. Every lint is grounded in a real Peec citation — never a guess. Paste a URL or start a draft. Beacon shows you why competitors are quoted, and rewrites the part that lost.
          </p>

          <div className="flex gap-3 mb-10">
            <Link href="/studio" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[14px] font-bold text-sm" style={{
              background: "linear-gradient(180deg, #FFF8E8, #F4D58A)",
              color: "#3B2A0E",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 -2px 0 #B98E2A inset, 0 6px 0 #B98E2A, 0 12px 28px rgba(185, 142, 42, 0.32)",
            }}>
              ⌘ Open Studio
            </Link>
            <Link href="/api/smoke" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[14px] font-bold text-sm" style={{
              background: "linear-gradient(180deg, #2C2317, #1A130B)",
              color: "#7E5A0E",
              boxShadow: "0 1px 0 rgba(244, 210, 101, 0.18) inset, 0 -2px 0 #0A0703 inset, 0 6px 0 #0A0703, 0 12px 28px rgba(0, 0, 0, 0.45)",
            }}>
              ▸ Smoke · /api/smoke
            </Link>
          </div>

          {/* Peec status badge + project picker */}
          {result.ok ? (
            <div className="rounded-[18px] border p-5" style={{
              background: "rgba(207, 234, 217, 0.45)",
              borderColor: "rgba(47, 132, 102, 0.25)",
            }}>
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: "#2F8466" }}>
                PEEC CONNECTED · {result.projectCount} PROJECT{result.projectCount === 1 ? "" : "S"}
              </div>
              {result.projectCount === 0 ? (
                <div className="text-[13px]" style={{ color: "#4A413A" }}>
                  No projects returned — confirm your Peec account has at least one project.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 mt-3">
                  {result.projects.map((p) => {
                    const isActive = p.id === configured;
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13px]" style={{
                        background: isActive ? "rgba(47, 132, 102, 0.15)" : "rgba(255,255,255,0.55)",
                        border: `1px solid ${isActive ? "rgba(47, 132, 102, 0.35)" : "rgba(26,22,18,0.06)"}`,
                      }}>
                        <span className="font-bold" style={{ color: "#1A1612", flex: 1 }}>{p.name}</span>
                        <code className="text-[11px] px-2 py-0.5 rounded font-mono" style={{
                          background: "rgba(26,22,18,0.06)",
                          color: "#4A413A",
                        }}>{p.id}</code>
                        {isActive && (
                          <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#2F8466" }}>
                            · ACTIVE
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!configured && result.projectCount > 0 && (
                <div className="text-[12px] mt-3 leading-relaxed" style={{ color: "#4A413A" }}>
                  Copy the ID for the project you want to demo (look for <code className="font-mono">makkr.ai</code>), paste into <code className="font-mono">PEEC_PROJECT_ID</code> in <code className="font-mono">.env.local</code>, refresh.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[18px] border p-5" style={{
              background: "rgba(251, 218, 218, 0.55)",
              borderColor: "rgba(183, 59, 79, 0.25)",
            }}>
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: "#B73B4F" }}>
                PEEC NOT CONNECTED
              </div>
              <div className="text-[14px] font-semibold mb-2" style={{ color: "#1A1612" }}>{result.error}</div>
              <div className="text-[12px]" style={{ color: "#4A413A" }}>
                Verify <code className="font-mono">PEEC_API_KEY</code> and <code className="font-mono">PEEC_API_URL</code> in <code className="font-mono">~/code/beacon/.env.local</code>. Default API URL: <code className="font-mono">https://api.peec.ai/customer/v1</code>.
              </div>
            </div>
          )}
        </div>

        <div className="justify-self-end">
          <svg viewBox="0 0 360 450" width="360" style={{ display: "block", maxWidth: "100%" }}>
            <defs>
              <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F4D265" stopOpacity="0.9"/>
                <stop offset="1" stopColor="#F4D265" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FBDADA"/>
                <stop offset="1" stopColor="#FDE3CC"/>
              </linearGradient>
            </defs>
            <path d="M 180 90 L 80 380 L 280 380 Z" fill="url(#lc)" opacity="0.55"/>
            <path d="M 30 380 Q 180 388 330 380" stroke="#1A1612" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M 145 120 L 215 120 L 230 360 L 130 360 Z" fill="url(#tw)" stroke="#1A1612" strokeWidth="2.5" strokeLinejoin="round"/>
            <line x1="138" y1="180" x2="222" y2="180" stroke="#1A1612" strokeWidth="2"/>
            <line x1="135" y1="240" x2="225" y2="240" stroke="#1A1612" strokeWidth="2"/>
            <line x1="133" y1="300" x2="227" y2="300" stroke="#1A1612" strokeWidth="2"/>
            <rect x="167" y="320" width="26" height="40" rx="13" fill="#1A1612"/>
            <circle cx="180" cy="210" r="6" fill="#1A1612"/>
            <circle cx="180" cy="270" r="6" fill="#1A1612"/>
            <path d="M 130 120 L 230 120 L 215 92 L 145 92 Z" fill="#1A1612"/>
            <circle cx="180" cy="78" r="14" fill="#F4D265" stroke="#1A1612" strokeWidth="2"/>
            <path d="M 180 60 L 180 36 M 168 50 L 192 50" stroke="#1A1612" strokeWidth="2.5" strokeLinecap="round"/>
            <g stroke="#B5601E" strokeWidth="2" strokeLinecap="round" opacity="0.85">
              <line x1="158" y1="40" x2="146" y2="28"/>
              <line x1="202" y1="40" x2="214" y2="28"/>
              <line x1="180" y1="22" x2="180" y2="8"/>
            </g>
            <g stroke="#1A1612" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7">
              <path d="M 50 400 q 12 -6 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"/>
              <path d="M 30 420 q 14 -6 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0"/>
            </g>
          </svg>
        </div>
      </section>
    </main>
  );
}
