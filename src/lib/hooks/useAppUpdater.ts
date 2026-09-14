import { useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { settingsStorage } from '../storage';
import axios from 'axios';

const API_BASE = 'https://cinepix.top/api/app';
const DOWNLOAD_PAGE = 'https://cinepix.top/app';

const isNewer = (latest: string, current: string) => {
  if (!latest || !current) return false;
  const l = latest.replace(/[^0-9.]/g, '').split('.').map(Number);
  const c = current.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const lPart = l[i] || 0;
    const cPart = c[i] || 0;
    if (lPart > cPart) return true;
    if (lPart < cPart) return false;
  }
  return false;
};

async function openDownload(url: string) {
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank');
  }
}

export const checkAppUpdates = async (manual = false) => {
  try {
    if (import.meta.env.VITE_IS_MS_STORE === 'true') {
      if (manual) {
        message('Updates are managed automatically by the Microsoft Store.', { title: 'Microsoft Store', kind: 'info' });
      }
      return;
    }

    const isAndroid = navigator.userAgent.toLowerCase().includes('android');

    let currentVersion = '';
    try {
      currentVersion = await getVersion();
    } catch {
      currentVersion = localStorage.getItem('app_version') || '';
    }

    const { data } = await axios.get(`${API_BASE}/versioncheck`, { timeout: 15000 });
    const latest: string = data.desktop_latest_version || '';
    const changelog: string = data.desktop_changelog || '';
    const link: string = isAndroid
      ? data.desktop_download_tv || DOWNLOAD_PAGE
      : data.desktop_download_win || data.desktop_download_linux || DOWNLOAD_PAGE;

    if (latest && isNewer(latest, currentVersion)) {
      const wantToUpdate = await ask(
        `Version ${latest} is available!${changelog ? `\n\nWhat's new:\n${changelog}` : ''}\n\nWould you like to download it now?`,
        { title: 'Cinepix Update', kind: 'info' }
      );
      if (wantToUpdate) {
        await openDownload(link);
      }
    } else if (manual) {
      message(
        currentVersion
          ? `You are already on the latest version (${currentVersion}).`
          : 'You are already on the latest version.',
        { title: 'Up to Date', kind: 'info' }
      );
    }
  } catch (err: any) {
    console.error('Failed to check for app updates:', err);
    if (manual) {
      message('Failed to check for updates. Please check your internet connection.', { title: 'Error', kind: 'error' });
    }
  }
};

export const useAppUpdater = () => {
  useEffect(() => {
    // @ts-ignore - Tauri injects this globally
    if (!window.__TAURI_INTERNALS__) return;

    if (!settingsStorage.isAutoCheckUpdateEnabled()) return;

    // Run after a short delay so we don't slow down initial render
    const timer = setTimeout(() => {
      checkAppUpdates(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
};
