import { useState } from "react";

interface AdBoxProps {
  url: string;
  height?: number;
}

export function AdBox({ url, height = 120 }: AdBoxProps) {
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        overflow: "hidden",
        margin: "8px 0",
        backgroundColor: "#000",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <iframe
        src={url}
        style={{
          width: "100%",
          height,
          border: "none",
          backgroundColor: "#000",
        }}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        sandbox="allow-scripts allow-same-origin"
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
}
