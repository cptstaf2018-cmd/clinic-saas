import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C1F3F",
          position: "relative",
        }}
      >
        {/* Subtle glow behind crescent */}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(37,99,235,0.18)",
            left: 10,
            top: 34,
          }}
        />
        {/* Crescent: white circle */}
        <div
          style={{
            position: "absolute",
            width: 104,
            height: 104,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            left: 14,
            top: 42,
          }}
        />
        {/* Crescent: dark cutout shifted up-right to carve the crescent */}
        <div
          style={{
            position: "absolute",
            width: 86,
            height: 86,
            borderRadius: "50%",
            background: "#0C1F3F",
            left: 42,
            top: 28,
          }}
        />
        {/* Medical cross — vertical bar */}
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 54,
            borderRadius: 7,
            background: "white",
            left: 40,
            top: 71,
          }}
        />
        {/* Medical cross — horizontal bar */}
        <div
          style={{
            position: "absolute",
            width: 54,
            height: 14,
            borderRadius: 7,
            background: "white",
            left: 13,
            top: 91,
          }}
        />
        {/* Gold star */}
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fbbf24",
            right: 38,
            top: 36,
          }}
        />
        {/* Small star accent */}
        <div
          style={{
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#fde68a",
            right: 28,
            top: 54,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
