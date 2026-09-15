import { openUrl } from "@tauri-apps/plugin-opener";

interface AdBoxProps {
  url: string;
  height?: number;
}

export function AdBox({ url, height = 100 }: AdBoxProps) {
  if (!url) return null;

  return (
    <div
      onClick={() => openUrl(url).catch(() => {})}
      style={{
        width: "100%",
        height,
        borderRadius: 10,
        overflow: "hidden",
        margin: "12px 0",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        border: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 1.5,
          textTransform: "uppercase" as const,
          position: "relative",
          zIndex: 1,
        }}
      >
        Sponsor
      </span>
    </div>
  );
}
