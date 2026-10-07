import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Globe,
  Lock,
  LogOut,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import '../css/Settings.css';
import { fetchSettings, upsertSettings } from '../supabase/settings.ts';
import type {
  AppSettings,
  SettingsDateFormat,
  SettingsLanguage,
  SettingsTheme,
} from '../supabase/settings.ts';

// ⚠️ Replace with the real signed-in user id once auth is wired up.
// For now this is a placeholder that the settings table can accept as a UUID.
const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001';

const defaultSettings = (): AppSettings => ({
  userId: CURRENT_USER_ID,
  fullName: 'Administrator',
  email: 'admin@mada.local',
  role: 'Administrator',
  theme: 'Light',
  language: 'English',
  dateFormat: 'MMM D, YYYY',
  notifyEmail: true,
  notifyPush: false,
  notifySystem: true,
  twoFactorEnabled: false,
  sessionTimeoutMinutes: 30,
});

const themes: SettingsTheme[] = ['Light', 'Dark', 'System'];
const languages: SettingsLanguage[] = ['English', 'Filipino'];
const dateFormats: SettingsDateFormat[] = [
  'MMM D, YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
];

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Load once
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchSettings(CURRENT_USER_ID)
      .then((data) => {
        if (!alive) return;
        if (data) setSettings(data);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Reset "saved" badge after 2.5s
  useEffect(() => {
    if (savedAt == null) return;
    const t = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [savedAt]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await upsertSettings(settings);
      setSettings(saved);
      setSavedAt(Date.now());
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const initials =
    settings.fullName
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">ACCOUNT &amp; PREFERENCES</p>
          <h1>Settings</h1>
          <p>
            Manage your profile, preferences, notifications, and security
            options for the MADA admin console.
          </p>
        </div>
        <div className="settings-header-actions">
          {savedAt ? (
            <span className="settings-saved">
              <Check size={14} /> Saved
            </span>
          ) : null}
          <button
            className="settings-save-button"
            onClick={handleSave}
            type="button"
            disabled={saving || loading}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="settings-empty">Loading settings…</div>
      ) : (
        <div className="settings-grid">
          {/* ---------- PROFILE ---------- */}
          <section className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">
                <User size={16} />
              </span>
              <div>
                <h2>Profile</h2>
                <p>Your account details and how your name appears in the console.</p>
              </div>
            </div>

            <div className="settings-avatar-row">
              <div className="settings-avatar">{initials}</div>
              <div>
                <p className="settings-avatar-name">{settings.fullName}</p>
                <p className="settings-avatar-role">{settings.role}</p>
              </div>
            </div>

            <div className="settings-fields">
              <label>
                <span>Full name</span>
                <input
                  type="text"
                  value={settings.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Administrator"
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="admin@mada.local"
                />
              </label>
              <label>
                <span>Role</span>
                <input type="text" value={settings.role} readOnly disabled />
              </label>
            </div>
          </section>

          {/* ---------- PREFERENCES ---------- */}
          <section className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">
                <Palette size={16} />
              </span>
              <div>
                <h2>Preferences</h2>
                <p>Control how the admin console looks and formats information.</p>
              </div>
            </div>

            <div className="settings-fields">
              <div className="settings-field-group">
                <span className="settings-field-label">Theme</span>
                <div className="settings-toggle-row">
                  {themes.map((theme) => {
                    const Icon =
                      theme === 'Light' ? Sun : theme === 'Dark' ? Moon : Globe;
                    return (
                      <button
                        key={theme}
                        type="button"
                        className={`settings-theme-button${
                          settings.theme === theme ? ' is-active' : ''
                        }`}
                        onClick={() => update('theme', theme)}
                      >
                        <Icon size={14} />
                        {theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label>
                <span>Language</span>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    update('language', e.target.value as SettingsLanguage)
                  }
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date format</span>
                <select
                  value={settings.dateFormat}
                  onChange={(e) =>
                    update('dateFormat', e.target.value as SettingsDateFormat)
                  }
                >
                  {dateFormats.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Session timeout (minutes)</span>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    update(
                      'sessionTimeoutMinutes',
                      Math.max(5, Math.min(240, Number(e.target.value) || 30)),
                    )
                  }
                />
              </label>
            </div>
          </section>

          {/* ---------- NOTIFICATIONS ---------- */}
          <section className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">
                <Bell size={16} />
              </span>
              <div>
                <h2>Notifications</h2>
                <p>Choose which alerts you want to receive as an administrator.</p>
              </div>
            </div>

            <div className="settings-toggles">
              <ToggleRow
                label="Email notifications"
                hint="Receive a daily digest and important alerts by email."
                value={settings.notifyEmail}
                onChange={(v) => update('notifyEmail', v)}
              />
              <ToggleRow
                label="Push notifications"
                hint="Get real-time browser push alerts for new reports."
                value={settings.notifyPush}
                onChange={(v) => update('notifyPush', v)}
              />
              <ToggleRow
                label="System notifications"
                hint="Show in-app banners for system status changes."
                value={settings.notifySystem}
                onChange={(v) => update('notifySystem', v)}
              />
            </div>
          </section>

          {/* ---------- SECURITY ---------- */}
          <section className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">
                <Shield size={16} />
              </span>
              <div>
                <h2>Security</h2>
                <p>Protect your admin account and control active sessions.</p>
              </div>
            </div>

            <div className="settings-toggles">
              <ToggleRow
                label="Two-factor authentication"
                hint="Require a verification code at sign-in."
                value={settings.twoFactorEnabled}
                onChange={(v) => update('twoFactorEnabled', v)}
              />
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-action-button"
                onClick={() =>
                  alert('Change password flow — wire this to auth.updateUser.')
                }
              >
                <Lock size={14} /> Change password
              </button>
              <button
                type="button"
                className="settings-action-button"
                onClick={() =>
                  alert('Sign out of all devices — wire this to auth.signOut.')
                }
              >
                <LogOut size={14} /> Sign out of all devices
              </button>
            </div>
          </section>

          {/* ---------- DANGER ZONE ---------- */}
          <section className="settings-card settings-card--danger">
            <div className="settings-card-header">
              <span className="settings-card-icon settings-card-icon--danger">
                <Trash2 size={16} />
              </span>
              <div>
                <h2>Danger zone</h2>
                <p>Irreversible actions — use with caution.</p>
              </div>
            </div>

            <div className="settings-danger-row">
              <div>
                <p className="settings-danger-title">Delete account</p>
                <p className="settings-danger-hint">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <button
                type="button"
                className="settings-danger-button"
                onClick={() =>
                  alert('Delete account — confirm and call a server endpoint.')
                }
              >
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

/* ---------- Small toggle row component ---------- */
interface ToggleRowProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ label, hint, value, onChange }: ToggleRowProps) => (
  <div className="settings-toggle">
    <div>
      <p className="settings-toggle-label">{label}</p>
      <p className="settings-toggle-hint">{hint}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={`settings-switch${value ? ' is-on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="settings-switch-knob" />
    </button>
  </div>
);

export default Settings;