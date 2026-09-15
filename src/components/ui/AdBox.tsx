interface AdBoxProps {
  url: string;
  height?: number;
}

export function AdBox({ url, height = 120 }: AdBoxProps) {
  if (!url) return null;

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        overflow: "hidden",
        margin: "8px 0",
        backgroundColor: "#0a0a0a",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <iframe
        src={url}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "#0a0a0a",
        }}
        scrolling="no"
        title="Advertisement"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
