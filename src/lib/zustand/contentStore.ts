import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
// import {ProvidersList, providersList} from '../constants';
import {extensionStorage, ProviderExtension} from '../storage/extensionStorage';

export interface Content {
  provider: ProviderExtension;
  setProvider: (type: ProviderExtension) => void;
  // Extension-based provider management
  installedProviders: ProviderExtension[];
  availableProviders: ProviderExtension[];
  setInstalledProviders: (providers: ProviderExtension[]) => void;
  setAvailableProviders: (providers: ProviderExtension[]) => void;
  activeExtensionProvider: ProviderExtension | null;
  setActiveExtensionProvider: (provider: ProviderExtension | null) => void;
  homeProviderValue: string;
  setHomeProviderValue: (value: string) => void;
}

const useContentStore = create<Content>()(
  persist(
    (set, _get) => ({
      provider: {
        value: '',
        display_name: '',
        type: 'global',
        installed: false,
        disabled: false,
        version: '0.0.1',
        icon: '',
        installedAt: 0,
        lastUpdated: 0,
        source: { author: '', url: '' }
      },
      installedProviders: extensionStorage
        .getInstalledProviders()
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
      availableProviders: [],
      activeExtensionProvider: null,
      homeProviderValue: localStorage.getItem('homeProviderValue') || '',

      setProvider: (provider: ProviderExtension) => set({provider}),

      setInstalledProviders: (providers: ProviderExtension[]) =>
        set({
          installedProviders: providers.sort((a, b) =>
            a.display_name.localeCompare(b.display_name),
          ),
        }),

      setAvailableProviders: (providers: ProviderExtension[]) =>
        set({availableProviders: providers}),

      setActiveExtensionProvider: (provider: ProviderExtension | null) =>
        set({activeExtensionProvider: provider}),

      setHomeProviderValue: (value: string) => {
        localStorage.setItem('homeProviderValue', value);
        set({homeProviderValue: value});
      },
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => localStorage), // Only persist certain fields
      partialize: state => ({
        provider: state.provider,
        activeExtensionProvider: state.activeExtensionProvider,
        homeProviderValue: state.homeProviderValue,
      }),
    },
  ),
);

export default useContentStore;
