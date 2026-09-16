import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { client } from "./lib/client";
import { Layout } from "./components/layout/Layout";
import { WindowControls } from "./components/layout/WindowControls";
import { ExtensionsPage } from "./pages/ExtensionsPage";
import { HomePage } from "./pages/HomePage";
import { MetaPage } from "./pages/MetaPage";
import { SearchPage } from "./pages/SearchPage";
import { PlayerPage } from "./pages/PlayerPage";
import { WafDialog } from "./components/WafDialog";
import useThemeStore from "./lib/zustand/themeStore";
import { settingsStorage } from "./lib/storage";
import { useAppUpdater } from "./lib/hooks/useAppUpdater";
import { initDownloadListeners } from "./lib/zustand/downloadStore";
import { DownloadsPage } from "./pages/DownloadsPage";
import { DownloadsSeriesPage } from "./pages/DownloadsSeriesPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { CatalogPage } from "./pages/CatalogPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PremiumPage } from "./pages/PremiumPage";
import { ForceUpdatePage } from "./pages/ForceUpdatePage";
import { updateProvidersService } from "./lib/services/UpdateProviders";
import { init as initNavigation } from "@noriginmedia/norigin-spatial-navigation-core";
import { invoke } from "@tauri-apps/api/core";
import {
  initializeSyncService,
  publishSyncManifest,
  syncFromSharedFolder,
} from "./lib/sync/syncService";
import useAuthStore from "./lib/zustand/authStore";
import { initializeApp, type InitProgress } from "./lib/services/initService";
import { sendHeartbeat } from "./lib/services/heartbeatService";
import { initAnalytics, pauseAnalytics, resumeAnalytics, flushBatch } from "./lib/services/analyticsService";
import useAdStore from "./lib/zustand/adStore";

import { applyThemeTokens } from "./lib/theme";
import { ToastContainer } from "./components/ui/ToastContainer";
import { ErrorBoundary } from "./components/ErrorBoundary";

let isNavInitialized = false;

export default function App() {
  initDownloadListeners();
  useAppUpdater();

  const { primary } = useThemeStore();
  const tvMode = settingsStorage.isTvModeEnabled();

  const [appReady, setAppReady] = useState(false);
  const [initProgress, setInitProgress] = useState<InitProgress>({ progress: 0, status: 'Starting...' });
  const [appShutdown, setAppShutdown] = useState(false);
  const [shutdownReason, setShutdownReason] = useState('');
  const [forceUpdateNeeded, setForceUpdateNeeded] = useState(false);

  const loadToken = useAuthStore(s => s.loadToken);
  const refreshProfile = useAuthStore(s => s.refreshProfile);
  const fetchAds = useAdStore(s => s.fetchAds);

  useEffect(() => {
    loadToken();
    if (useAuthStore.getState().token) {
      refreshProfile();
    }
  }, [loadToken, refreshProfile]);

  useEffect(() => {
    const t = setTimeout(() => {
      initializeApp(setInitProgress).then((result) => {
        if (result.blocked) {
          setAppShutdown(true);
          setShutdownReason(result.reason || '');
        } else if (result.forceUpdate) {
          setForceUpdateNeeded(true);
        } else {
          setAppReady(true);
        }
      });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!appReady) return;
    initAnalytics();
    sendHeartbeat();
    fetchAds();
    const hbInterval = setInterval(sendHeartbeat, 5 * 60 * 1000);

    import("./lib/zustand/watchHistrory").then(({ default: store }) => {
      store.getState().syncWithServer();
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resumeAnalytics();
      } else {
        pauseAnalytics();
        flushBatch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleBeforeUnload = () => {
      pauseAnalytics();
      flushBatch();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(hbInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [appReady]);

  useEffect(() => {
    initializeSyncService().catch((error) =>
      console.warn("[VegaSync] Startup sync failed:", error),
    );
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncFromSharedFolder().catch((error) =>
          console.warn("[VegaSync] Foreground sync failed:", error),
        );
      } else {
        publishSyncManifest().catch((error) =>
          console.warn("[VegaSync] Background publish failed:", error),
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncFromSharedFolder().catch((error) =>
          console.warn("[VegaSync] Periodic sync failed:", error),
        );
      }
    }, 30000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (tvMode && !isNavInitialized) {
      initNavigation({
        debug: false,
        visualDebug: false,
        distanceCalculationMethod: "corners",
      });
      isNavInitialized = true;
    }
  }, [tvMode]);

  useEffect(() => {
    if (!tvMode) return;
    let lastBack = 0;
    const handleBack = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack" || e.key === "BrowserBack") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (document.querySelector("[data-dialog-open]")) return;
        const now = Date.now();
        if (now - lastBack < 400) return;
        lastBack = now;
        e.preventDefault();
        e.stopPropagation();
        window.history.back();
      }
    };
    window.addEventListener("keydown", handleBack, true);
    return () => window.removeEventListener("keydown", handleBack, true);
  }, [tvMode]);

  useEffect(() => {
    const handleDevtoolsShortcut = (event: KeyboardEvent) => {
      const isDevtoolsShortcut =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "i");

      if (!isDevtoolsShortcut) return;

      event.preventDefault();
      event.stopPropagation();

      if (!settingsStorage.areDevtoolsShortcutsEnabled()) return;

      invoke("toggle_devtools").catch((error) =>
        console.error("Failed to toggle developer tools:", error),
      );
    };

    window.addEventListener("keydown", handleDevtoolsShortcut, true);
    return () =>
      window.removeEventListener("keydown", handleDevtoolsShortcut, true);
  }, []);

  useEffect(() => {
    updateProvidersService.startAutomaticUpdateCheck();
    applyThemeTokens(primary);
  }, [primary]);

  if (appShutdown) {
    return (
      <ForceUpdatePage killSwitchBlocked={true} reason={shutdownReason} />
    );
  }

  if (forceUpdateNeeded) {
    return <ForceUpdatePage />;
  }

  if (!appReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="w-64">
          <div className="text-center mb-6">
            <img src="/cinepix-app-icon.png" alt="Cinepix" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-lg" />
            <h1 className="text-xl font-bold text-[var(--on-surface)]">Cinepix</h1>
          </div>
          <div className="w-full h-2 bg-[var(--surface-container-high)] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
              style={{ width: `${initProgress.progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-[var(--on-surface-variant)]">{initProgress.status}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <QueryClientProvider client={client}>
      <WafDialog />
      <ToastContainer />
      <BrowserRouter>
        <WindowControls />
        <Routes>
          <Route path="player" element={<PlayerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="content/:url" element={<MetaPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/watchlist/content/:url" element={<MetaPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route
              path="/downloads/series/:showName"
              element={<DownloadsSeriesPage />}
            />
            <Route path="extensions" element={<ExtensionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
