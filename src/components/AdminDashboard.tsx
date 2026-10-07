import React, { useEffect, useState } from 'react';
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
  TrendingUp,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import '../css/AdminDashboard.css';
import AdminFarmers from './AdminFarmers';
import AdminReports from './AdminReports';
import CropProduction from './CropProduction';
import WeatherAlerts from './WeatherAlerts';
import AdminMap from './AdminMap';
import AdminAnalytics from './AdminAnalytics';
import AdminAnnouncements from './AdminAnnouncements';
import SideNav from '../navigation/SideNav';
import PageLayout from '../shared/PageLayout';

export const AdminDashboard: React.FC = () => {
  const [activePage, setActivePage] = useState(
    () => window.location.hash.slice(1) || 'dashboard',
  );

  useEffect(() => {
    const updateActivePage = () => {
      setActivePage(window.location.hash.slice(1) || 'dashboard');
    };

    window.addEventListener('hashchange', updateActivePage);
    return () => window.removeEventListener('hashchange', updateActivePage);
  }, []);

  return (
    <PageLayout className="page-layout--dashboard">
      <SideNav activePage={activePage} />

      {/* 2. MAIN CONTENT AREA */}
      <div className="main-wrapper">
        {/* TOP NAVBAR */}
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
              <span className="notification-badge">3</span>
            </button>

            <div className="user-profile">
              <div className="avatar-circle">AD</div>
              <div className="user-meta">
                <span className="user-name">Admin</span>
                <span className="user-role">Administrator</span>
              </div>
              <ChevronDown size={16} className="dropdown-arrow" />
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
        ) : (
        /* DASHBOARD BODY GRID */
        <main className="dashboard-content">
          <div className="left-grid-column">
            
            {/* Hero Welcome Banner */}
            <section className="hero-banner">
              <div className="hero-text-area">
                <h2>Good morning, Admin!</h2>
                <p>Here's what's happening in your agricultural community today.</p>
              </div>

              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper">
                    <Users size={20} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-label">Total Farmers</span>
                    <span className="stat-value">1,248</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper">
                    <FileText size={20} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-label">Total Reports</span>
                    <span className="stat-value">356</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper">
                    <Sprout size={20} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-label">Total Farms</span>
                    <span className="stat-value">892</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions Row */}
            <section className="quick-actions-bar">
              <button className="action-pill">
                <Users size={16} /> <span>Manage Users</span>
              </button>
              <button className="action-pill">
                <FileText size={16} /> <span>Reports</span>
              </button>
              <button className="action-pill" onClick={() => { window.location.hash = 'analytics'; }}>
                <BarChart3 size={16} /> <span>Analytics</span>
              </button>
              <button className="action-pill" onClick={() => { window.location.hash = 'announcements'; }}>
                <Megaphone size={16} /> <span>Announcements</span>
              </button>
              <button className="action-pill">
                <Settings size={16} /> <span>Settings</span>
              </button>
            </section>

            {/* Analytics Row: Production Chart & Donut Distribution */}
            <div className="charts-row">
              <div className="card-box chart-box">
                <div className="card-header">
                  <div className="card-title">
                    <TrendingUp size={18} className="title-icon" />
                    <h3>Farm Production Overview</h3>
                  </div>
                  <select className="date-select">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                
                {/* SVG Line Chart Representation */}
                <div className="chart-wrapper">
                  <svg
                    viewBox="0 0 400 150"
                    className="line-chart-svg"
                    role="img"
                    aria-label="Farm production trend from August 24 to August 30"
                  >
                    <g className="chart-grid">
                      <path d="M 30 20 H 390 M 30 50 H 390 M 30 80 H 390 M 30 110 H 390" />
                      <text x="2" y="113">0</text>
                      <text x="2" y="83">50</text>
                      <text x="2" y="53">100</text>
                      <text x="2" y="23">150</text>
                    </g>
                    <path
                      d="M 30 110 L 80 95 L 130 105 L 180 82 L 230 90 L 280 68 L 330 48 L 390 20 L 390 120 L 30 120 Z"
                      className="chart-area"
                    />
                    <path
                      d="M 30 110 L 80 95 L 130 105 L 180 82 L 230 90 L 280 68 L 330 48 L 390 20"
                      fill="none"
                      className="chart-line"
                    />
                    <circle cx="30" cy="110" r="3" />
                    <circle cx="80" cy="95" r="3" />
                    <circle cx="130" cy="105" r="3" />
                    <circle cx="180" cy="82" r="3" />
                    <circle cx="230" cy="90" r="3" />
                    <circle cx="280" cy="68" r="3" />
                    <circle cx="330" cy="48" r="3" />
                    <circle cx="390" cy="20" r="3" />
                  </svg>
                  <div className="chart-labels">
                    <span>Aug 24</span>
                    <span>Aug 25</span>
                    <span>Aug 26</span>
                    <span>Aug 27</span>
                    <span>Aug 28</span>
                    <span>Aug 29</span>
                    <span>Aug 30</span>
                  </div>
                </div>
              </div>

              <div className="card-box distribution-box">
                <div className="card-header">
                  <div className="card-title">
                    <PieChart size={18} className="title-icon" />
                    <h3>Crop Distribution</h3>
                  </div>
                </div>
                
                <div className="distribution-body">
                  <div className="donut-chart-container">
                    <div className="donut-ring">
                      <div className="donut-center">
                        <span className="donut-number">892</span>
                        <span className="donut-label">Total Farms</span>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="crop-legend">
                    <li><span className="dot rice" /> Rice <b>32%</b></li>
                    <li><span className="dot corn" /> Corn <b>24%</b></li>
                    <li><span className="dot coconut" /> Coconut <b>18%</b></li>
                    <li><span className="dot vegetables" /> Vegetables <b>14%</b></li>
                    <li><span className="dot fruits" /> Fruits <b>12%</b></li>
                    <li><span className="dot others" /> Others <b>2%</b></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Farmers Table & Weather Widget */}
            <div className="bottom-row">
              <div className="card-box table-box">
                <div className="card-header">
                  <div className="card-title">
                    <Users size={18} className="title-icon" />
                    <h3>Recent Farmers</h3>
                  </div>
                  <a href="#all" className="view-all-link">View All</a>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Farm Size</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td className="user-cell"><div className="table-avatar">J</div> Juan Dela Cruz</td>
                      <td>San Jose Farm</td>
                      <td>2.5 ha</td>
                      <td><span className="status-badge active">Active</span></td>
                      <td><button className="view-btn">View</button></td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td className="user-cell"><div className="table-avatar">M</div> Maria Santos</td>
                      <td>Buenavista Farm</td>
                      <td>1.8 ha</td>
                      <td><span className="status-badge active">Active</span></td>
                      <td><button className="view-btn">View</button></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td className="user-cell"><div className="table-avatar">P</div> Pedro Reyes</td>
                      <td>Calumpang Farm</td>
                      <td>3.2 ha</td>
                      <td><span className="status-badge active">Active</span></td>
                      <td><button className="view-btn">View</button></td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td className="user-cell"><div className="table-avatar">A</div> Ana Lopez</td>
                      <td>San Isidro Farm</td>
                      <td>2.0 ha</td>
                      <td><span className="status-badge inactive">Inactive</span></td>
                      <td><button className="view-btn">View</button></td>
                    </tr>
                    <tr>
                      <td>5</td>
                      <td className="user-cell"><div className="table-avatar">R</div> Ricardo Garcia</td>
                      <td>Agbulato Farm</td>
                      <td>4.5 ha</td>
                      <td><span className="status-badge active">Active</span></td>
                      <td><button className="view-btn">View</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card-box weather-box">
                <div className="card-header">
                  <div className="card-title">
                    <CloudSun size={18} className="title-icon" />
                    <h3>Weather & Alerts</h3>
                  </div>
                  <a href="#weather" className="view-all-link">View All</a>
                </div>

                <div className="weather-display">
                  <div className="weather-main">
                    <CloudSun size={38} className="weather-icon" />
                    <div>
                      <div className="temp-val">28°C</div>
                      <div className="temp-desc">Partly Cloudy</div>
                    </div>
                  </div>
                  <div className="weather-location">
                    <span>📍 Calumpit, Romblon</span>
                    <span>H: 31° L: 26°</span>
                  </div>
                </div>

                <div className="alert-banner warning">
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Heavy rain expected tomorrow</strong>
                    <p>Avoid spraying pesticides today.</p>
                  </div>
                </div>

                <div className="other-alerts">
                  <div className="alert-item">
                    <span>Strong wind possible</span>
                    <ChevronRight size={14} />
                  </div>
                  <div className="alert-item">
                    <span>High temperature alert</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. RIGHT SIDEBAR COLUMN */}
          <div className="right-grid-column">
            
            {/* Recent Reports List */}
            <div className="card-box right-card">
              <div className="card-header">
                <div className="card-title">
                  <FileText size={18} className="title-icon" />
                  <h3>Recent Reports</h3>
                </div>
                <a href="#reports" className="view-all-link">View All</a>
              </div>

              <div className="reports-list">
                <div className="report-item">
                  <div className="report-thumb pest" />
                  <div className="report-info">
                    <h4>Pest Infestation</h4>
                    <p>San Jose Farm</p>
                    <small>Aug 25, 2025 • 10:24 AM</small>
                  </div>
                  <span className="status-pill pending">Pending</span>
                  <ChevronRight size={15} className="report-arrow" />
                </div>

                <div className="report-item">
                  <div className="report-thumb water" />
                  <div className="report-info">
                    <h4>Water Shortage</h4>
                    <p>Buenavista Farm</p>
                    <small>Aug 24, 2025 • 03:12 PM</small>
                  </div>
                  <span className="status-pill in-progress">In Progress</span>
                  <ChevronRight size={15} className="report-arrow" />
                </div>

                <div className="report-item">
                  <div className="report-thumb disease" />
                  <div className="report-info">
                    <h4>Disease Outbreak</h4>
                    <p>San Isidro Farm</p>
                    <small>Aug 23, 2025 • 09:45 AM</small>
                  </div>
                  <span className="status-pill resolved">Resolved</span>
                  <ChevronRight size={15} className="report-arrow" />
                </div>

                <div className="report-item">
                  <div className="report-thumb soil" />
                  <div className="report-info">
                    <h4>Soil Erosion</h4>
                    <p>San Jose Farm</p>
                    <small>Aug 22, 2025 • 04:20 PM</small>
                  </div>
                  <span className="status-pill resolved">Resolved</span>
                  <ChevronRight size={15} className="report-arrow" />
                </div>

                <div className="report-item">
                  <div className="report-thumb pest" />
                  <div className="report-info">
                    <h4>Pest Infestation</h4>
                    <p>Calumpang Farm</p>
                    <small>Aug 21, 2025 • 11:12 AM</small>
                  </div>
                  <span className="status-pill pending">Pending</span>
                  <ChevronRight size={15} className="report-arrow" />
                </div>
              </div>
            </div>

            {/* Quick Insights 2x2 Grid */}
            <div className="card-box right-card">
              <div className="card-header">
                <div className="card-title">
                  <BarChart3 size={18} className="title-icon" />
                  <h3>Quick Insights</h3>
                </div>
                <a href="#insights" className="view-all-link">View All</a>
              </div>

              <div className="quick-insights-grid">
                <div className="insight-card">
                  <Sprout className="insight-icon" size={18} />
                  <div>
                    <span className="insight-label">Total Crops</span>
                    <span className="insight-val">5</span>
                  </div>
                </div>

                <div className="insight-card">
                  <Sprout className="insight-icon" size={18} />
                  <div>
                    <span className="insight-label">Total Farms</span>
                    <span className="insight-val">892</span>
                  </div>
                </div>

                <div className="insight-card">
                  <Users className="insight-icon" size={18} />
                  <div>
                    <span className="insight-label">Total Farmers</span>
                    <span className="insight-val">1,248</span>
                  </div>
                </div>

                <div className="insight-card">
                  <FileText className="insight-icon" size={18} />
                  <div>
                    <span className="insight-label">Total Reports</span>
                    <span className="insight-val">356</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="card-box right-card">
              <div className="card-header">
                <div className="card-title">
                  <Megaphone size={18} className="title-icon" />
                  <h3>Recent Announcements</h3>
                </div>
                <a href="#announcements" className="view-all-link">View All</a>
              </div>

              <div className="announcements-list">
                <div className="announcement-item">
                  <div className="announcement-icon-badge green">
                    <Megaphone size={14} />
                  </div>
                  <div className="announcement-info">
                    <h4>Fertilizer Distribution Schedule</h4>
                    <p>Oct 5, 2025</p>
                  </div>
                </div>

                <div className="announcement-item">
                  <div className="announcement-icon-badge blue">
                    <Megaphone size={14} />
                  </div>
                  <div className="announcement-info">
                    <h4>Agricultural Training on Oct 10</h4>
                    <p>Oct 3, 2025</p>
                  </div>
                </div>

                <div className="announcement-item">
                  <div className="announcement-icon-badge orange">
                    <Megaphone size={14} />
                  </div>
                  <div className="announcement-info">
                    <h4>Market Price Update</h4>
                    <p>Oct 1, 2025</p>
                  </div>
                </div>
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