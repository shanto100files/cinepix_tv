import { documentDir, join } from "@tauri-apps/api/path";
import { settingsStorage } from "./storage/SettingsStorage";

// Sentinel value stored in settings meaning "use the built-in default folder".
export const DEFAULT_DOWNLOAD_LOCATION = "cinepix";

// Resolves the effective base directory for downloads and cross-device sync.
// A user-chosen folder always wins; for the built-in default we keep using the
// legacy "VegaDownloads" folder when it already exists so existing download
// libraries and sync manifests keep working after the Cinepix rename.
export const resolveDownloadBaseDir = async (): Promise<string> => {
  const configured = settingsStorage.getDownloadLocation();
  if (configured !== DEFAULT_DOWNLOAD_LOCATION) {
    return configured;
  }
  const docs = await documentDir();
  const defaultDir = await join(docs, "CinepixDownloads");
  const legacyDir = await join(docs, "VegaDownloads");
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");
    return (await exists(legacyDir)) ? legacyDir : defaultDir;
  } catch {
    return defaultDir;
  }
};
