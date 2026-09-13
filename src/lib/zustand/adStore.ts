import { create } from "zustand";

const API_BASE = "https://cinepix.top/api/app";
const HARDCODED_KEY = "78a0e573dfd894d443685159b2e71e2f";

interface AdSettings {
  enabled: boolean;
  web_url: string;
  top: string;
  bottom: string;
}

interface AdState {
  ads: AdSettings;
  loaded: boolean;
  fetchAds: () => Promise<void>;
}

const useAdStore = create<AdState>((set) => ({
  ads: { enabled: false, web_url: "", top: "", bottom: "" },
  loaded: false,

  fetchAds: async () => {
    try {
      const res = await fetch(`${API_BASE}/ads`, {
        headers: { "X-App-Key": HARDCODED_KEY },
      });
      const data = await res.json();
      set({
        ads: {
          enabled: !!data.enabled,
          web_url: data.web_url || "",
          top: data.top || "",
          bottom: data.bottom || "",
        },
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));

export default useAdStore;
