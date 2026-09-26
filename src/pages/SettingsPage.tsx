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
  LuGlobe as Globe,
  LuCrown as Crown,
  LuSparkles as Sparkles,
  LuDownload as Download,
  LuShieldCheck as Shield,
  LuZap as Zap,
  LuEyeOff as EyeOff,
} from "react-icons/lu";import { PlayerSettings } from "../components/settings/PlayerSettings";
import { SubtitleSettings } from "../components/settings/SubtitleSettings";
import { PreferencesSettings } from "../components/settings/PreferencesSettings";

import { checkAppUpdates } from "../lib/hooks/useAppUpdater";
import { redeemCoupon } from "../lib/services/entitlementService";
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

const BACKGROUND_THEMES: { value: "gray" | "oled" | "white"; label: string }[] = [
  { value: "gray", label: "Gray" },
  { value: "oled", label: "OLED" },
  { value: "white", label: "White" },
];

export const SettingsPage: React.FC = () => {
  const { primary, setPrimary, background, setBackground } = useThemeStore();
  const [appVersion, setAppVersion] = React.useState("Loading...");
  const [infoPageDynamicTheme, setInfoPageDynamicTheme] = React.useState(() =>
    settingsStorage.isInfoPageDynamicThemeEnabled(),
  );
  const [language, setLanguage] = React.useState(() =>
    settingsStorage.getString("preferred_language") || "en",
  );
  const [adultEnabled, setAdultEnabled] = React.useState(() =>
    settingsStorage.isAdultEnabled(),
  );
  const [couponCode, setCouponCode] = React.useState("");
  const [redeeming, setRedeeming] = React.useState(false);
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

  const handleAdultToggle = (enabled: boolean) => {
    setAdultEnabled(enabled);
    settingsStorage.setAdultEnabled(enabled);
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

        {/* Premium Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Crown size={20} /> Premium
          </h2>
          <div className="settings-card">
            {isPremium ? (
              <>
                <div className="settings-row">
                  <div className="settings-info">
                    <h3 className="label-lg" style={{ color: "#facc15" }}>
                      <Sparkles size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                      You are Premium
                    </h3>
                    <p className="body-md text-muted">
                      Enjoy all premium features
                    </p>
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="premium-benefits">
                  <div className="premium-benefit-item">
                    <Download size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Unlimited Downloads</h4>
                      <p>Download any content for offline viewing without limits</p>
                    </div>
                  </div>
                  <div className="premium-benefit-item">
                    <Zap size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Priority Streaming</h4>
                      <p>Faster stream resolution with priority server access</p>
                    </div>
                  </div>
                  <div className="premium-benefit-item">
                    <Shield size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Ad-Free Experience</h4>
                      <p>Enjoy content without any advertisements</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="settings-row">
                  <div className="settings-info">
                    <h3 className="label-lg">Free Plan</h3>
                    <p className="body-md text-muted">
                      Upgrade to unlock premium features
                    </p>
                  </div>
                  <FocusableButton
                    className="theme-toggle-btn active"
                    onClick={() => navigate("/premium")}
                    style={{ padding: "6px 12px" }}
                  >
                    <Crown size={14} style={{ marginRight: 6 }} />
                    Upgrade
                  </FocusableButton>
                </div>
                <div className="settings-divider" />
                <div className="premium-benefits premium-benefits-muted">
                  <div className="premium-benefit-item">
                    <Download size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Unlimited Downloads</h4>
                      <p>Download any content for offline viewing without limits</p>
                    </div>
                  </div>
                  <div className="premium-benefit-item">
                    <Zap size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Priority Streaming</h4>
                      <p>Faster stream resolution with priority server access</p>
                    </div>
                  </div>
                  <div className="premium-benefit-item">
                    <Shield size={18} className="premium-benefit-icon" />
                    <div>
                      <h4>Ad-Free Experience</h4>
                      <p>Enjoy content without any advertisements</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 18+ Content Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <EyeOff size={20} /> 18+ Content
          </h2>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Enable 18+ Content</h3>
                <p className="body-md text-muted">
                  Show 18+ providers and adult sections. Erotic content is
                  blurred until you click to reveal it. You must confirm you
                  are 18 or older.
                </p>
              </div>
              <FocusableButton
                className={`theme-toggle-btn ${adultEnabled ? "active" : ""}`}
                onClick={() => {
                  if (adultEnabled) {
                    handleAdultToggle(false);
                  } else {
                    const ok = window.confirm(
                      "You must be 18 or older to enable 18+ content. Enable it?",
                    );
                    if (ok) handleAdultToggle(true);
                  }
                }}
                style={{ padding: "6px 12px" }}
              >
                {adultEnabled ? "Enabled" : "Disabled"}
              </FocusableButton>
            </div>
          </div>
        </section>

        {/* Trial Coupon Group */}
        <section className="settings-group">
          <h2
            className="title-md flex items-center gap-2"
            style={{ marginBottom: "8px" }}
          >
            <Zap size={20} /> ট্রায়াল / কুপন কোড
          </h2>
          <div className="settings-card">
            <div className="settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <div className="settings-info">
                <h3 className="label-lg">Provider আনলক কুপন</h3>
                <p className="body-md text-muted">
                  অ্যাডমিন দেওয়া কোড দিলে নির্দিষ্ট provider কয়েকদিনের জন্য আনলক হবে (লগইন প্রয়োজন)।
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: CINEPIX-TRIAL7"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "inherit",
                    fontSize: 14,
                  }}
                />
                <FocusableButton
                  className="theme-toggle-btn"
                  disabled={redeeming || !couponCode.trim()}
                  onClick={async () => {
                    setRedeeming(true);
                    const result = await redeemCoupon(couponCode.trim());
                    setRedeeming(false);
                    if (result.ok) {
                      setCouponCode("");
                      window.alert(`কুপন সফল! ${(result.providers || []).join(", ")} — ${result.days} দিনের জন্য আনলক হয়েছে। অ্যাপ রিস্টার্ট করলে কাজ করবে।`);
                    } else {
                      window.alert(result.msg || "কুপন সঠিক নয়");
                    }
                  }}
                  style={{ padding: "8px 16px", opacity: redeeming || !couponCode.trim() ? 0.5 : 1 }}
                >
                  {redeeming ? "যাচাই হচ্ছে…" : "আনলক"}
                </FocusableButton>
              </div>
            </div>
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
            {/* Background Theme */}
            <div className="settings-row">
              <div className="settings-info">
                <h3 className="label-lg">Background Theme</h3>
                <p className="body-md text-muted">
                  OLED saves power on TV screens, White suits bright rooms
                </p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {BACKGROUND_THEMES.map((t) => (
                  <FocusableButton
                    key={t.value}
                    className={`theme-toggle-btn ${background === t.value ? "active" : ""}`}
                    onClick={() => setBackground(t.value)}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                    aria-label={`Set background theme to ${t.label}`}
                    aria-pressed={background === t.value}
                  >
                    {t.label}
                  </FocusableButton>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

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
          </div>
        </section>
      </div>
    </div>
  );
};
