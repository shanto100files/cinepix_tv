import React from "react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../lib/zustand/themeStore";
import { themes } from "../lib/constants";
import {
  LuMonitor as Monitor,
  LuCheck as Check,
  LuPlay as Play,
  LuCaptions as Captions,
  LuSlidersHorizontal as Sliders,
  LuInfo as Info,
  LuUser as User,
  LuCrown as Crown,
  LuGlobe as Globe,
} from "react-icons/lu";
import { PlayerSettings } from "../components/settings/PlayerSettings";
import { SubtitleSettings } from "../components/settings/SubtitleSettings";
import { PreferencesSettings } from "../components/settings/PreferencesSettings";
import { GitHubStarButton } from "../components/settings/GitHubStarButton";
import { checkAppUpdates } from "../lib/hooks/useAppUpdater";
import { FocusableButton } from "../components/layout/FocusableButton";
import { Switch } from "../components/ui/switch";
import { settingsStorage } from "../lib/storage";
import useAuthStore from "../lib/zustand/authStore";

import "./SettingsPage.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা (Bangla)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية (Arabic)" },
];

export const SettingsPage: React.FC = () => {
  const { primary, setPrimary } = useThemeStore();
  const [appVersion, setAppVersion] = React.useState("Loading...");
  const [infoPageDynamicTheme, setInfoPageDynamicTheme] = React.useState(() =>
    settingsStorage.isInfoPageDynamicThemeEnabled(),
  );
  const [language, setLanguage] = React.useState(() =>
    settingsStorage.getString("preferred_language") || "en",
  );
  const user = useAuthStore((s) => s.user);
  const isPremium = useAuthStore((s) => s.isPremium);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  React.useEffect(() => {
    import("@tauri-apps/api/app")
      .then((app) => app.getVersion())
      .then((v) => setAppVersion(`Version ${v}`))
      .catch(() => setAppVersion("Version 1.0.0"));
  }, []);

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    settingsStorage.setString("preferred_language", code);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="headline-lg">Settings</h1>
      </div>

      <div className="settings-content">
        {/* Account Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <User size={20} /> Account
          </h2>
          <div className="settings-card">
            {user ? (
              <>
                <div className="settings-row">
                  <div className="settings-info">
                    <h3 className="label-lg">{user.username}</h3>
                    <p className="body-md text-muted">{user.email}</p>
                    <p className="body-md text-muted mt-1">
                      Status:{" "}
                      {isPremium ? (
                        <span className="text-green-400 font-semibold">Premium</span>
                      ) : (
                        <span>Free</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <FocusableButton
                      className="theme-toggle-btn active"
                      onClick={() => navigate("/profile")}
                      style={{ padding: "6px 12px" }}
                    >
                      Profile
                    </FocusableButton>
                    {!isPremium && (
                      <FocusableButton
                        className="theme-toggle-btn active"
                        onClick={() => navigate("/premium")}
                        style={{ padding: "6px 12px" }}
                      >
                        Upgrade
                      </FocusableButton>
                    )}
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-row">
                  <FocusableButton
                    className="theme-toggle-btn"
                    onClick={() => { logout(); navigate("/login"); }}
                    style={{ padding: "6px 12px", color: "#ef4444" }}
                  >
                    Sign Out
                  </FocusableButton>
                </div>
              </>
            ) : (
              <div className="settings-row">
                <div className="settings-info">
                  <h3 className="label-lg">Not signed in</h3>
                  <p className="body-md text-muted">Sign in to sync your watchlist and access premium features</p>
                </div>
                <FocusableButton
                  className="theme-toggle-btn active"
                  onClick={() => navigate("/login")}
                  style={{ padding: "6px 12px" }}
                >
                  Sign In
                </FocusableButton>
              </div>
            )}
          </div>
        </section>

        {/* Language Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Globe size={20} /> Language
          </h2>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Preferred Language</h3>
                <p className="body-md text-muted">
                  Choose your preferred content language
                </p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {LANGUAGES.map((lang) => (
                  <FocusableButton
                    key={lang.code}
                    className={`theme-toggle-btn ${language === lang.code ? "active" : ""}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                  >
                    {lang.label}
                  </FocusableButton>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Monitor size={20} /> Appearance
          </h2>
          <div className="settings-card">
            {/* Accent Color */}
            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Accent Color</h3>
                <p className="body-md text-muted">
                  Choose your preferred primary color
                </p>
              </div>
              <div className="accent-color-grid">
                {themes.map((t) => {
                  const isMatch =
                    primary?.toLowerCase() === t.color?.toLowerCase();
                  return (
                    <FocusableButton
                      key={t.name}
                      className={`accent-color-btn ${isMatch ? "active" : ""}`}
                      style={{ backgroundColor: t.color }}
                      onClick={() => setPrimary(t.color)}
                      title={t.name}
                      aria-label={`Set accent color to ${t.name}`}
                    >
                      {isMatch && (
                        <Check
                          size={16}
                          color={t.color === "#FFFFFF" ? "#000" : "#FFF"}
                        />
                      )}
                    </FocusableButton>
                  );
                })}
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Dynamic Info Page Theme</h3>
                <p className="body-md text-muted">
                  Derive the info page colors from the title artwork
                </p>
              </div>
              <Switch
                checked={infoPageDynamicTheme}
                onCheckedChange={(enabled) => {
                  setInfoPageDynamicTheme(enabled);
                  settingsStorage.setInfoPageDynamicThemeEnabled(enabled);
                }}
                aria-label="Use artwork colors on info pages"
              />
            </div>
          </div>
        </section>

        {/* Player Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Play size={20} /> Player
          </h2>
          <div className="settings-card">
            <PlayerSettings />
          </div>
        </section>

        {/* Subtitles Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Captions size={20} /> Subtitles
          </h2>
          <div className="settings-card">
            <SubtitleSettings />
          </div>
        </section>

        {/* Preferences Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Sliders size={20} /> Preferences
          </h2>
          <div className="settings-card">
            <PreferencesSettings />
          </div>
        </section>

        {/* About Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Info size={20} /> About
          </h2>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Cinepix Desktop</h3>
                <p className="body-md text-muted">{appVersion}</p>
                <FocusableButton
                  className="theme-toggle-btn active"
                  onClick={() => checkAppUpdates(true)}
                  style={{
                    width: "fit-content",
                    padding: "6px 12px",
                    marginTop: "8px",
                  }}
                >
                  Check for Updates
                </FocusableButton>
              </div>
            </div>
            <div className="settings-divider" />
            <div className="github-star-row">
              <GitHubStarButton />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
