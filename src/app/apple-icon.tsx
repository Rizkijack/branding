import { ImageResponse } from "next/og";

/**
 * Apple touch icon — /apple-icon
 *
 * Rendered to a 180x180 PNG at build time. Kept in code rather than as a binary
 * asset so the mark stays in sync with `icon.svg` and the hero illustration.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Dark base so the gradient facets read at small sizes.
        backgroundColor: "#0b0b14",
        backgroundImage:
          "radial-gradient(120px 120px at 30% 20%, rgba(138,92,246,0.5), transparent 70%)",
      }}
    >
      {/* Two stacked triangles = the octahedron silhouette. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "52px solid transparent",
            borderRight: "52px solid transparent",
            borderBottom: "48px solid #a78bfa",
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "52px solid transparent",
            borderRight: "52px solid transparent",
            borderTop: "48px solid #b98fd6",
          }}
        />
      </div>
    </div>,
    size,
  );
}
