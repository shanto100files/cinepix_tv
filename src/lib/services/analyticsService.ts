import useAuthStore from '../zustand/authStore';
import { mainStorage } from '../storage';

const API_BASE = 'https://cinepix.top/api/app';
const HARDCODED_KEY = '78a0e573dfd894d443685159b2e71e2f';
const BATCH_KEY = '@analytics_batch';
const BATCH_INTERVAL = 60 * 1000;
const MAX_BATCH_SIZE = 50;

let sessionId = '';
let lastSendTime = 0;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `desktop_sess_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
  }
  return sessionId;
}

function getPendingBatch(): any[] {
  try {
    const raw = mainStorage.getString(BATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePendingBatch(events: any[]) {
  mainStorage.setString(BATCH_KEY, JSON.stringify(events));
}

export function trackEvent(eventType: string, data: Record<string, any> = {}) {
  const auth = useAuthStore.getState();
  const event = {
    event_type: eventType,
    username: auth.user?.username ?? '',
    page: data.page ?? '',
    screen: data.screen ?? '',
    provider: data.provider ?? '',
    content_title: data.content_title ?? '',
    content_link: data.content_link ?? '',
    device_model: navigator.platform,
    device_brand: 'Desktop',
    os_version: navigator.userAgent,
    app_version: '2.0.5',
    session_id: getSessionId(),
    duration_seconds: data.duration_seconds ?? 0,
    timestamp: Date.now(),
  };

  const batch = getPendingBatch();
  batch.push(event);

  if (batch.length >= MAX_BATCH_SIZE) {
    flushBatch();
  } else {
    savePendingBatch(batch);
  }

  if (Date.now() - lastSendTime > BATCH_INTERVAL) {
    flushBatch();
  }
}

export function trackScreen(screen: string, provider?: string) {
  trackEvent('screen_view', { screen, provider: provider ?? '' });
}

export function trackContent(title: string, link: string, provider: string) {
  trackEvent('content_view', { content_title: title, content_link: link, provider });
}

export async function flushBatch() {
  const batch = getPendingBatch();
  if (batch.length === 0) return;

  lastSendTime = Date.now();
  savePendingBatch([]);

  try {
    const auth = useAuthStore.getState();
    await fetch(`${API_BASE}/analytics-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': '2.0.5',
        'X-App-Key': HARDCODED_KEY,
      },
      body: JSON.stringify({
        events: batch,
        session_id: getSessionId(),
        username: auth.user?.username ?? '',
        device_model: navigator.platform,
        device_brand: 'Desktop',
        os_version: navigator.userAgent,
        app_version: '2.0.5',
      }),
    });
  } catch {
    savePendingBatch([...batch, ...getPendingBatch()]);
  }
}

export function initAnalytics() {
  trackEvent('app_open');
}

export function pauseAnalytics() {
  trackEvent('app_pause');
  flushBatch();
}

export function resumeAnalytics() {
  trackEvent('app_resume');
}
