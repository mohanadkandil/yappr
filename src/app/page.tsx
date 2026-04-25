import Link from "next/link";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen text-[#1A1612] beacon-bg-shift" style={{
      background:
        "radial-gradient(1100px 500px at 18% -10%, #FDE3CC 0%, transparent 60%)," +
        "radial-gradient(900px 600px at 105% 20%, #FBDADA 0%, transparent 60%)," +
        "radial-gradient(800px 600px at 50% 110%, #E2DCF3 0%, transparent 55%)," +
        "#FAF6EE",
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    }}>
      {/* TOP NAV */}
      <nav className="flex items-center justify-between px-10 py-6 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
          <span className="inline-block w-[26px] h-[26px] rounded-full relative" style={{
            background: "radial-gradient(circle at 30% 30%, #7E5A0E, #B5601E 70%)",
            boxShadow: "0 0 16px rgba(255,170,106,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
          }} />
          yappr
        </div>
        <div className="flex items-center gap-6 text-[13px]" style={{ color: "#4A413A" }}>
          <a href="#acts" className="hover:underline">How it works</a>
          <a href="#about" className="hover:underline">About</a>
          <a href="https://github.com/mohanadkandil/yappr" target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          <Link href="/studio" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold" style={{
            background: "#1A1612", color: "#FAF6EE",
            boxShadow: "0 6px 18px rgba(26,22,18,0.18)",
          }}>
            Open Studio →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid grid-cols-[1.3fr_1fr] gap-12 items-center px-10 pt-12 pb-20 max-w-[1200px] mx-auto">
        <div className="beacon-fade-in-up">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] mb-5" style={{ color: "#B5601E" }}>
            Built on Peec MCP · #BuiltWithPeec
          </div>
          <h1 className="font-extrabold leading-[0.94] tracking-[-0.04em] mb-5"
              style={{ fontSize: 96, fontFamily: '-apple-system, "SF Pro Display", system-ui' }}>
            Be{" "}
            <em className="font-medium" style={{ fontFamily: '"New York", "Iowan Old Style", Georgia, serif', color: "#B73B4F" }}>
              seen
            </em>{" "}
            by AI.
          </h1>
          <p className="text-[22px] leading-[1.4] max-w-[420px] mb-8 font-medium" style={{ color: "#4A413A" }}>
            The writing surface AI search engines actually quote.
          </p>
          <div className="flex gap-3 mb-4">
            <Link href="/studio" className="beacon-keycap beacon-keycap-primary">
              ⌘ Open Studio
            </Link>
            <a href="#acts" className="beacon-keycap beacon-keycap-dark">
              ▸ See how it works
            </a>
          </div>
        </div>
        <div className="justify-self-end beacon-fade-in-up" style={{ animationDelay: "180ms" }}>
          <Lighthouse />
        </div>
      </section>

      {/* THREE ACTS — editorial spreads, asymmetric, illustrated */}
      <section id="acts" className="px-10 pb-24 max-w-[1100px] mx-auto">
        {/* Section opener */}
        <div className="text-center mb-20 beacon-fade-in-up">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: "#B5601E" }}>
            Three acts · one closed loop
          </div>
          <h2 className="font-extrabold tracking-[-0.03em]" style={{
            fontSize: 56, lineHeight: 1.05,
            fontFamily: '-apple-system, "SF Pro Display", system-ui',
          }}>
            Write better. <em className="font-medium" style={{ fontFamily: '"New York", Georgia, serif', color: "#2F8466" }}>
              Ship
            </em> automatically.
          </h2>
        </div>

        {/* ACT 01 — Quill (illustration on right) */}
        <Act
          number="01"
          chip="QUILL"
          chipColor="#B73B4F"
          title="Write with the receipts in view."
          lede="Cursor for AI search content. Every lint is grounded in a real Peec citation — never a guess."
          body="As you type, the sidebar audits your H1, your claim, your schema, your JTBD framing — and shows you the exact passage AI engines are quoting from your competitor instead. Click suggest fix, watch Claude rewrite the span."
          illustration={<QuillIllu />}
          flip={false}
        />

        {/* ACT 02 — Forge (illustration on left) */}
        <Act
          number="02"
          chip="FORGE"
          chipColor="#B5601E"
          title="Draft from your own citation graph."
          lede="Type a topic. Forge pulls your tracked competitors and cited URL titles from Peec, then asks an LLM via OpenRouter for a JTBD-anchored article."
          body="No blank-page tax. No fabrication. The draft lands in Quill the moment it's ready, ready for the same lint sidebar to refine it."
          illustration={<ForgeIllu />}
          flip={true}
        />

        {/* ACT 03 — Wire (centered, full-width-ish) */}
        <Act
          number="03"
          chip="WIRE"
          chipColor="#6E4FAE"
          title="Triggers wired to actions."
          lede="MCP-native end-to-end. Peec for the eyes, Composio for the hands. 1000+ tools wireable through one config field."
          body="Patches watch your Peec project. When citations move, agents open GitHub PRs, post Slack briefs, draft Notion pages — autonomously, with receipts."
          illustration={<WireIllu />}
          flip={false}
          full
        />
      </section>

      {/* ABOUT */}
      <section id="about" className="px-10 pb-20 max-w-[860px] mx-auto">
        <div className="rounded-[24px] p-7" style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(26,22,18,0.06)",
          boxShadow: "0 12px 30px rgba(26,22,18,0.06)",
          backdropFilter: "blur(14px)",
        }}>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.26em] mb-2" style={{ color: "#B5601E" }}>
                tiny footer before the footer
              </div>
              <h3 className="font-extrabold text-[28px] tracking-[-0.02em] mb-2" style={{
                fontFamily: '-apple-system, "SF Pro Display", system-ui',
              }}>made by Mohanad Kandil</h3>
              <p className="text-[16px] leading-[1.55]" style={{
                fontFamily: '"New York", Georgia, serif', color: "#4A413A",
              }}>
                input: Peec citations. output: fewer awkward comparison pages. side quest: make the robots quote you back.
              </p>
            </div>
            <div className="flex-none text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{
              background: "radial-gradient(circle at 30% 30%, #F4D265, #B5601E 65%)",
              boxShadow: "0 0 22px rgba(255,170,106,0.55), inset 0 2px 0 rgba(255,255,255,0.5)",
            }} />
              <div className="flex gap-2 flex-wrap justify-end">
                <a href="https://github.com/mohanadkandil" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(26,22,18,0.08)", color: "#1A1612" }}>↗ GitHub</a>
                <a href="https://x.com/mohanadkandil" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(26,22,18,0.08)", color: "#1A1612" }}>↗ X</a>
                <a href="https://www.linkedin.com/in/mohanadkandil/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full text-[12px] font-bold border" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(26,22,18,0.08)", color: "#1A1612" }}>↗ LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-10 py-8 border-t max-w-[1280px] mx-auto flex items-center justify-between text-[12px]" style={{
        borderColor: "rgba(26,22,18,0.08)", color: "#8E8478",
      }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-[16px] h-[16px] rounded-full" style={{
            background: "radial-gradient(circle at 30% 30%, #7E5A0E, #B5601E 70%)",
            boxShadow: "0 0 8px rgba(255,170,106,0.5)",
          }} />
          <span className="font-bold" style={{ color: "#4A413A" }}>yappr</span>
          <span>· Built on Peec MCP · #BuiltWithPeec</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/mohanadkandil/yappr" target="_blank" rel="noreferrer" className="hover:underline">yappr CLI</a>
          <a href="https://peec.ai" target="_blank" rel="noreferrer" className="hover:underline">peec.ai</a>
          <span>· 2026</span>
        </div>
      </footer>
    </main>
  );
}

// =====================================================================
// ACT — editorial spread component
// =====================================================================

function Act({ number, chip, chipColor, title, lede, body, illustration, flip, full }: {
  number: string; chip: string; chipColor: string;
  title: string; lede: string; body: string;
  illustration: React.ReactNode;
  flip: boolean;
  full?: boolean;
}) {
  const cols = full
    ? "grid-cols-1"
    : flip ? "grid-cols-[1fr_1.2fr]" : "grid-cols-[1.2fr_1fr]";

  const text = (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="beacon-act-number">{number}</span>
        <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold" style={{
          background: `${chipColor}15`, color: chipColor,
          letterSpacing: "0.26em", textTransform: "uppercase",
          border: `1px solid ${chipColor}33`,
        }}>{chip}</span>
      </div>
      <h3 className="font-extrabold tracking-[-0.025em] mb-3" style={{
        fontSize: full ? 44 : 38, lineHeight: 1.06,
        fontFamily: '-apple-system, "SF Pro Display", system-ui',
        maxWidth: full ? 720 : "100%",
      }}>{title}</h3>
      <p className="text-[18px] leading-[1.5] mb-3 font-medium" style={{
        fontFamily: '"New York", "Iowan Old Style", Georgia, serif',
        fontStyle: "italic", color: "#1A1612",
        maxWidth: full ? 640 : "100%",
      }}>{lede}</p>
      <p className="text-[15px] leading-[1.6]" style={{ color: "#4A413A", maxWidth: full ? 640 : "100%" }}>{body}</p>
    </div>
  );

  return (
    <div className={`grid ${cols} gap-12 items-center mb-28 beacon-fade-in-up`}>
      {full ? (
        <>
          <div className="text-center">{text}</div>
          <div className="flex justify-center">{illustration}</div>
        </>
      ) : flip ? (
        <>
          <div className="justify-self-start">{illustration}</div>
          {text}
        </>
      ) : (
        <>
          {text}
          <div className="justify-self-end">{illustration}</div>
        </>
      )}
    </div>
  );
}

// =====================================================================
// ILLUSTRATIONS
// =====================================================================

function QuillIllu() {
  return (
    <svg viewBox="0 0 360 280" width="360" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
      {/* paper sheet */}
      <g transform="rotate(-3 180 140)">
        <rect x="50" y="50" width="240" height="200" rx="6" fill="#FAF6EE" stroke="#1A1612" strokeWidth="2"/>
        {/* faint baseline rules */}
        <line x1="78" y1="100" x2="262" y2="100" stroke="#1A1612" strokeWidth="0.6" opacity="0.18"/>
        <line x1="78" y1="130" x2="262" y2="130" stroke="#1A1612" strokeWidth="0.6" opacity="0.18"/>
        <line x1="78" y1="160" x2="262" y2="160" stroke="#1A1612" strokeWidth="0.6" opacity="0.18"/>
        <line x1="78" y1="190" x2="262" y2="190" stroke="#1A1612" strokeWidth="0.6" opacity="0.18"/>
        <line x1="78" y1="220" x2="262" y2="220" stroke="#1A1612" strokeWidth="0.6" opacity="0.18"/>

        {/* line 1 — text + animated rose underline */}
        <line x1="80" y1="100" x2="240" y2="100" stroke="#1A1612" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
        <path className="beacon-quill-mark beacon-quill-mark-1"
              d="M80 108 L 240 108"
              stroke="#B73B4F" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/* line 2 — partial */}
        <line x1="80" y1="130" x2="200" y2="130" stroke="#1A1612" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
        <path className="beacon-quill-mark beacon-quill-mark-2"
              d="M80 138 L 160 138"
              stroke="#B5601E" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/* line 3 */}
        <line x1="80" y1="160" x2="220" y2="160" stroke="#1A1612" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
        <path className="beacon-quill-mark beacon-quill-mark-3"
              d="M80 168 L 200 168"
              stroke="#4A7A45" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/* lines 4-5 plain */}
        <line x1="80" y1="190" x2="170" y2="190" stroke="#1A1612" strokeWidth="6" strokeLinecap="round" opacity="0.55"/>
        <line x1="80" y1="220" x2="220" y2="220" stroke="#1A1612" strokeWidth="6" strokeLinecap="round" opacity="0.4"/>
      </g>

      {/* quill pen (top-right, dipping toward the page) */}
      <g transform="translate(245, 28) rotate(28)">
        {/* feather shaft */}
        <path d="M 0 0 L 0 110" stroke="#1A1612" strokeWidth="3" strokeLinecap="round"/>
        {/* feather barbs */}
        <path d="M 0 6  q -10 -4 -22 0  q 10 4 22 0 z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4"/>
        <path d="M 0 18 q -14 -4 -30 0 q 14 4 30 0 z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4"/>
        <path d="M 0 32 q -18 -4 -38 0 q 18 4 38 0 z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4"/>
        <path d="M 0 46 q -16 -4 -34 0 q 16 4 34 0 z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4"/>
        <path d="M 0 60 q -12 -4 -26 0 q 12 4 26 0 z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4"/>
        {/* nib */}
        <path d="M -3 110 L 3 110 L 0 122 Z" fill="#1A1612"/>
      </g>
    </svg>
  );
}

function ForgeIllu() {
  return (
    <svg viewBox="0 0 360 300" width="360" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
      {/* anvil base */}
      <g>
        {/* shadow */}
        <ellipse cx="180" cy="262" rx="86" ry="6" fill="#1A1612" opacity="0.2"/>
        {/* stand */}
        <path d="M 130 252 L 230 252 L 222 232 L 138 232 Z" fill="#1A1612"/>
        {/* anvil top */}
        <path d="M 100 232 L 260 232 L 254 215 L 232 200 L 128 200 L 106 215 Z" fill="#FBDADA" stroke="#1A1612" strokeWidth="2.4" strokeLinejoin="round"/>
        <line x1="106" y1="215" x2="254" y2="215" stroke="#1A1612" strokeWidth="2"/>
        {/* anvil horn */}
        <path d="M 100 232 Q 70 230 60 215 Q 70 218 106 215 Z" fill="#FDE3CC" stroke="#1A1612" strokeWidth="2"/>
        {/* metal bar being struck */}
        <rect x="160" y="190" width="74" height="12" rx="3" fill="#F4D265" stroke="#1A1612" strokeWidth="2"/>
        <rect x="180" y="194" width="40" height="4" rx="2" fill="#FFF8E0"/>
      </g>

      {/* hammer */}
      <g className="beacon-hammer">
        <line x1="220" y1="76" x2="240" y2="190" stroke="#1A1612" strokeWidth="6" strokeLinecap="round"/>
        <rect x="200" y="58" width="56" height="28" rx="4" fill="#1A1612"/>
        <rect x="244" y="64" width="22" height="16" rx="2" fill="#4A413A"/>
      </g>

      {/* sparks */}
      <g>
        <circle className="beacon-spark" cx="195" cy="195" r="3" fill="#F4D265" style={{ ['--dx' as string]: "-30px" } as React.CSSProperties}/>
        <circle className="beacon-spark" cx="200" cy="195" r="2.5" fill="#B5601E" style={{ ['--dx' as string]: "-12px", animationDelay: "0.4s" } as React.CSSProperties}/>
        <circle className="beacon-spark" cx="206" cy="195" r="3" fill="#F4D265" style={{ ['--dx' as string]: "8px", animationDelay: "0.9s" } as React.CSSProperties}/>
        <circle className="beacon-spark" cx="212" cy="195" r="2" fill="#B73B4F" style={{ ['--dx' as string]: "20px", animationDelay: "1.4s" } as React.CSSProperties}/>
        <circle className="beacon-spark" cx="218" cy="195" r="2.5" fill="#F4D265" style={{ ['--dx' as string]: "32px", animationDelay: "1.9s" } as React.CSSProperties}/>
      </g>

      {/* glow under bar */}
      <ellipse cx="200" cy="200" rx="50" ry="10" fill="#F4D265" opacity="0.25"/>

      {/* small smoke clouds */}
      <g opacity="0.45">
        <circle cx="80"  cy="120" r="14" fill="#1A1612"/>
        <circle cx="92"  cy="115" r="18" fill="#1A1612"/>
        <circle cx="106" cy="124" r="14" fill="#1A1612"/>
      </g>
    </svg>
  );
}

function WireIllu() {
  return (
    <svg viewBox="0 0 760 300" width="760" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
      <defs>
        <filter id="wirePanelShadow" x="-8%" y="-18%" width="116%" height="136%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#1A1612" floodOpacity="0.10"/>
        </filter>
      </defs>

      <g filter="url(#wirePanelShadow)">
        <rect x="22" y="26" width="716" height="248" rx="18" fill="rgba(255,255,255,0.58)" stroke="rgba(26,22,18,0.10)"/>
        <rect x="22" y="26" width="716" height="44" rx="18" fill="#FFF9ED" stroke="rgba(26,22,18,0.06)"/>
        <line x1="22" y1="70" x2="738" y2="70" stroke="#1A1612" strokeOpacity="0.08"/>
        <circle cx="48" cy="48" r="4" fill="#B73B4F"/>
        <circle cx="64" cy="48" r="4" fill="#B5601E"/>
        <circle cx="80" cy="48" r="4" fill="#2F8466"/>
        <text x="110" y="52" fontFamily="-apple-system, 'SF Pro Display', system-ui" fontSize="11" fontWeight="800" fill="#4A413A">citation-loss patch</text>
        <text x="618" y="52" fontFamily="-apple-system, 'SF Pro Display', system-ui" fontSize="10" fontWeight="800" fill="#2F8466">ready to run</text>

        <g stroke="#1A1612" strokeWidth="1.5" strokeOpacity="0.24" fill="none">
          <path d="M 156 152 H 238"/>
          <path d="M 344 152 H 416"/>
          <path d="M 522 152 C 562 152, 566 105, 604 105"/>
          <path d="M 522 152 H 604"/>
          <path d="M 522 152 C 562 152, 566 199, 604 199"/>
        </g>

        <g stroke="#B5601E" strokeWidth="2" fill="none" strokeLinecap="round">
          <path className="beacon-wire-pulse" d="M 156 152 H 238"/>
          <path className="beacon-wire-pulse delay-1" d="M 344 152 H 416"/>
          <path className="beacon-wire-pulse delay-2" d="M 522 152 C 562 152, 566 105, 604 105"/>
          <path className="beacon-wire-pulse delay-1" d="M 522 152 H 604"/>
          <path className="beacon-wire-pulse delay-2" d="M 522 152 C 562 152, 566 199, 604 199"/>
        </g>

        <g fontFamily="-apple-system, 'SF Pro Display', system-ui">
          <WorkflowNode x={60} y={116} width={96} label="Watch" detail="Peec drop" color="#B73B4F" fill="#FBDADA" />
          <WorkflowNode x={238} y={116} width={106} label="Read" detail="citations" color="#B5601E" fill="#FDE3CC" />
          <WorkflowNode x={416} y={116} width={106} label="Decide" detail="severity" color="#6E4FAE" fill="#E2DCF3" />

          <OutputNode x={604} y={82} label="GitHub PR" detail="patch page copy" color="#1A1612" fill="#FFFFFF" />
          <OutputNode x={604} y={129} label="Slack brief" detail="send receipt" color="#6E4FAE" fill="#F3EFFD" />
          <OutputNode x={604} y={176} label="Linear issue" detail="track follow-up" color="#B73B4F" fill="#FFF0F2" />
        </g>

        <g>
          <rect x="60" y="226" width="206" height="24" rx="7" fill="#FAF6EE" stroke="rgba(26,22,18,0.08)"/>
          <text x="74" y="242" fontFamily="-apple-system, 'SF Pro Text', system-ui" fontSize="10" fontWeight="700" fill="#4A413A">Trigger: visibility drops 2 sigma</text>
          <rect x="280" y="226" width="176" height="24" rx="7" fill="#FAF6EE" stroke="rgba(26,22,18,0.08)"/>
          <text x="294" y="242" fontFamily="-apple-system, 'SF Pro Text', system-ui" fontSize="10" fontWeight="700" fill="#4A413A">Evidence: Peec MCP</text>
          <rect x="470" y="226" width="188" height="24" rx="7" fill="#FAF6EE" stroke="rgba(26,22,18,0.08)"/>
          <text x="484" y="242" fontFamily="-apple-system, 'SF Pro Text', system-ui" fontSize="10" fontWeight="700" fill="#4A413A">Action: Composio tools</text>
        </g>
      </g>
    </svg>
  );
}

function WorkflowNode({ x, y, width, label, detail, color, fill }: {
  x: number; y: number; width: number; label: string; detail: string; color: string; fill: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="72" rx="10" fill={fill} stroke={color} strokeWidth="1.6"/>
      <circle cx={x + 20} cy={y + 22} r="6" fill={color} opacity="0.88"/>
      <text x={x + 36} y={y + 27} fontSize="13" fontWeight="900" fill="#1A1612">{label}</text>
      <text x={x + 16} y={y + 53} fontSize="10" fontWeight="800" fill={color} letterSpacing="0.08em">{detail}</text>
    </g>
  );
}

function OutputNode({ x, y, label, detail, color, fill }: {
  x: number; y: number; label: string; detail: string; color: string; fill: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width="104" height="40" rx="9" fill={fill} stroke={color} strokeWidth="1.4"/>
      <circle className="beacon-wire-node" cx={x + 16} cy={y + 20} r="4" fill={color} opacity="0.78"/>
      <text x={x + 30} y={y + 17} fontSize="10" fontWeight="900" fill="#1A1612">{label}</text>
      <text x={x + 30} y={y + 31} fontSize="8.5" fontWeight="700" fill="#8E8478">{detail}</text>
    </g>
  );
}

// =====================================================================
// LIGHTHOUSE (kept from previous)
// =====================================================================

function Lighthouse() {
  return (
    <svg viewBox="0 0 380 480" width="380" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4D265" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#F4D265" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBDADA"/>
          <stop offset="0.5" stopColor="#FDE3CC"/>
          <stop offset="1" stopColor="#FBDADA"/>
        </linearGradient>
        <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2A0E"/>
          <stop offset="1" stopColor="#1A1612"/>
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF1A8" stopOpacity="0.95"/>
          <stop offset="0.4" stopColor="#F4D265" stopOpacity="0.8"/>
          <stop offset="1" stopColor="#F4D265" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <circle className="beacon-star" cx="60" cy="40" r="1.5" fill="#1A1612"/>
      <circle className="beacon-star s2" cx="320" cy="55" r="1.2" fill="#1A1612"/>
      <circle className="beacon-star s3" cx="290" cy="100" r="1" fill="#1A1612"/>
      <circle className="beacon-star" cx="80" cy="120" r="1" fill="#1A1612"/>
      <circle className="beacon-star s2" cx="40" cy="90" r="1.2" fill="#1A1612"/>

      <g className="beacon-light-sweep">
        <path d="M 190 100 L 50 410 L 330 410 Z" fill="url(#lc)"/>
      </g>

      <g className="beacon-tower">
        <path d="M 30 410 Q 190 418 350 410" stroke="#1A1612" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M 153 138 L 227 138 L 244 392 L 136 392 Z" fill="url(#tw)" stroke="#1A1612" strokeWidth="2.6" strokeLinejoin="round"/>
        <line x1="146" y1="200" x2="234" y2="200" stroke="#1A1612" strokeWidth="2"/>
        <line x1="143" y1="262" x2="237" y2="262" stroke="#1A1612" strokeWidth="2"/>
        <line x1="140" y1="324" x2="240" y2="324" stroke="#1A1612" strokeWidth="2"/>
        <rect x="177" y="346" width="26" height="46" rx="13" fill="#1A1612"/>
        <circle cx="198" cy="370" r="1.2" fill="#F4D265"/>
        <circle cx="190" cy="232" r="6.5" fill="#1A1612"/>
        <circle cx="190" cy="294" r="6.5" fill="#1A1612"/>
        <circle cx="190" cy="232" r="2" fill="#FFF1A8"/>
        <circle cx="190" cy="294" r="2" fill="#FFF1A8"/>
        <path d="M 138 138 L 242 138 L 226 108 L 154 108 Z" fill="url(#cap)"/>
        <line x1="135" y1="138" x2="245" y2="138" stroke="#1A1612" strokeWidth="2"/>
        <g className="beacon-lamp">
          <circle cx="190" cy="92" r="28" fill="url(#lampGlow)"/>
          <circle cx="190" cy="92" r="14" fill="#F4D265" stroke="#1A1612" strokeWidth="2"/>
          <circle cx="186" cy="88" r="4" fill="#FFF8E0"/>
        </g>
        <path d="M 190 74 L 190 50 M 178 64 L 202 64" stroke="#1A1612" strokeWidth="2.6" strokeLinecap="round"/>
        <g stroke="#B5601E" strokeWidth="2" strokeLinecap="round" opacity="0.85">
          <line x1="168" y1="54" x2="156" y2="42"/>
          <line x1="212" y1="54" x2="224" y2="42"/>
          <line x1="190" y1="36" x2="190" y2="22"/>
        </g>
        <g transform="translate(264, 372)">
          <ellipse cx="0" cy="22" rx="14" ry="2.5" fill="#1A1612" opacity="0.18"/>
          <path d="M -7 4 L 7 4 L 9 22 L -9 22 Z" fill="#B73B4F" stroke="#1A1612" strokeWidth="1.4" strokeLinejoin="round"/>
          <circle cx="0" cy="-2" r="6.5" fill="#FDE3CC" stroke="#1A1612" strokeWidth="1.4"/>
          <path d="M -7 -6 L 7 -6 L 6 -10 L -6 -10 Z" fill="#1A1612"/>
          <line x1="-6" y1="-8" x2="6" y2="-8" stroke="#FDE3CC" strokeWidth="0.8"/>
          <circle cx="-2" cy="-2" r="0.9" fill="#1A1612"/>
          <circle cx="2" cy="-2" r="0.9" fill="#1A1612"/>
          <path d="M -2 1 q 2 1.5 4 0" stroke="#1A1612" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          <g className="beacon-keeper-arm" style={{ transformBox: "fill-box", transformOrigin: "0 0" }}>
            <line x1="6" y1="6" x2="14" y2="-2" stroke="#1A1612" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="14" cy="-2" r="1.6" fill="#FDE3CC" stroke="#1A1612" strokeWidth="1"/>
          </g>
          <line x1="-6" y1="6" x2="-9" y2="14" stroke="#1A1612" strokeWidth="1.6" strokeLinecap="round"/>
        </g>
      </g>

      <g stroke="#1A1612" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55">
        <path className="beacon-waves-1" d="M 30 432 q 12 -6 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"/>
        <path className="beacon-waves-2" d="M 10 452 q 14 -6 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0 t 28 0"/>
        <path className="beacon-waves-1" d="M 50 470 q 12 -6 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0" opacity="0.4"/>
      </g>
    </svg>
  );
}
