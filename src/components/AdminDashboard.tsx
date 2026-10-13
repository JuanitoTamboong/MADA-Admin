import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  FileText,
  Sprout,
  CloudSun,
  BarChart3,
  Megaphone,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldAlert,
  UserRound,
  MapPin,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import '../css/AdminDashboard.css';
import { supabase } from '../supabase/supabase-client';
import SettingsPage from './Settings';
import AdminFarmers from './AdminFarmers';
import AdminReports from './AdminReports';
import AdminRequest from './AdminRequest';
import CropProduction from './CropProduction';
import WeatherAlerts from './WeatherAlerts';
import AdminMap from './AdminMap';
import AdminAnalytics from './AdminAnalytics';
import AdminAnnouncements from './AdminAnnouncements';
import FarmerMessage from '../conversation/FarmerMessage';
import SideNav from '../navigation/SideNav';
import PageLayout from '../shared/PageLayout';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface FarmerProfile {
  id: string;
  full_name: string;
  address: string | null;
  role: string;
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
  avatar_path: string | null;
  status: 'active' | 'inactive' | null;
  created_at: string;
  farmCount?: number;
  totalHectares?: number;
}

interface ReportRow {
  id: string;
  note: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  image_path: string | null;
  farmer_id: string;
  farmerName?: string;
  location?: string | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  created_at: string;
  image_url: string | null;
}

interface WeatherState {
  tempC: number;
  highC: number;
  lowC: number;
  description: string;
}

interface DayPoint {
  label: string;
  value: number;
}

interface CropBucket {
  crop: string;
  count: number;
  pct: number;
}

// ---------- helpers ----------

function describeWeather(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

function guessGeoQuery(address: string): string {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  const candidate = parts[parts.length - 1] ?? address;
  return candidate.replace(/^(barangay|brgy\.?|brgy|purok|sitio)\s+/i, '').trim();
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const CROP_COLORS = [
  '#16834d',
  '#f4ad35',
  '#368bd6',
  '#8b75dc',
  '#e45c57',
  '#64748b',
  '#0ea5b7',
  '#ec4899',
];

function cropColorFor(index: number): string {
  return CROP_COLORS[index % CROP_COLORS.length];
}

function buildLast7Days(timestamps: string[]): DayPoint[] {
  const days: DayPoint[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: 0,
    });
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 6);

  for (const iso of timestamps) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    if (d < start) continue;
    const idx = Math.round((d.getTime() - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < 7) days[idx].value += 1;
  }
  return days;
}

async function signUrls(
  bucket: 'profile-avatars' | 'pest-reports',
  paths: string[],
): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

// ---------- sub-components ----------

function FarmRegistrationsChart({ data }: { data: DayPoint[] }) {
  const W = 420;
  const H = 150;
  const padX = 34;
  const padY = 18;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = max <= 5 ? 1 : max <= 25 ? 5 : max <= 100 ? 25 : 50;
  const yMax = Math.max(Math.ceil(max / step) * step, step);
  const ticks = [0, yMax / 3, (2 * yMax) / 3, yMax];

  const x = (i: number) =>
    padX + (i * (W - 2 * padX)) / Math.max(data.length - 1, 1);
  const y = (v: number) => H - padY - (v / yMax) * (H - 2 * padY);

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath =
    `M ${points[0].x} ${H - padY} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${H - padY} Z`;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} className="line-chart-svg">
        <defs>
          <linearGradient id="chartAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16834d" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#16834d" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="chart-grid">
          {ticks.map((t, i) => {
            const yy = y(t);
            return (
              <g key={i}>
                <path d={`M ${padX} ${yy} H ${W - padX}`} />
                <text x={padX - 6} y={yy + 3} textAnchor="end">
                  {Math.round(t)}
                </text>
              </g>
            );
          })}
        </g>

        <path d={areaPath} fill="url(#chartAreaFill)" />
        <path d={linePath} fill="none" className="chart-line" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" />
        ))}
      </svg>

      <div className="chart-labels">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function CropDonut({ buckets }: { buckets: CropBucket[] }) {
  let acc = 0;
  const stops: string[] = [];
  buckets.forEach((b, i) => {
    const start = acc;
    const end = acc + b.pct;
    stops.push(`${cropColorFor(i)} ${start}% ${end}%`);
    acc = end;
  });
  if (acc < 100) stops.push(`transparent ${acc}% 100%`);

  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="donut-chart-container">
      <div
        className="donut-ring"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="donut-center">
          <span className="donut-number">{total}</span>
          <span className="donut-label">Total Farms</span>
        </div>
      </div>
    </div>
  );
}

// ---------- main component ----------

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState(
    () => window.location.hash.slice(1) || 'dashboard',
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalFarmers, setTotalFarmers] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [totalFarms, setTotalFarms] = useState(0);

  const [cropBuckets, setCropBuckets] = useState<CropBucket[]>([]);
  const [last7Farms, setLast7Farms] = useState<DayPoint[]>([]);
  const [recentFarmers, setRecentFarmers] = useState<FarmerRow[]>([]);
  const [recentReports, setRecentReports] = useState<ReportRow[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<AnnouncementRow[]>([]);

  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [reportImageUrls, setReportImageUrls] = useState<Record<string, string>>({});

  const [weather, setWeather] = useState<WeatherState | null>(null);

  // ---------- routing ----------
  useEffect(() => {
    const update = () =>
      setActivePage(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  // ---------- dropdown ----------
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!profileMenuRef.current?.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileMenuOpen]);

  // ---------- admin profile ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || cancelled) return;

      const { data } = await supabase
        .from('farmers')
        .select('id, full_name, address, role')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (cancelled || !data) return;

      // ---- FIX: Reject non-admin users ----
      if (data.role !== 'admin') {
        console.warn(
          'Non-admin user reached the admin dashboard. Role:',
          data.role,
        );
        await supabase.auth.signOut();
        onLogout();
        return;
      }

      setProfile(data as FarmerProfile);
    })();
    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  // ---------- dashboard data ----------
  useEffect(() => {
    if (activePage !== 'dashboard') return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          farmersRes,
          farmsRes,
          reportsRes,
          recentFarmersRes,
          recentReportsRes,
          announcementsRes,
          farmTimestampsRes,
          farmCropsRes,
        ] = await Promise.all([
          supabase
            .from('farmers')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'farmer'),

          supabase
            .from('farms')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('pest_reports')
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('farmers')
            .select('id, full_name, address, avatar_path, status, created_at')
            .eq('role', 'farmer')
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('pest_reports')
            .select('id, note, status, created_at, image_path, farmer_id')
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('announcements')
            .select('id, title, created_at, image_url')
            .order('created_at', { ascending: false })
            .limit(3),

          supabase
            .from('farms')
            .select('created_at')
            .order('created_at', { ascending: true }),

          supabase.from('farms').select('crop'),
        ]);

        if (cancelled) return;

        const firstError =
          farmersRes.error ||
          farmsRes.error ||
          reportsRes.error ||
          recentFarmersRes.error ||
          recentReportsRes.error ||
          announcementsRes.error ||
          farmTimestampsRes.error ||
          farmCropsRes.error;

        if (firstError) {
          setError(firstError.message);
          setLoading(false);
          return;
        }

        setTotalFarmers(farmersRes.count ?? 0);
        setTotalFarms(farmsRes.count ?? 0);
        setTotalReports(reportsRes.count ?? 0);

        const timestamps = (farmTimestampsRes.data ?? [])
          .map((r) => r.created_at)
          .filter((s): s is string => typeof s === 'string');
        setLast7Farms(buildLast7Days(timestamps));

        const counts = new Map<string, number>();
        for (const row of farmCropsRes.data ?? []) {
          const key = (row.crop ?? 'Unknown').toString().trim() || 'Unknown';
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const totalCrops = Array.from(counts.values()).reduce((s, n) => s + n, 0);
        const buckets: CropBucket[] = Array.from(counts.entries())
          .map(([crop, count]) => ({
            crop,
            count,
            pct: totalCrops === 0 ? 0 : (count / totalCrops) * 100,
          }))
          .sort((a, b) => b.count - a.count);
        setCropBuckets(buckets);

        const recentFarmerRows = (recentFarmersRes.data ?? []) as FarmerRow[];
        const farmerIds = recentFarmerRows.map((f) => f.id);

        let farmAggRows: { farmer_id: string; area_hectares: number }[] = [];
        if (farmerIds.length > 0) {
          const { data: farmsForFarmers } = await supabase
            .from('farms')
            .select('farmer_id, area_hectares')
            .in('farmer_id', farmerIds);
          farmAggRows = (farmsForFarmers ?? []) as {
            farmer_id: string;
            area_hectares: number;
          }[];
        }

        const aggMap = new Map<string, { count: number; hectares: number }>();
        for (const row of farmAggRows) {
          const cur = aggMap.get(row.farmer_id) ?? { count: 0, hectares: 0 };
          cur.count += 1;
          cur.hectares += Number(row.area_hectares ?? 0);
          aggMap.set(row.farmer_id, cur);
        }

        setRecentFarmers(
          recentFarmerRows.map((f) => {
            const agg = aggMap.get(f.id);
            return {
              ...f,
              farmCount: agg?.count ?? 0,
              totalHectares: agg?.hectares ?? 0,
            };
          }),
        );

        const avatars = await signUrls(
          'profile-avatars',
          recentFarmerRows
            .map((f) => f.avatar_path ?? '')
            .filter(Boolean),
        );
        if (cancelled) return;
        setAvatarUrls(avatars);

        const recentReportRows = (recentReportsRes.data ?? []) as ReportRow[];
        const reportFarmerIds = Array.from(
          new Set(recentReportRows.map((r) => r.farmer_id)),
        );

        const farmerInfoById = new Map<
          string,
          { full_name: string; address: string | null }
        >();
        if (reportFarmerIds.length > 0) {
          const { data: infoRows } = await supabase
            .from('farmers')
            .select('id, full_name, address')
            .in('id', reportFarmerIds);

          (infoRows ?? []).forEach((row) => {
            farmerInfoById.set(row.id, {
              full_name: row.full_name,
              address: row.address,
            });
          });
        }

        setRecentReports(
          recentReportRows.map((r) => {
            const info = farmerInfoById.get(r.farmer_id);
            return {
              ...r,
              farmerName: info?.full_name ?? 'Unknown farmer',
              location: info?.address ?? null,
            };
          }),
        );

        const reportImages = await signUrls(
          'pest-reports',
          recentReportRows
            .map((r) => r.image_path ?? '')
            .filter(Boolean),
        );
        if (cancelled) return;
        setReportImageUrls(reportImages);

        setRecentAnnouncements((announcementsRes.data ?? []) as AnnouncementRow[]);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  // ---------- weather ----------
  useEffect(() => {
    const address = profile?.address;
    if (!address) return;
    let cancelled = false;

    (async () => {
      try {
        const q = guessGeoQuery(address) || address;
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q,
          )}&count=1&language=en&format=json`,
        );
        const geo = await geoRes.json();
        const place = geo?.results?.[0];
        if (!place) return;

        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
        );
        const wx = await wxRes.json();
        if (cancelled) return;

        setWeather({
          tempC: Math.round(wx.current.temperature_2m),
          highC: Math.round(wx.daily.temperature_2m_max[0]),
          lowC: Math.round(wx.daily.temperature_2m_min[0]),
          description: describeWeather(wx.current.weather_code),
        });
      } catch {
        // silent
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.address]);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLogoutError(`Unable to log out: ${error.message}`);
        return;
      }
      onLogout();
    } catch (err) {
      setLogoutError(
        `Unable to log out: ${
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        }`,
      );
    }
  };

  const hasFarmActivity = last7Farms.some((d) => d.value > 0);
  const cropTotal = cropBuckets.reduce((s, b) => s + b.count, 0);

  return (
    <PageLayout className="page-layout--dashboard">
      <SideNav activePage={activePage} />

      <div className="main-wrapper">
        <header className="topbar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search farmers, reports, or locations..."
            />
          </div>

          <div className="topbar-actions">
            <button className="notification-btn" aria-label="Notifications">
              <Bell size={20} />
              {totalReports > 0 && (
                <span className="notification-badge">{totalReports}</span>
              )}
            </button>

            <div className="profile-menu" ref={profileMenuRef}>
              <button
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                className="user-profile"
                onClick={() => {
                  setLogoutError('');
                  setIsProfileMenuOpen((o) => !o);
                }}
                type="button"
              >
                <span className="avatar-circle">
                  {profile ? initialsFromName(profile.full_name) : 'AD'}
                </span>
                <span className="user-meta">
                  <span className="user-name">
                    {profile?.full_name ?? 'Admin'}
                  </span>
                  <span className="user-role">Administrator</span>
                </span>
                <ChevronDown size={16} className="dropdown-arrow" />
              </button>
              {isProfileMenuOpen && (
                <div className="profile-dropdown" role="menu">
                  <button
                    className="profile-dropdown-item"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      window.location.hash = 'settings';
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <UserRound size={16} />
                    Profile
                  </button>
                  <button
                    className="profile-dropdown-item profile-dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                  {logoutError && (
                    <p className="profile-dropdown-error" role="alert">
                      {logoutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {activePage === 'farmers' ? (
          <AdminFarmers />
        ) : activePage === 'reports' ? (
          <AdminReports />
        ) : activePage === 'messages' ? (
          profile?.id && profile.role === 'admin' ? (
            <FarmerMessage adminId={profile.id} />
          ) : (
            <main className="dashboard-content">
              <p className="chart-empty-text">
                {profile
                  ? 'You are not authorized to view this page.'
                  : 'Loading admin profile…'}
              </p>
            </main>
          )
        ) : activePage === 'requests' ? (
          <AdminRequest />
        ) : activePage === 'crops' ? (
          <CropProduction />
        ) : activePage === 'weather' ? (
          <WeatherAlerts />
        ) : activePage === 'map' ? (
          <AdminMap />
        ) : activePage === 'analytics' ? (
          <AdminAnalytics />
        ) : activePage === 'announcements' ? (
          <AdminAnnouncements />
        ) : activePage === 'settings' ? (
          <SettingsPage />
        ) : (
          <main className="dashboard-content">
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <div className="left-grid-column">
              <section className="hero-banner">
                <div className="hero-text-area">
                  <h2>Good morning, Admin!</h2>
                  <p>
                    Here&apos;s what&apos;s happening in your agricultural
                    community today.
                  </p>
                </div>

                <div className="hero-stats-row">
                  <div className="hero-stat-card">
                    <div className="stat-icon-wrapper">
                      <Users size={20} />
                    </div>
                    <div className="stat-data">
                      <span className="stat-label">Total Farmers</span>
                      <span className="stat-value">
                        {loading ? '—' : totalFarmers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="hero-stat-card">
                    <div className="stat-icon-wrapper">
                      <FileText size={20} />
                    </div>
                    <div className="stat-data">
                      <span className="stat-label">Total Reports</span>
                      <span className="stat-value">
                        {loading ? '—' : totalReports.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="hero-stat-card">
                    <div className="stat-icon-wrapper">
                      <Sprout size={20} />
                    </div>
                    <div className="stat-data">
                      <span className="stat-label">Total Farms</span>
                      <span className="stat-value">
                        {loading ? '—' : totalFarms.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="quick-actions-bar">
                <button
                  className="action-pill"
                  onClick={() => {
                    window.location.hash = 'farmers';
                  }}
                >
                  <Users size={16} /> <span>Manage Users</span>
                </button>
                <button
                  className="action-pill"
                  onClick={() => {
                    window.location.hash = 'reports';
                  }}
                >
                  <FileText size={16} /> <span>Reports</span>
                </button>
                <button
                  className="action-pill"
                  onClick={() => {
                    window.location.hash = 'analytics';
                  }}
                >
                  <BarChart3 size={16} /> <span>Analytics</span>
                </button>
                <button
                  className="action-pill"
                  onClick={() => {
                    window.location.hash = 'announcements';
                  }}
                >
                  <Megaphone size={16} /> <span>Announcements</span>
                </button>
                <button
                  className="action-pill"
                  onClick={() => {
                    window.location.hash = 'settings';
                  }}
                >
                  <Settings size={16} /> <span>Settings</span>
                </button>
              </section>

              <div className="charts-row">
                <div className="card-box chart-box">
                  <div className="card-header">
                    <div className="card-title">
                      <TrendingUp size={18} className="title-icon" />
                      <h3>Farm Production Overview</h3>
                    </div>
                    <select className="date-select" defaultValue="7">
                      <option value="7">Last 7 Days</option>
                    </select>
                  </div>

                  {loading ? (
                    <p className="chart-empty-text">Loading…</p>
                  ) : !hasFarmActivity ? (
                    <div className="chart-empty">
                      <p>No farms added in the last 7 days.</p>
                    </div>
                  ) : (
                    <FarmRegistrationsChart data={last7Farms} />
                  )}
                </div>

                <div className="card-box distribution-box">
                  <div className="card-header">
                    <div className="card-title">
                      <PieChart size={18} className="title-icon" />
                      <h3>Crop Distribution</h3>
                    </div>
                  </div>

                  <div className="distribution-body">
                    {loading ? (
                      <p className="chart-empty-text">Loading…</p>
                    ) : cropTotal === 0 ? (
                      <p className="chart-empty-text">
                        No farms registered yet.
                      </p>
                    ) : (
                      <>
                        <CropDonut buckets={cropBuckets} />
                        <ul className="crop-legend">
                          {cropBuckets.map((b, i) => (
                            <li key={b.crop}>
                              <span
                                className="dot"
                                style={{ background: cropColorFor(i) }}
                              />
                              {b.crop}
                              <b>{Math.round(b.pct)}%</b>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bottom-row">
                <div className="card-box table-box">
                  <div className="card-header">
                    <div className="card-title">
                      <Users size={18} className="title-icon" />
                      <h3>Recent Farmers</h3>
                    </div>
                    <a href="#farmers" className="view-all-link">
                      View All
                    </a>
                  </div>

                  {loading ? (
                    <p className="chart-empty-text">Loading…</p>
                  ) : recentFarmers.length === 0 ? (
                    <p className="chart-empty-text">
                      No farmer accounts yet.
                    </p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col" className="col-num">#</th>
                          <th scope="col">Name</th>
                          <th scope="col">Location</th>
                          <th scope="col">Farm Size</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="col-action">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFarmers.map((f, idx) => {
                          const avatar = f.avatar_path
                            ? avatarUrls[f.avatar_path]
                            : null;
                          const sizeLabel =
                            f.farmCount && f.farmCount > 0
                              ? `${(f.totalHectares ?? 0).toFixed(1)} ha`
                              : '—';
                          const status = f.status ?? 'active';
                          return (
                            <tr key={f.id}>
                              <td>{idx + 1}</td>
                              <td className="user-cell">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt={f.full_name}
                                    className="table-avatar table-avatar--img"
                                  />
                                ) : (
                                  <div className="table-avatar">
                                    {initialsFromName(f.full_name)}
                                  </div>
                                )}
                                <span>{f.full_name}</span>
                              </td>
                              <td title={f.address ?? ''}>
                                {f.address ?? '—'}
                              </td>
                              <td>{sizeLabel}</td>
                              <td>
                                <span className={`status-badge ${status}`}>
                                  {status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="col-action">
                                <a className="view-btn" href="#farmers">
                                  View
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="card-box weather-box">
                  <div className="card-header">
                    <div className="card-title">
                      <CloudSun size={18} className="title-icon" />
                      <h3>Weather &amp; Alerts</h3>
                    </div>
                    <a href="#weather" className="view-all-link">
                      View All
                    </a>
                  </div>

                  {weather && profile?.address ? (
                    <>
                      <div className="weather-display">
                        <div className="weather-main">
                          <CloudSun size={38} className="weather-icon" />
                          <div>
                            <div className="temp-val">{weather.tempC}°C</div>
                            <div className="temp-desc">
                              {weather.description}
                            </div>
                          </div>
                        </div>
                        <div className="weather-location">
                          <span className="weather-location-name">
                            <MapPin size={13} />
                            {profile.address}
                          </span>
                          <span className="weather-location-range">
                            H: {weather.highC}° L: {weather.lowC}°
                          </span>
                        </div>
                      </div>

                      <div className="alert-banner warning">
                        <ShieldAlert size={16} />
                        <div>
                          <strong>Weather alerts</strong>
                          <p>
                            See the full list of advisories on the Weather page.
                          </p>
                        </div>
                      </div>

                      <div className="other-alerts">
                        <a className="alert-item" href="#weather">
                          <span>Open Weather &amp; Alerts</span>
                          <ChevronRight size={14} />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="chart-empty">
                      <p>
                        Live weather is shown on the Weather page, keyed to
                        each farmer&apos;s registered address.
                      </p>
                      <button
                        className="chart-cta"
                        onClick={() => {
                          window.location.hash = 'weather';
                        }}
                      >
                        Open Weather
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="right-grid-column">
              <div className="card-box right-card">
                <div className="card-header">
                  <div className="card-title">
                    <FileText size={18} className="title-icon" />
                    <h3>Recent Reports</h3>
                  </div>
                  <a href="#reports" className="view-all-link">
                    View All
                  </a>
                </div>

                <div className="reports-list">
                  {loading ? (
                    <p className="chart-empty-text">Loading…</p>
                  ) : recentReports.length === 0 ? (
                    <p className="chart-empty-text">No reports yet.</p>
                  ) : (
                    recentReports.map((r) => {
                      const img = r.image_path
                        ? reportImageUrls[r.image_path]
                        : null;
                      return (
                        <a className="report-item" key={r.id} href="#reports">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="report-thumb report-thumb--img"
                            />
                          ) : (
                            <div className="report-thumb report-thumb--placeholder" />
                          )}

                          <div className="report-info">
                            <h4>{r.note?.trim() || 'Report submitted'}</h4>
                            <p className="report-meta">
                              <MapPin size={11} />
                              <span>{r.farmerName ?? 'Unknown farmer'}</span>
                              {r.location ? (
                                <>
                                  <span className="report-meta-dot">•</span>
                                  <span>{r.location}</span>
                                </>
                              ) : null}
                            </p>
                            <small>{formatRelative(r.created_at)}</small>
                          </div>

                          <span className={`status-pill ${r.status}`}>
                            {r.status}
                          </span>
                          <ChevronRight size={15} className="report-arrow" />
                        </a>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card-box right-card">
                <div className="card-header">
                  <div className="card-title">
                    <BarChart3 size={18} className="title-icon" />
                    <h3>Quick Insights</h3>
                  </div>
                </div>

                <div className="quick-insights-grid">
                  <div className="insight-card">
                    <Sprout className="insight-icon" size={18} />
                    <div>
                      <span className="insight-label">Crops tracked</span>
                      <span className="insight-val">
                        {loading ? '—' : cropBuckets.length}
                      </span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <Sprout className="insight-icon" size={18} />
                    <div>
                      <span className="insight-label">Total Farms</span>
                      <span className="insight-val">
                        {loading ? '—' : totalFarms.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <Users className="insight-icon" size={18} />
                    <div>
                      <span className="insight-label">Total Farmers</span>
                      <span className="insight-val">
                        {loading ? '—' : totalFarmers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="insight-card">
                    <FileText className="insight-icon" size={18} />
                    <div>
                      <span className="insight-label">Total Reports</span>
                      <span className="insight-val">
                        {loading ? '—' : totalReports.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-box right-card">
                <div className="card-header">
                  <div className="card-title">
                    <Megaphone size={18} className="title-icon" />
                    <h3>Recent Announcements</h3>
                  </div>
                  <a href="#announcements" className="view-all-link">
                    View All
                  </a>
                </div>

                <div className="announcements-list">
                  {loading ? (
                    <p className="chart-empty-text">Loading…</p>
                  ) : recentAnnouncements.length === 0 ? (
                    <p className="chart-empty-text">
                      No announcements yet.
                    </p>
                  ) : (
                    recentAnnouncements.map((a) => (
                      <div className="dash-announcement-item" key={a.id}>
                        <div className="dash-announcement-badge green">
                          <Megaphone size={14} />
                        </div>

                        <div className="dash-announcement-info">
                          <h4>{a.title}</h4>
                          <p>{formatRelative(a.created_at)}</p>
                        </div>

                        {a.image_url ? (
                          <img
                            className="dash-announcement-thumb"
                            src={a.image_url}
                            alt=""
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;