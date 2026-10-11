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
} from 'lucide-react';
import '../css/AdminDashboard.css';
import { supabase } from '../supabase/supabase-client';
import SettingsPage from './Settings';
import AdminFarmers from './AdminFarmers';
import AdminReports from './AdminReports';
import CropProduction from './CropProduction';
import WeatherAlerts from './WeatherAlerts';
import AdminMap from './AdminMap';
import AdminAnalytics from './AdminAnalytics';
import AdminAnnouncements from './AdminAnnouncements';
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
  created_at: string;
}

interface ReportRow {
  id: string;
  note: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  created_at: string;
}

interface WeatherState {
  tempC: number;
  highC: number;
  lowC: number;
  description: string;
}

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activePage, setActivePage] = useState(
    () => window.location.hash.slice(1) || 'dashboard',
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // --- admin's own profile (for avatar + weather) ---
  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  // --- dashboard data ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalFarmers, setTotalFarmers] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [totalFarms, setTotalFarms] = useState(0);

  const [cropBreakdown, setCropBreakdown] = useState<{ crop: string; count: number }[]>([]);
  const [recentFarmers, setRecentFarmers] = useState<FarmerRow[]>([]);
  const [recentReports, setRecentReports] = useState<ReportRow[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<AnnouncementRow[]>([]);

  const [weather, setWeather] = useState<WeatherState | null>(null);

  // --- hash routing ---
  useEffect(() => {
    const updateActivePage = () => {
      setActivePage(window.location.hash.slice(1) || 'dashboard');
    };
    window.addEventListener('hashchange', updateActivePage);
    return () => window.removeEventListener('hashchange', updateActivePage);
  }, []);

  // --- profile dropdown close-on-outside ---
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isProfileMenuOpen]);

  // --- fetch admin's own profile once ---
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

      if (!cancelled && data) setProfile(data as FarmerProfile);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- load dashboard data when dashboard is visible ---
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
          cropRowsRes,
          recentFarmersRes,
          recentReportsRes,
          announcementsRes,
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

          supabase.from('farms').select('crop'),

          supabase
            .from('farmers')
            .select('id, full_name, address, created_at')
            .eq('role', 'farmer')
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('pest_reports')
            .select('id, note, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('announcements')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (cancelled) return;

        const firstError =
          farmersRes.error ||
          farmsRes.error ||
          reportsRes.error ||
          cropRowsRes.error ||
          recentFarmersRes.error ||
          recentReportsRes.error ||
          announcementsRes.error;

        if (firstError) {
          setError(firstError.message);
          setLoading(false);
          return;
        }

        setTotalFarmers(farmersRes.count ?? 0);
        setTotalFarms(farmsRes.count ?? 0);
        setTotalReports(reportsRes.count ?? 0);

        const counts = new Map<string, number>();
        for (const row of cropRowsRes.data ?? []) {
          const key = (row.crop ?? 'Unknown').toString().trim() || 'Unknown';
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        setCropBreakdown(
          Array.from(counts.entries())
            .map(([crop, count]) => ({ crop, count }))
            .sort((a, b) => b.count - a.count),
        );

        setRecentFarmers((recentFarmersRes.data ?? []) as FarmerRow[]);
        setRecentReports((recentReportsRes.data ?? []) as ReportRow[]);
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

  // --- live weather for admin's address (only if it exists) ---
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
        // silently skip — the card falls back to a link
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

  const cropTotal = cropBreakdown.reduce((s, c) => s + c.count, 0);
  const maxCropCount = Math.max(...cropBreakdown.map((crop) => crop.count), 0);

  return (
    <PageLayout className="page-layout--dashboard">
      <SideNav activePage={activePage} />

      <div className="main-wrapper">
        {/* TOPBAR */}
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
                  setIsProfileMenuOpen((isOpen) => !isOpen);
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
              {/* HERO */}
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

              {/* QUICK ACTIONS */}
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

              {/* CHARTS ROW */}
              <div className="charts-row">
                <div className="card-box chart-box">
                  <div className="card-header">
                    <div className="card-title">
                      <TrendingUp size={18} className="title-icon" />
                      <h3>Farm Production Overview</h3>
                    </div>
                  </div>

                  <p className="production-chart-note">
                    Registered farms by crop. Harvest quantities are not
                    recorded in the available farm data.
                  </p>
                  {loading ? (
                    <p className="chart-empty-text">Loading…</p>
                  ) : cropBreakdown.length === 0 ? (
                    <p className="chart-empty-text">
                      No farm records available yet.
                    </p>
                  ) : (
                    <ul
                      aria-label="Registered farms by crop"
                      className="production-chart"
                    >
                      {cropBreakdown.map((crop) => (
                        <li className="production-chart-row" key={crop.crop}>
                          <span className="production-chart-label">
                            {crop.crop}
                          </span>
                          <span className="production-chart-track">
                            <span
                              aria-hidden="true"
                              className="production-chart-bar"
                              style={{
                                width: `${(crop.count / maxCropCount) * 100}%`,
                              }}
                            />
                          </span>
                          <b>{crop.count}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="card-box distribution-box">
                  <div className="card-header">
                    <div className="card-title">
                      <Sprout size={18} className="title-icon" />
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
                      <ul className="crop-legend crop-legend--full">
                        {cropBreakdown.map((c) => {
                          const pct = Math.round((c.count / cropTotal) * 100);
                          return (
                            <li key={c.crop}>
                              <span
                                className="dot"
                                style={{
                                  background: '#1b4d2e',
                                  opacity: Math.max(0.35, pct / 100),
                                }}
                              />
                              {c.crop}{' '}
                              <b>
                                {c.count} ({pct}%)
                              </b>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW */}
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
                          <th scope="col">Name</th>
                          <th scope="col">Location</th>
                          <th scope="col">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFarmers.map((f) => (
                          <tr key={f.id}>
                            <td className="user-cell">
                              <div className="table-avatar">
                                {initialsFromName(f.full_name)}
                              </div>
                              <span>{f.full_name}</span>
                            </td>
                            <td>{f.address ?? '—'}</td>
                            <td>{formatRelative(f.created_at)}</td>
                          </tr>
                        ))}
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

            {/* RIGHT SIDEBAR */}
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
                    recentReports.map((r) => (
                      <a className="report-item" key={r.id} href="#reports">
                        <div className="report-info">
                          <h4>
                            {r.note && r.note.trim().length > 0
                              ? r.note.slice(0, 40)
                              : 'Report submitted'}
                          </h4>
                          <small>{formatRelative(r.created_at)}</small>
                        </div>
                        <span className={`status-pill ${r.status}`}>
                          {r.status}
                        </span>
                        <ChevronRight size={15} className="report-arrow" />
                      </a>
                    ))
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
                        {loading ? '—' : cropBreakdown.length}
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
                      <div className="announcement-item" key={a.id}>
                        <div className="announcement-icon-badge green">
                          <Megaphone size={14} />
                        </div>
                        <div className="announcement-info">
                          <h4>{a.title}</h4>
                          <p>{formatRelative(a.created_at)}</p>
                        </div>
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