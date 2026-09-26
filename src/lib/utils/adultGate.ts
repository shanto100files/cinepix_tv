import {settingsStorage} from '../storage/SettingsStorage';
import {extensionStorage, ProviderExtension} from '../storage/extensionStorage';

/**
 * Title keywords that mark an item as 18+/erotic even when it comes from a
 * normal provider (e.g. an "Erotic Movies" row on a mainstream site).
 */
export const ADULT_TITLE_PATTERN =
  /\b(porn|xxx|sex|nude|naked|erotic|adult|18\+|uncensored|hentai|leaked\s*mms|desi\s*mms|scandal|stepmom|stepsis|creampie|blowjob|handjob|gangbang|threesome|milf|camgirl|onlyfans|playboy|penthouse|hot\s*web\s*series|webseries\s*18)\b/i;

export const isAdultTitle = (title: string): boolean =>
  ADULT_TITLE_PATTERN.test(title || '');

/** All installed providers, unfiltered. */
export const getAllInstalledProviders = (): ProviderExtension[] =>
  extensionStorage.getInstalledProviders() || [];

/**
 * Providers the user may see right now. 18+ providers are only included when
 * the user has enabled them in Settings (age gate).
 */
export const getGatedInstalledProviders = (): ProviderExtension[] => {
  const installed = getAllInstalledProviders();
  if (settingsStorage.isAdultEnabled()) {
    return installed;
  }
  return installed.filter(p => !p.is_adult);
};

export const isAdultProvider = (provider?: {
  is_adult?: boolean;
  value?: string;
} | null): boolean =>
  Boolean(provider?.is_adult) ||
  /18\+|adult|erotic/i.test(provider?.value || '');
