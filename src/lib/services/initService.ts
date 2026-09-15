import axios from 'axios';

const API_BASE = 'https://cinepix.top/api/app';
export const HARDCODED_KILL_KEY = '78a0e573dfd894d443685159b2e71e2f';

export interface InitProgress {
  progress: number;
  status: string;
}

function getDeviceId(): string {
  let id = localStorage.getItem('@device_id');
  if (!id) {
    id = `desktop_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem('@device_id', id);
  }
  return id;
}

function compareVersions(local: string, min: string): boolean {
  if (!local || !min) return false;
  const l = local.split('.').map(v => parseInt(v, 10) || 0);
  const m = min.split('.').map(v => parseInt(v, 10) || 0);
  for (let i = 0; i < Math.max(l.length, m.length); i++) {
    const lNum = l[i] || 0;
    const mNum = m[i] || 0;
    if (lNum < mNum) return true;
    if (lNum > mNum) return false;
  }
  return false;
}

export async function checkForceUpdateOnly(): Promise<boolean> {
  try {
    const vRes = await axios.get(`${API_BASE}/versioncheck`, {
      timeout: 15000,
      headers: { 'X-App-Key': HARDCODED_KILL_KEY },
    });
    const min_version = vRes.data.desktop_min_version || vRes.data.min_version;
    const force_update = vRes.data.desktop_force_update ?? vRes.data.force_update;
    if (force_update === true || force_update === 1) {
      const currentVersion = localStorage.getItem('app_version') || '5.5.9';
      return compareVersions(currentVersion, min_version);
    }
    return false;
  } catch {
    return false;
  }
}

async function checkKillSwitch(): Promise<{ blocked: boolean; shutdown?: boolean; reason?: string }> {
  try {
    const version = localStorage.getItem('app_version') || '5.5.9';
    const deviceId = getDeviceId();
    const res = await fetch(`${API_BASE}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Key': HARDCODED_KILL_KEY },
      body: JSON.stringify({ key: HARDCODED_KILL_KEY, version, device_id: deviceId }),
    });
    if (!res.ok) return { blocked: true, reason: 'Access Denied' };
    const data = await res.json();
    return { blocked: data.blocked === true, shutdown: data.shutdown === true, reason: data.reason || 'App under maintenance' };
  } catch {
    return { blocked: false, shutdown: false };
  }
}

export async function initializeApp(onProgress: (p: InitProgress) => void): Promise<{ forceUpdate?: boolean; blocked?: boolean; reason?: string }> {
  try {
    onProgress({ progress: 10, status: 'Verifying session...' });

    const check = await checkKillSwitch();
    if (check.shutdown || check.blocked) {
      return { blocked: true, reason: check.reason };
    }

    onProgress({ progress: 40, status: 'Checking for updates...' });
    const forceUpdateNeeded = await checkForceUpdateOnly();
    if (forceUpdateNeeded) {
      return { forceUpdate: true };
    }

    onProgress({ progress: 70, status: 'Loading providers...' });
    try {
      const { extensionManager } = await import('./ExtensionManager');
      await Promise.race([
        extensionManager.fetchManifest(undefined, true),
        new Promise((_, rej) => setTimeout(() => rej(new Error('manifest timeout')), 20000)),
      ]);
    } catch (e: any) {
      console.warn('Manifest fetch:', e?.message || e);
    }

    try {
      const { extensionManager } = await import('./ExtensionManager');
      await Promise.race([
        extensionManager.initialize(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('init timeout')), 20000)),
      ]);
    } catch (e: any) {
      console.warn('Extension init:', e?.message || e);
    }

    onProgress({ progress: 100, status: 'Ready!' });
    return { forceUpdate: false };
  } catch {
    return { forceUpdate: false };
  }
}
