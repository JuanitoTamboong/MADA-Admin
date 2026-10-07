import { supabase } from './supabase-client';

export type SettingsTheme = 'Light' | 'Dark' | 'System';
export type SettingsLanguage = 'English' | 'Filipino';
export type SettingsDateFormat = 'MMM D, YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY';

export interface AppSettings {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  theme: SettingsTheme;
  language: SettingsLanguage;
  dateFormat: SettingsDateFormat;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySystem: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
}

type SettingsRow = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  theme: SettingsTheme;
  language: SettingsLanguage;
  date_format: SettingsDateFormat;
  notify_email: boolean;
  notify_push: boolean;
  notify_system: boolean;
  two_factor_enabled: boolean;
  session_timeout_minutes: number;
};

const rowToSettings = (row: SettingsRow): AppSettings => ({
  userId: row.user_id,
  fullName: row.full_name,
  email: row.email,
  role: row.role,
  theme: row.theme,
  language: row.language,
  dateFormat: row.date_format,
  notifyEmail: row.notify_email,
  notifyPush: row.notify_push,
  notifySystem: row.notify_system,
  twoFactorEnabled: row.two_factor_enabled,
  sessionTimeoutMinutes: row.session_timeout_minutes,
});

const toRowPayload = (s: AppSettings): SettingsRow => ({
  user_id: s.userId,
  full_name: s.fullName,
  email: s.email,
  role: s.role,
  theme: s.theme,
  language: s.language,
  date_format: s.dateFormat,
  notify_email: s.notifyEmail,
  notify_push: s.notifyPush,
  notify_system: s.notifySystem,
  two_factor_enabled: s.twoFactorEnabled,
  session_timeout_minutes: s.sessionTimeoutMinutes,
});

export async function fetchSettings(userId: string): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToSettings(data as SettingsRow) : null;
}

export async function upsertSettings(settings: AppSettings): Promise<AppSettings> {
  const row = toRowPayload(settings);
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToSettings(data as SettingsRow);
}