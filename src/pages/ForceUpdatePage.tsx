import { useState } from 'react';
import { LuX } from 'react-icons/lu';

const API_BASE = 'https://cinepix.top/api/app';

export function ForceUpdatePage({ killSwitchBlocked, reason }: { killSwitchBlocked?: boolean; reason?: string }) {
  const [downloading, setDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/versioncheck`);
      const data = await res.json();
      const ua = navigator.userAgent.toLowerCase();
      const url = ua.includes('android')
        ? data.desktop_download_tv
        : ua.includes('linux')
          ? data.desktop_download_linux
          : data.desktop_download_win;
      window.open(url || 'https://cinepix.top/app', '_blank');
    } catch {
      window.open('https://cinepix.top/app', '_blank');
    }
    setTimeout(() => setDownloading(false), 3000);
  };

  if (dismissed) {
    window.history.back();
    return null;
  }

  if (killSwitchBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] px-8 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors"
        >
          <LuX size={24} />
        </button>
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-4">Access Restricted</h1>
        <p className="text-[var(--on-surface-variant)] text-center max-w-md">
          {reason || 'This application is currently unavailable. Please contact support.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] px-8 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-2 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors"
      >
        <LuX size={24} />
      </button>
      <div className="text-6xl mb-6">⬆️</div>
      <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-4">Update Available</h1>
      <p className="text-[var(--on-surface-variant)] text-center max-w-md mb-8">
        A newer version of Cinepix is required. Please update to continue.
      </p>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="px-8 py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {downloading ? 'Downloading...' : 'Download Update'}
      </button>
    </div>
  );
}
