import { create } from 'zustand';
import { mainStorage } from '../storage';

const API_BASE = 'https://cinepix.top/api/app';
const HARDCODED_KEY = '78a0e573dfd894d443685159b2e71e2f';

export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: number;
  premium: number;
  premium_expires_at?: string;
  watchlist?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  premiumJustActivated: boolean;

  loadToken: () => void;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setPremiumJustActivated: (v: boolean) => void;
}

function getDeviceId(): string {
  let id = mainStorage.getString('@device_id');
  if (!id) {
    id = `desktop_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
    mainStorage.setString('@device_id', id);
  }
  return id;
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isPremium: false,
  premiumJustActivated: false,

  loadToken: () => {
    const token = mainStorage.getString('auth_token');
    const user = mainStorage.getObject<User>('auth_user');
    if (token && user) {
      set({ token, user, isLoading: false, isPremium: !!user.premium });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    try {
      const deviceId = getDeviceId();
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Key': HARDCODED_KEY },
        body: JSON.stringify({ username, password, device_id: deviceId, app_version: '2.0.7' }),
      });
      const data = await res.json();
      if (data.token) {
        mainStorage.setString('auth_token', data.token);
        mainStorage.setObject('auth_user', data.user);
        set({ token: data.token, user: data.user, isPremium: !!data.user.premium });
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Login failed' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Network error' };
    }
  },

  register: async (username, email, password) => {
    try {
      const deviceId = getDeviceId();
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Key': HARDCODED_KEY },
        body: JSON.stringify({ username, email, password, device_id: deviceId }),
      });
      const data = await res.json();
      if (data.token) {
        mainStorage.setString('auth_token', data.token);
        mainStorage.setObject('auth_user', data.user);
        set({ token: data.token, user: data.user, isPremium: !!data.user.premium });
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Registration failed' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Network error' };
    }
  },

  logout: () => {
    mainStorage.delete('auth_token');
    mainStorage.delete('auth_user');
    set({ token: null, user: null, isPremium: false });
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-App-Key': HARDCODED_KEY },
      });
      const data = await res.json();
      if (data.user) {
        mainStorage.setObject('auth_user', data.user);
        const wasPremium = get().isPremium;
        const isPremium = !!data.user.premium;
        set({ user: data.user, isPremium });
        if (!wasPremium && isPremium) {
          set({ premiumJustActivated: true });
        }
      }
    } catch {}
  },

  setPremiumJustActivated: (v) => set({ premiumJustActivated: v }),
}));

export default useAuthStore;
