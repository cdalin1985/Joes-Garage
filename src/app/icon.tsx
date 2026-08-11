import { ImageResponse } from "next/og";

/** Browser-tab icon and the logo referenced in the shop's search data. */
export const size = { width: 192, height: 192 };
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
          background: "linear-gradient(135deg, #e6bc64 0%, #ce8f22 100%)",
          color: "#211d18",
          fontSize: 84,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
        }}
      >
        JG
      </div>
    ),
    size,
  );
}
