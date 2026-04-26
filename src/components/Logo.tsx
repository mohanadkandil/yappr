"use client";

/**
 * yappr brand mark.
 *
 * One typeface, one weight, one color. The mark is the word — set tight,
 * inkwell-dark, no gradient, no glow, no separate icon. Linear / Vercel /
 * Cal.com level of restraint.
 *
 * Variants:
 *   - "wordmark" (default) — full lowercase wordmark
 *   - "mark"               — square inkwell tile with white "y" (favicon)
 *   - "tile-wordmark"      — tile + wordmark side by side
 */

type Variant = "wordmark" | "mark" | "tile-wordmark";

export function Logo({
  size = 18,
  variant = "wordmark",
  color = "#1A1612",
}: {
  size?: number;
  variant?: Variant;
  color?: string;
}) {
  const tile = (
    <span
      aria-hidden
      style={{
        width: size * 1.45,
        height: size * 1.45,
        borderRadius: size * 0.32,
        background: color,
        color: "#FAF6EE",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '-apple-system, "SF Pro Display", system-ui',
        fontSize: size * 0.92,
        fontWeight: 800,
        letterSpacing: "-0.06em",
        flex: "none",
      }}
    >
      y
    </span>
  );

  if (variant === "mark") return tile;

  const wordmark = (
    <span
      aria-label="yappr"
      style={{
        fontFamily: '-apple-system, "SF Pro Display", system-ui',
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.05em",
        color,
        lineHeight: 1,
      }}
    >
      yappr
    </span>
  );

  if (variant === "tile-wordmark") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.45 }}>
        {tile}
        {wordmark}
      </span>
    );
  }

  return wordmark;
}
