import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { settingsStorage } from "../storage";
export type BackgroundTheme = "gray" | "oled" | "white";

export interface Theme {
  primary: string;
  isCustom: boolean;
  background: BackgroundTheme;
  setPrimary: (type: Theme["primary"]) => void;
  setCustom: (isCustom: boolean) => void;
  setBackground: (theme: BackgroundTheme) => void;
}

const useThemeStore = create<Theme>()(
  persist(
    (set) => ({
      primary: settingsStorage.getPrimaryColor(),
      isCustom: settingsStorage.isCustomTheme(),
      background: settingsStorage.getBackgroundTheme() as BackgroundTheme,

      setPrimary: (primary: Theme["primary"]) => {
        set({ primary });
        settingsStorage.setPrimaryColor(primary);
      },
      setCustom: (isCustom: Theme["isCustom"]) => {
        set({ isCustom });
        settingsStorage.setCustomTheme(isCustom);
      },
      setBackground: (background: BackgroundTheme) => {
        set({ background });
        settingsStorage.setBackgroundTheme(background);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useThemeStore;
