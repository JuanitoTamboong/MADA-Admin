import { useState } from 'react';
import {
  CalendarDays,
  FileText,
  MapPin,
  Sprout,
  TrendingUp,
  Users,
} from 'lucide-react';
import '../css/AdminAnalytics.css';

const all = 'All';
const dateRanges = [
  { value: 'all', label: 'All dates' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const AdminAnalytics = () => {
  const [barangayFilter, setBarangayFilter] = useState(all);
  const [cropFilter, setCropFilter] = useState(all);
  const [seasonFilter, setSeasonFilter] = useState(all);
  const [dateRange, setDateRange] = useState('all');

  const resetFilters = () => {
    setBarangayFilter(all);
    setCropFilter(all);
    setSeasonFilter(all);
    setDateRange('all');
  };

  const noDataLabel = 'No data';
  const dataSourceLabel = 'No office records are available yet.';

  return (
    <main className="analytics-page">
      <header className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">PLAN AGRICULTURAL SUPPORT</p>
          <h1>Analytics</h1>
          <p>Explore farmer coverage, crop area, harvest records, and incoming farm reports.</p>
        </div>
        <span className="analytics-heading-icon"><TrendingUp size={23} /></span>
      </header>

      <section className="analytics-empty-state" role="status" aria-live="polite">
        <div className="analytics-empty-state-icon"><TrendingUp size={24} /></div>
        <h2>No data available</h2>
        <p>
          Analytics will appear here when verified farmer, crop, and report records are synced from the office.
          Until then, the dashboard should not estimate figures or present made-up values as current results.
        </p>
      </section>

      <section aria-label="Analytics filters" className="analytics-filters">
        <label>
          <span><CalendarDays size={14} /> Date range</span>
          <select onChange={(event) => setDateRange(event.target.value)} value={dateRange}>
            {dateRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
          </select>
        </label>
        <label>
          <span><MapPin size={14} /> Barangay</span>
          <select onChange={(event) => setBarangayFilter(event.target.value)} value={barangayFilter} disabled>
            <option value={all}>All barangays</option>
          </select>
        </label>
        <label>
          <span><Sprout size={14} /> Crop</span>
          <select onChange={(event) => setCropFilter(event.target.value)} value={cropFilter} disabled>
            <option value={all}>All crops</option>
          </select>
        </label>
        <label>
          <span><CalendarDays size={14} /> Season</span>
          <select onChange={(event) => setSeasonFilter(event.target.value)} value={seasonFilter} disabled>
            <option value={all}>All seasons</option>
          </select>
        </label>
        <button className="analytics-reset" onClick={resetFilters} type="button">Reset filters</button>
      </section>

      <section aria-label="Filtered summary" className="analytics-metrics">
        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--green"><Users size={18} /></span>
          <div>
            <span>Farmers in registry</span>
            <strong>{noDataLabel}</strong>
            <small>No verified farmer records available</small>
          </div>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--blue"><Sprout size={18} /></span>
          <div>
            <span>Crop records</span>
            <strong>{noDataLabel}</strong>
            <small>No crop data for the selected filters</small>
          </div>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--amber"><TrendingUp size={18} /></span>
          <div>
            <span>Planted area</span>
            <strong>{noDataLabel}</strong>
            <small>Area is not available until records are synced</small>
          </div>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--purple"><FileText size={18} /></span>
          <div>
            <span>Farmer reports</span>
            <strong>{noDataLabel}</strong>
            <small>No report data ready for review</small>
          </div>
        </article>
      </section>

      <section aria-label="Farmers by barangay" className="analytics-card">
        <header className="analytics-card-heading">
          <div>
            <h2>Farmers by barangay</h2>
            <p>Counts will appear once verified farmer records are available.</p>
          </div>
          <span className="analytics-unit-label">Farmers</span>
        </header>
        <p className="analytics-no-data">No data for the selected filters.</p>
      </section>

      <div className="analytics-chart-grid">
        <section aria-label="Planted area by crop" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Planted area by crop</h2>
              <p>Area totals will appear once crop records are synced.</p>
            </div>
            <span className="analytics-unit-label">ha</span>
          </header>
          <p className="analytics-no-data">No data for the selected filters.</p>
        </section>

        <section aria-label="Reported production by crop and source" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Reported production</h2>
              <p>Harvest totals will appear when production records are available.</p>
            </div>
            <span className="analytics-unit-label">kg</span>
          </header>
          <p className="analytics-no-data">No production data for the selected filters.</p>
        </section>
      </div>

      <section aria-label="Reports by type and status" className="analytics-card analytics-card--reports">
        <header className="analytics-card-heading">
          <div>
            <h2>Reports by type and status</h2>
            <p>Report summaries will appear once verified farmer issues are synced.</p>
          </div>
          <span className="analytics-unit-label">Reports</span>
        </header>
        <p className="analytics-no-data">No data for the selected filters.</p>
      </section>

      <footer className="analytics-data-note">
        <span>Data source: {dataSourceLabel}</span>
        <span>Last updated: not available. Sync verified office data before publishing analytics.</span>
      </footer>
    </main>
  );
};

export default AdminAnalytics;
