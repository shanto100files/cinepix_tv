import useAuthStore from '../zustand/authStore';
import { mainStorage } from '../storage';

const API_BASE = 'https://cinepix.top/api/app';
const HARDCODED_KEY = '78a0e573dfd894d443685159b2e71e2f';
const LAST_HEARTBEAT_KEY = '@last_heartbeat';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000;

function getDeviceId(): string {
  let id = mainStorage.getString('@device_id');
  if (!id) {
    id = `desktop_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
    mainStorage.setString('@device_id', id);
  }
  return id;
}

export async function sendHeartbeat() {
  const lastHB = mainStorage.getNumber(LAST_HEARTBEAT_KEY) || 0;
  if (Date.now() - lastHB < HEARTBEAT_INTERVAL) return;

  try {
    const token = useAuthStore.getState().token;
    const deviceId = getDeviceId();

    await fetch(`${API_BASE}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': '5.5.9',
        'X-App-Key': HARDCODED_KEY,
        'X-Device-Info': `desktop/${navigator.platform}`,
        'X-Device-Id': deviceId,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
    });
    mainStorage.setNumber(LAST_HEARTBEAT_KEY, Date.now());

    if (token) {
      await useAuthStore.getState().refreshProfile();
    }
  } catch {}
}
