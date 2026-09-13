import { useState } from 'react';

const API_BASE = 'https://cinepix.top/api/app';

export function ForceUpdatePage({ killSwitchBlocked, reason }: { killSwitchBlocked?: boolean; reason?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      window.open(`${API_BASE}/versioncheck`, '_blank');
    } catch {}
    setTimeout(() => setDownloading(false), 3000);
  };

  if (killSwitchBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] px-8">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-4">Access Restricted</h1>
        <p className="text-[var(--on-surface-variant)] text-center max-w-md">
          {reason || 'This application is currently unavailable. Please contact support.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] px-8">
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
