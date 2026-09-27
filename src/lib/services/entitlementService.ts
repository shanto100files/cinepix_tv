import axios from 'axios';
import { HARDCODED_KILL_KEY } from '../services/initService';
import useAuthStore from '../zustand/authStore';
import { settingsStorage } from '../storage/SettingsStorage';

const API_BASE = 'https://cinepix.top/api/app';

/** Keep ExtensionManager's runtime guard in sync with the server allow-list. */
async function setEntitlementCache(allowed: string[] | null): Promise<void> {
  try {
    const { extensionManager } = await import('./ExtensionManager');
    extensionManager.entitlementCache = allowed;
  } catch {}
}

export interface ProviderUnlock {
  value: string;
  coupon_expires_at?: string | null;
  coupon_days?: number | null;
}

export interface MyProvidersResponse {
  providers: ProviderUnlock[];
  premium?: boolean;
  all?: boolean;
}

/**
 * Account/provider entitlement sync for desktop & TV.
 *
 * - fetchMyProviders(): returns the provider values this account may use
 *   (admin grants + coupon unlocks with their expiry metadata).
 * - fetchTvAdultFlag(): Android TV builds read the account-level
 *   tv_adult_enabled flag; when the phone turned 18+ off for this account,
 *   the TV's local toggle is overridden to off.
 * - redeemCoupon(): redeems a trial coupon code for the logged-in account.
 */
export async function fetchMyProviders(): Promise<{
  allowed: string[] | null;
  unlocks: Record<string, { until: number; days: number }>;
}> {
  const auth = useAuthStore.getState();
  if (!auth.token) return { allowed: null, unlocks: {} };
  // Admins see everything, including `selected` providers.
  if (auth.user?.is_admin) return { allowed: null, unlocks: {} };
  try {
    const res = await axios.get<MyProvidersResponse>(`${API_BASE}/myproviders`, {
      headers: { Authorization: `Bearer ${auth.token}`, 'X-App-Key': HARDCODED_KILL_KEY },
      timeout: 10000,
    });
    if (res.data.all) {
      await setEntitlementCache(null);
      return { allowed: null, unlocks: {} };
    }
    const unlocks: Record<string, { until: number; days: number }> = {};
    const allowed: string[] = [];
    for (const p of res.data.providers || []) {
      allowed.push(p.value);
      if (p.coupon_expires_at) {
        const until = new Date(p.coupon_expires_at).getTime();
        if (until > Date.now()) {
          unlocks[p.value] = { until, days: p.coupon_days || 0 };
        }
      }
    }
    await setEntitlementCache(allowed);
    return { allowed, unlocks };
  } catch {
    return { allowed: null, unlocks: {} };
  }
}

export async function fetchTvAdultFlag(): Promise<boolean | null> {
  const isTv = navigator.userAgent.toLowerCase().includes('android');
  if (!isTv) return null;
  const token = useAuthStore.getState().token;
  if (!token) return null;
  try {
    const res = await axios.post(
      `${API_BASE}/check`,
      { key: HARDCODED_KILL_KEY, version: '5.7.3', device_type: 'tv' },
      { headers: { Authorization: `Bearer ${token}`, 'X-App-Key': HARDCODED_KILL_KEY }, timeout: 10000 },
    );
    if (typeof res.data?.tv_adult_enabled === 'boolean') {
      return res.data.tv_adult_enabled;
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncAccountEntitlements(): Promise<void> {
  // TV parental: account flag overrides the local toggle while it says off.
  const tvFlag = await fetchTvAdultFlag();
  if (tvFlag === false) {
    settingsStorage.setAdultEnabled(false);
  }

  // Refresh the provider allow-list in the content store (best-effort).
  try {
    const { allowed } = await fetchMyProviders();
    if (allowed && allowed.length > 0) {
      const mod = await import('../zustand/contentStore');
      const store = mod.default;
      const installed = store.getState().installedProviders || [];
      const gated = installed.filter((p: any) => allowed.includes(p.value));
      if (gated.length > 0) {
        store.setState({ installedProviders: gated });
      }
    }
  } catch {
    // best-effort
  }

  // Mirror mobile: logged-out devices must not keep admin-grant (`selected`)
  // providers installed — uninstall them so the UI never shows stale entries.
  try {
    const auth = useAuthStore.getState();
    if (!auth.token || auth.user?.is_admin) return;
    const { allowed } = await fetchMyProviders();
    if (!allowed) return;
    const { extensionManager } = await import('./ExtensionManager');
    const { extensionStorage } = await import('../storage/extensionStorage');
    for (const p of extensionStorage.getInstalledProviders()) {
      const available = extensionStorage
        .getAvailableProviders(p.source?.author || '')
        .find((a: any) => a.value === p.value);
      const isSelected = available
        ? available.access_mode === 'selected'
        : false;
      if (isSelected && !allowed.includes(p.value)) {
        try {
          extensionManager.uninstallProvider(p.value, p.source?.author);
          console.log(`Removed not-entitled selected provider: ${p.value}`);
        } catch {}
      }
    }
  } catch {
    // best-effort
  }
}

export async function redeemCoupon(
  code: string,
): Promise<{ ok: boolean; msg?: string; providers?: string[]; days?: number }> {
  const token = useAuthStore.getState().token;
  if (!token) return { ok: false, msg: 'কুপন ব্যবহার করতে লগইন করুন' };
  try {
    const res = await axios.post(
      `${API_BASE}/redeem-coupon`,
      { code },
      { headers: { Authorization: `Bearer ${token}`, 'X-App-Key': HARDCODED_KILL_KEY }, timeout: 10000 },
    );
    return res.data;
  } catch (e: any) {
    return { ok: false, msg: e?.response?.data?.msg || 'কুপন যাচাই ব্যর্থ হয়েছে' };
  }
}
