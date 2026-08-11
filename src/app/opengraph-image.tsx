import { ImageResponse } from "next/og";
import { site, fullAddress } from "@/lib/site-config";

/**
 * The preview card that appears when the site is shared in a text message,
 * on Facebook, or in Google's results. Generated automatically — no design
 * file to maintain.
 */
export const alt = `${site.name} — auto repair in ${site.address.city}, ${site.address.state}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#14110e",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(196,85,47,0.35) 0px, transparent 45%), radial-gradient(circle at 85% 85%, rgba(206,143,34,0.30) 0px, transparent 45%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 20,
              backgroundColor: "#dda63b",
              color: "#211d18",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            JG
          </div>
          <div
            style={{
              marginLeft: 24,
              color: "#e6bc64",
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            Honest auto repair,
          </div>
          <div
            style={{
              color: "#aca091",
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-2px",
            }}
          >
            done right the first time.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(255,255,255,0.15)",
            paddingTop: 32,
          }}
        >
          <div style={{ display: "flex", color: "#d2c8ba", fontSize: 30 }}>{fullAddress}</div>
          <div style={{ display: "flex", color: "#dda63b", fontSize: 36, fontWeight: 700 }}>
            {site.phone}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
