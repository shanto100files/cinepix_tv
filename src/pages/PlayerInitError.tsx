import React, { useCallback, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FocusableButton } from "../components/layout/FocusableButton";

interface PlayerInitErrorProps {
  error: string;
  onBack: () => void;
  onOpenVlc?: () => void;
}

// Signals that typically indicate a missing/broken VC++ runtime or libmpv DLL
// rather than a generic mpv option/GPU failure.
const RUNTIME_ERROR_SIGNALS = [
  "0xc000007b",
  "vcruntime",
  "msvcp",
  "msvcr",
  ".dll",
  "dll",
  "library",
  "module could not be found",
  "specified module",
  "load",
];

const looksLikeRuntimeError = (error: string): boolean => {
  const lower = error.toLowerCase();
  return RUNTIME_ERROR_SIGNALS.some((signal) => lower.includes(signal));
};

export const PlayerInitError: React.FC<PlayerInitErrorProps> = ({
  error,
  onBack,
  onOpenVlc,
}) => {
  const [copied, setCopied] = useState(false);
  const isRuntimeError = looksLikeRuntimeError(error);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(error).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }, [error]);

  return (
    <div className="player-page controls-visible">
      <div className="player-error">
        <h2>Native player could not start</h2>
        <p className="player-error-message">{error}</p>
        {isRuntimeError && (
          <p className="player-error-hint">
            This looks like a missing system runtime. Installing or repairing
            the Microsoft Visual C++ Redistributable may help, then restart
            Cinepix.
          </p>
        )}
        <div className="player-error-actions">
          {onOpenVlc && <FocusableButton onClick={onOpenVlc}>Open in VLC</FocusableButton>}
          <FocusableButton onClick={handleCopy}>
            {copied ? "Copied" : "Copy Error"}
          </FocusableButton>
          {isRuntimeError && (
            <FocusableButton
              onClick={() =>
                openUrl("https://aka.ms/vs/17/release/vc_redist.x64.exe")
              }
            >
              Install Microsoft Runtime
            </FocusableButton>
          )}
          <FocusableButton onClick={onBack}>Go Back</FocusableButton>
        </div>
      </div>
    </div>
  );
};
