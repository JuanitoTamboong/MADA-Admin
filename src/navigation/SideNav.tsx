import React from 'react';
import {
  BarChart3,
  CloudSun,
  FileText,
  LayoutDashboard,
  Map,
  Megaphone,
  Settings,
  Sprout,
  Users,
} from 'lucide-react';
import mayaBird from '../assets/images/maya-bird.png';
import './SideNav.css';

interface SideNavProps {
  activePage: string;
}

const SideNav: React.FC<SideNavProps> = ({ activePage }) => (
  <aside className="sidebar">
    <div className="sidebar-brand">
      <img src={mayaBird} alt="AgriAssist logo" className="brand-logo" />
      <div className="brand-info">
        <h1 className="brand-title">MADA</h1>
        <p className="brand-tagline">Smarter Farms, Stronger Communities</p>
      </div>
    </div>

    <nav className="sidebar-nav">
      <a
        aria-current={activePage === 'dashboard' ? 'page' : undefined}
        className={`nav-item${activePage === 'dashboard' ? ' active' : ''}`}
        href="#dashboard"
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </a>
      <a
        aria-current={activePage === 'farmers' ? 'page' : undefined}
        className={`nav-item${activePage === 'farmers' ? ' active' : ''}`}
        href="#farmers"
      >
        <Users size={18} />
        <span>Farmers</span>
      </a>
      <a
        aria-current={activePage === 'reports' ? 'page' : undefined}
        className={`nav-item${activePage === 'reports' ? ' active' : ''}`}
        href="#reports"
      >
        <FileText size={18} />
        <span>Reports</span>
      </a>
      <a
        aria-current={activePage === 'crops' ? 'page' : undefined}
        className={`nav-item${activePage === 'crops' ? ' active' : ''}`}
        href="#crops"
      >
        <Sprout size={18} />
        <span>Crops &amp; Production</span>
      </a>
      <a
        aria-current={activePage === 'weather' ? 'page' : undefined}
        className={`nav-item${activePage === 'weather' ? ' active' : ''}`}
        href="#weather"
      >
        <CloudSun size={18} />
        <span>Weather &amp; Alerts</span>
      </a>
      <a href="#map" className="nav-item">
        <Map size={18} />
        <span>Map</span>
      </a>
      <a href="#analytics" className="nav-item">
        <BarChart3 size={18} />
        <span>Analytics</span>
      </a>
      <a href="#announcements" className="nav-item">
        <Megaphone size={18} />
        <span>Announcements</span>
      </a>
      <a href="#settings" className="nav-item">
        <Settings size={18} />
        <span>Settings</span>
      </a>
    </nav>

    <div className="sidebar-promo-card">
      <div className="promo-bg" />
      <div className="promo-content">
        <Sprout size={22} className="promo-icon" />
        <p className="promo-text">Together for a Greener Tomorrow</p>
      </div>
    </div>

    <div className="sidebar-footer">
      <img src={mayaBird} alt="AgriAssist" className="footer-mini-logo" />
      <div className="footer-brand-meta">
        <span className="footer-brand-name">MADA</span>
        <span className="footer-brand-version">v1.0.0</span>
      </div>
    </div>
  </aside>
);

export default SideNav;