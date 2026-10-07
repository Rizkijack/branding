import { ImageResponse } from "next/og";

import { profile } from "@/data/profile";

/**
 * ============================================================================
 * OPEN GRAPH IMAGE — /opengraph-image
 * ============================================================================
 * Rendered to PNG at build time by Satori (via next/og) and injected into every
 * page's <meta og:image> automatically.
 *
 * This project uses NO remote images, so the card is built from divs, gradients
 * and inline SVG only — which also means it can never 404 or slow down a build.
 *
 * Size follows the standard 1200x630 OG ratio (1.91:1).
 */

export const alt = `${profile.name} — ${profile.tagline[0]}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    // Satori supports a subset of CSS: flexbox, linear-gradients and
    // absolute positioning. No grid, no box-shadow, no backdrop-filter.
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        // Background: base tint + two radial "blobs" faked with gradients.
        backgroundColor: "#0b0b14",
        backgroundImage:
          "radial-gradient(900px 620px at 12% -8%, rgba(138,92,246,0.55), transparent 62%)," +
          "radial-gradient(760px 560px at 92% 108%, rgba(98,126,234,0.45), transparent 60%)," +
          "radial-gradient(520px 420px at 68% 12%, rgba(244,114,182,0.28), transparent 62%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* ---- Top row: eyebrow + availability ---- */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: "12px",
            padding: "10px 22px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.16)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#b0adc9",
            fontSize: 24,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {/* Status dot */}
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: "#16a6a1",
            }}
          />
          <span>Personal site</span>
        </div>

        {/* ---- Name ---- */}
        <div
          style={{
            marginTop: 34,
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            color: "#ffffff",
            display: "flex",
          }}
        >
          {profile.name}
        </div>

        {/* ---- Tagline ---- */}
        <div
          style={{
            marginTop: 18,
            fontSize: 40,
            fontWeight: 500,
            color: "#d5d2ea",
            display: "flex",
          }}
        >
          {profile.tagline[0]}
        </div>
      </div>

      {/* ---- Bottom row: diamond mark + meta ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {/* Diamond mark, drawn with the same facet language as the hero. */}
          <div
            style={{
              width: 62,
              height: 62,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "31px solid transparent",
                borderRight: "31px solid transparent",
                borderBottom: "28px solid #a78bfa",
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "31px solid transparent",
                borderRight: "31px solid transparent",
                borderTop: "28px solid #f472b6",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#8f8cae",
              fontSize: 26,
            }}
          >
            <span style={{ color: "#d5d2ea", fontWeight: 600 }}>
              {profile.location.label}
            </span>
            <span>{profile.availability}</span>
          </div>
        </div>

        {/* Short bio, right-aligned and clipped to two lines' worth. */}
        <div
          style={{
            display: "flex",
            maxWidth: 420,
            textAlign: "right",
            color: "#8f8cae",
            fontSize: 24,
            lineHeight: 1.45,
          }}
        >
          Full-stack developer working across agentic AI, Web3, and community.
        </div>
      </div>
    </div>,
    size,
  );
}
