import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  Check,
  Globe2,
  Mail,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react';
import '../css/Settings.css';

interface AdminSettings {
  name: string;
  email: string;
  office: string;
  language: string;
  emailNotifications: boolean;
  announcementNotifications: boolean;
  reportNotifications: boolean;
}

const storageKey = 'mada-admin-settings';
const defaultSettings: AdminSettings = {
  name: 'Admin',
  email: 'admin@mada.gov.ph',
  office: 'Municipal Agriculture Office',
  language: 'English',
  emailNotifications: true,
  announcementNotifications: true,
  reportNotifications: false,
};

const readSettings = (value: string | null): AdminSettings => {
  if (!value) return defaultSettings;

  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object') return defaultSettings;

  const stored = parsed as Partial<AdminSettings>;
  return {
    name: typeof stored.name === 'string' ? stored.name : defaultSettings.name,
    email: typeof stored.email === 'string' ? stored.email : defaultSettings.email,
    office: typeof stored.office === 'string' ? stored.office : defaultSettings.office,
    language: typeof stored.language === 'string' ? stored.language : defaultSettings.language,
    emailNotifications: typeof stored.emailNotifications === 'boolean'
      ? stored.emailNotifications
      : defaultSettings.emailNotifications,
    announcementNotifications: typeof stored.announcementNotifications === 'boolean'
      ? stored.announcementNotifications
      : defaultSettings.announcementNotifications,
    reportNotifications: typeof stored.reportNotifications === 'boolean'
      ? stored.reportNotifications
      : defaultSettings.reportNotifications,
  };
};

const SettingsPage = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    try {
      setSettings(readSettings(window.localStorage.getItem(storageKey)));
    } catch {
      setMessage('Saved settings could not be loaded from this browser.');
      setIsError(true);
    }
  }, []);

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
      setMessage('Your settings have been saved on this device.');
      setIsError(false);
    } catch {
      setMessage('Settings could not be saved. Check your browser storage permissions and try again.');
      setIsError(true);
    }
  };

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <p className="settings-eyebrow">MANAGE YOUR WORKSPACE</p>
          <h1>Settings</h1>
          <p>Update your account details and the preferences for your MADA admin workspace.</p>
        </div>
        <span className="settings-heading-icon"><SettingsIcon size={23} /></span>
      </header>

      <form className="settings-form" onSubmit={saveSettings}>
        <section aria-labelledby="settings-profile-title" className="settings-card">
          <header className="settings-card-heading">
            <span className="settings-card-icon"><UserRound size={18} /></span>
            <div>
              <h2 id="settings-profile-title">Admin profile</h2>
              <p>These details identify you in the administration workspace.</p>
            </div>
          </header>

          <div className="settings-fields">
            <label className="settings-field">
              <span>Display name</span>
              <input
                autoComplete="name"
                onChange={(event) => updateSetting('name', event.target.value)}
                required
                value={settings.name}
              />
            </label>
            <label className="settings-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                onChange={(event) => updateSetting('email', event.target.value)}
                required
                type="email"
                value={settings.email}
              />
            </label>
            <label className="settings-field settings-field--wide">
              <span>Office / organization</span>
              <input
                onChange={(event) => updateSetting('office', event.target.value)}
                required
                value={settings.office}
              />
            </label>
          </div>
        </section>

        <section aria-labelledby="settings-preferences-title" className="settings-card">
          <header className="settings-card-heading">
            <span className="settings-card-icon"><Globe2 size={18} /></span>
            <div>
              <h2 id="settings-preferences-title">Workspace preferences</h2>
              <p>Choose the language used for your workspace.</p>
            </div>
          </header>
          <label className="settings-field settings-language-field">
            <span>Language</span>
            <select
              onChange={(event) => updateSetting('language', event.target.value)}
              value={settings.language}
            >
              <option>English</option>
              <option>Filipino</option>
            </select>
          </label>
        </section>

        <section aria-labelledby="settings-notifications-title" className="settings-card">
          <header className="settings-card-heading">
            <span className="settings-card-icon"><Bell size={18} /></span>
            <div>
              <h2 id="settings-notifications-title">Notifications</h2>
              <p>Choose which updates you want to receive.</p>
            </div>
          </header>
          <div className="settings-options">
            <label className="settings-option">
              <span className="settings-option-icon"><Mail size={17} /></span>
              <span className="settings-option-copy">
                <strong>Email updates</strong>
                <small>Receive important workspace updates by email.</small>
              </span>
              <input
                checked={settings.emailNotifications}
                onChange={(event) => updateSetting('emailNotifications', event.target.checked)}
                type="checkbox"
              />
            </label>
            <label className="settings-option">
              <span className="settings-option-copy">
                <strong>Announcements</strong>
                <small>Get notified when new announcements are published.</small>
              </span>
              <input
                checked={settings.announcementNotifications}
                onChange={(event) => updateSetting('announcementNotifications', event.target.checked)}
                type="checkbox"
              />
            </label>
            <label className="settings-option">
              <span className="settings-option-copy">
                <strong>Report activity</strong>
                <small>Get notified when reports are ready for review.</small>
              </span>
              <input
                checked={settings.reportNotifications}
                onChange={(event) => updateSetting('reportNotifications', event.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
        </section>

        <footer className="settings-form-footer">
          <p aria-live="polite" className={isError ? 'settings-message settings-message--error' : 'settings-message'}>
            {message}
          </p>
          <button className="settings-save-button" type="submit">
            <Check size={17} /> Save settings
          </button>
        </footer>
        <p className="settings-storage-note">Settings are stored in this browser on this device.</p>
      </form>
    </main>
  );
};

export default SettingsPage;
