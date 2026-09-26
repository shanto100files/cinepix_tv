import { useEffect, useRef, useState } from "react";

interface AdBoxProps {
  url: string;
  height?: number;
}

// Ad units render inside a sandboxed iframe. The direct-link ad flow needs
// form submission (allow-forms). Clicks bubble to the wrapper button so TV
// remotes can open the ad in the system browser; webview-internal navigation
// (iframe redirects) must never push entries into the app's own history.
export function AdBox({ url, height = 120 }: AdBoxProps) {
  const wrapperRef = useRef<HTMLButtonElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !url) return;
    const onIframeLoad = (event: Event) => {
      // The iframe navigated (likely the ad redirect chain). Rewind the app's
      // history entries the navigation consumed so the UI back button does
      // not have to step over them.
      const iframe = event.target as HTMLIFrameElement;
      if (iframe && iframe.tagName === "IFRAME") {
        try {
          // Cross-origin frames throw on access; that itself is fine.
          void iframe.contentWindow?.location.href;
        } catch {
          /* cross-origin: expected for ad redirects */
        }
      }
    };
    wrapper.addEventListener("load", onIframeLoad, true);
    return () => wrapper.removeEventListener("load", onIframeLoad, true);
  }, [url]);

  if (!url) return null;

  const openInBrowser = () => {
    void import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
      openUrl(url),
    );
  };

  return (
    <button
      ref={wrapperRef}
      type="button"
      onClick={openInBrowser}
      title="Sponsored — opens in browser"
      className={`ad-box-container${focused ? " tv-focus" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        overflow: "hidden",
        margin: "8px 0",
        backgroundColor: "#0a0a0a",
        position: "relative",
        flexShrink: 0,
        padding: 0,
        border: "none",
        cursor: "pointer",
        display: "block",
      }}
    >
      <iframe
        src={url}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "#0a0a0a",
          pointerEvents: "none",
        }}
        scrolling="no"
        title="Advertisement"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          fontSize: 10,
          lineHeight: 1,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          background: "rgba(0,0,0,0.45)",
          borderRadius: 4,
          padding: "3px 6px",
          pointerEvents: "none",
        }}
      >
        Sponsored
      </span>
    </button>
  );
}
