import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
          position: "relative",
        }}
      >
        {/* Crescent: white circle */}
        <div
          style={{
            position: "absolute",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            left: 3,
            top: 6,
          }}
        />
        {/* Crescent: dark cutout shifted up-right */}
        <div
          style={{
            position: "absolute",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#0C1F3F",
            left: 9,
            top: 3,
          }}
        />
        {/* Cross vertical */}
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 13,
            borderRadius: 2,
            background: "white",
            left: 7,
            top: 10,
          }}
        />
        {/* Cross horizontal */}
        <div
          style={{
            position: "absolute",
            width: 13,
            height: 4,
            borderRadius: 2,
            background: "white",
            left: 2,
            top: 14,
          }}
        />
        {/* Gold star dot */}
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#fbbf24",
            right: 5,
            top: 6,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
