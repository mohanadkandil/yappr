"use client";

/**
 * Beacon logo — a stylized lighthouse beam radiating from a glowing lamp dot.
 * Single component used everywhere the brand mark appears.
 *
 * Variants:
 *   - "mark" (default): icon only, sized via `size` prop
 *   - "wordmark": icon + "beacon" text alongside
 */

export function Logo({
  size = 26,
  variant = "mark",
  fontSize = 17,
  glow = true,
}: {
  size?: number;
  variant?: "mark" | "wordmark";
  fontSize?: number;
  glow?: boolean;
}) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ display: "block", flex: "none", overflow: "visible" }}
      aria-label="yappr"
    >
      <defs>
        <radialGradient id="beacon-lamp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF1A8" stopOpacity={glow ? 0.95 : 0}/>
          <stop offset="0.45" stopColor="#F4D265" stopOpacity={glow ? 0.7 : 0}/>
          <stop offset="1" stopColor="#F4D265" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="beacon-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4D265" stopOpacity="0.95"/>
          <stop offset="1" stopColor="#F4D265" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="beacon-tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBDADA"/>
          <stop offset="1" stopColor="#FDE3CC"/>
        </linearGradient>
      </defs>

      {/* Soft glow halo around the lamp */}
      {glow && <circle cx="16" cy="8" r="11" fill="url(#beacon-lamp-glow)" />}

      {/* Light cone */}
      <path d="M 16 9 L 4 28 L 28 28 Z" fill="url(#beacon-beam)" opacity="0.85"/>

      {/* Tower */}
      <path d="M 12 12 L 20 12 L 22 28 L 10 28 Z" fill="url(#beacon-tower)" stroke="#1A1612" strokeWidth="1.4" strokeLinejoin="round"/>

      {/* Tower band */}
      <line x1="11" y1="20" x2="21" y2="20" stroke="#1A1612" strokeWidth="1"/>

      {/* Cap */}
      <path d="M 10 12 L 22 12 L 20 8 L 12 8 Z" fill="#1A1612"/>

      {/* Lamp */}
      <circle cx="16" cy="6" r="3" fill="#F4D265" stroke="#1A1612" strokeWidth="1.2"/>
      <circle cx="15.2" cy="5.2" r="0.9" fill="#FFF8E0"/>

      {/* Top spike */}
      <line x1="16" y1="3" x2="16" y2="0.5" stroke="#1A1612" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Ground tick */}
      <line x1="6" y1="29" x2="26" y2="29" stroke="#1A1612" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );

  if (variant === "mark") return mark;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {mark}
      <span style={{
        fontFamily: '-apple-system, "SF Pro Display", system-ui',
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.02em",
        color: "#1A1612",
      }}>beacon</span>
    </span>
  );
}
