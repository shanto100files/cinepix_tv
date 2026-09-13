import { create } from "zustand";
import { WatchHistoryItem, watchHistoryStorage } from "../storage";
import useAuthStore from "./authStore";

const API_BASE = "https://cinepix.top/api/app";
const HARDCODED_KEY = "78a0e573dfd894d443685159b2e71e2f";

export interface History {
  history: WatchHistoryItem[];
  addItem: (item: WatchHistoryItem) => void;
  updatePlaybackInfo: (
    link: string,
    playbackInfo: Partial<WatchHistoryItem>,
  ) => void;
  clearHistory: () => void;
  updateItemWithInfo: (link: string, infoData: any) => void;
  removeItem: (item: WatchHistoryItem) => void;
  syncWithServer: () => Promise<void>;
}

async function serverSyncItem(item: WatchHistoryItem) {
  const token = useAuthStore.getState().token;
  if (!token) return;
  try {
    await fetch(`${API_BASE}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-App-Key": HARDCODED_KEY,
      },
      body: JSON.stringify({
        provider: item.provider || "",
        link: item.link || "",
        title: item.title || "",
        image: item.poster || "",
        episode_link: item.episode?.link || "",
        episode_title: item.episodeTitle || "",
        season_num: item.episode?.season || 1,
        episode_num: item.episode?.episode || 1,
        progress_seconds: Math.floor(item.progress || 0),
        duration_seconds: Math.floor(item.duration || 0),
      }),
    });
  } catch {}
}

async function serverFetchHistory(): Promise<WatchHistoryItem[]> {
  const token = useAuthStore.getState().token;
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-App-Key": HARDCODED_KEY,
      },
    });
    const data = await res.json();
    return (data.items || []).map((r: any) => ({
      id: `${r.provider_value}:${r.post_link}:${r.season_num}:${r.episode_num}`,
      title: r.post_title || "",
      poster: r.post_image || "",
      provider: r.provider_value || "",
      link: r.post_link || "",
      timestamp: new Date(r.updated_at).getTime() || Date.now(),
      episodeTitle: r.episode_title || "",
      episode: {
        link: r.episode_link || "",
        episode: r.episode_num || 1,
        season: r.season_num || 1,
        title: r.episode_title || "",
      },
      type: "series",
      isSeries: true,
      progress: r.progress_seconds || 0,
      duration: r.duration_seconds || 0,
      lastPlayed: new Date(r.updated_at).getTime() || Date.now(),
      currentTime: r.progress_seconds || 0,
    }));
  } catch {
    return [];
  }
}

const convertStorageToZustand = (items: any[]): WatchHistoryItem[] => {
  return items.map((item) => ({
    ...item,
    lastPlayed: item.timestamp,
    currentTime: item.progress || 0,
  }));
};

const useWatchHistoryStore = create<History>((set) => ({
  // Initialize from our storage service
  history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),

  addItem: (item) => {
    try {
      const existing = watchHistoryStorage
        .getWatchHistory()
        .find((historyItem) => historyItem.id === (item.id || item.link));
      // Format item for our storage service
      const storageItem: WatchHistoryItem = {
        id: item.id || item.link || item.title,
        title: item.title,
        poster: item.poster,
        background: item.background,
        provider: item.provider,
        link: item.link,
        timestamp: existing?.timestamp || item.timestamp || 0,
        episodeTitle:
          item.episodeTitle ||
          (item.episode?.title && item.episode.title !== item.title
            ? item.episode.title
            : existing?.episodeTitle),
        episode: item.episode,
        type: item.type,
        isSeries: item.isSeries ?? item.type === "series",
        cachedInfoData: item.cachedInfoData,
      };

      if (item.duration !== undefined) storageItem.duration = item.duration;
      if (item.currentTime !== undefined)
        storageItem.progress = item.currentTime;

      // Add to storage
      watchHistoryStorage.addToWatchHistory(storageItem);

      // Update UI state
      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });

      serverSyncItem(storageItem);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  },

  updatePlaybackInfo: (link, playbackInfo) => {
    try {
      const history = watchHistoryStorage.getWatchHistory();
      const existingItem = history.find(
        (item) => item.id === link || item.link === link,
      );

      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          progress: playbackInfo.currentTime,
          duration: playbackInfo.duration || existingItem.duration,
          playbackRate:
            playbackInfo.playbackRate || existingItem.playbackRate || 1,
          timestamp: Date.now(),
        };

        watchHistoryStorage.addToWatchHistory(updatedItem);
        serverSyncItem(updatedItem);
      }

      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch (error) {
      console.error("❌ Error updating watch history:", error);
    }
  },

  removeItem: (item) => {
    watchHistoryStorage.removeFromWatchHistory(item.link);
    set({
      history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
    });
  },

  clearHistory: () => {
    watchHistoryStorage.clearWatchHistory();
    set({ history: [] });
  },

  updateItemWithInfo: (link, infoData) => {
    try {
      const history = watchHistoryStorage.getWatchHistory();
      const existingItem = history.find((item) => item.link === link);

      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          cachedInfoData: infoData,
        };

        watchHistoryStorage.addToWatchHistory(updatedItem);
      }

      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch (error) {
      console.error("❌ Error caching info data:", error);
    }
  },

  syncWithServer: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const serverItems = await serverFetchHistory();
      if (serverItems.length === 0) return;

      const localHistory = watchHistoryStorage.getWatchHistory();
      const localIds = new Set(localHistory.map((i) => i.id || i.link));
      const merged = [...localHistory];

      for (const si of serverItems) {
        const siId = si.id || si.link;
        if (!localIds.has(siId)) {
          merged.push(si);
        }
      }

      merged
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 50)
        .forEach((item) => {
          watchHistoryStorage.addToWatchHistory(item);
        });

      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch {}
  },
}));

export default useWatchHistoryStore;
