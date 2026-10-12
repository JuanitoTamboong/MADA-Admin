import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  MapPin,
  RefreshCw,
  Sprout,
  TrendingUp,
  Users,
} from 'lucide-react';
import '../css/AdminAnalytics.css';
import { supabase } from '../supabase/supabase-client';

const all = 'All';

const dateRanges = [
  { value: 'all', label: 'All dates' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
  created_at: string;
}

interface FarmRow {
  id: string;
  farmer_id: string;
  crop: string | null;
  area_hectares: number;
  created_at: string;
}

interface ReportRow {
  id: string;
  farmer_id: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

interface SeriesPoint {
  label: string;
  value: number;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short' });
}

function buildMonthlySeries(rows: { created_at: string }[]): SeriesPoint[] {
  const now = new Date();
  const months: SeriesPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: monthLabel(d), value: 0 });
  }
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  for (const row of rows) {
    const d = new Date(row.created_at);
    if (Number.isNaN(d.getTime()) || d < firstMonth) continue;
    const idx =
      (d.getFullYear() - firstMonth.getFullYear()) * 12 +
      (d.getMonth() - firstMonth.getMonth());
    if (idx >= 0 && idx < 6) months[idx].value += 1;
  }
  return months;
}

function percentChange(series: SeriesPoint[]): number | null {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first === 0 && last === 0) return null;
  if (first === 0) return 100;
  return Math.round(((last - first) / first) * 100);
}

// ---------------- SVG CHART COMPONENTS ----------------

function LineChart({
  data,
  color = '#16834d',
}: {
  data: SeriesPoint[];
  color?: string;
}) {
  const W = 420;
  const H = 140;
  const padX = 26;
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
    <div className="analytics-line-wrapper">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="analytics-line-svg"
        preserveAspectRatio="none"
      >
        <g className="analytics-line-grid">
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
        <path d={areaPath} fill={color} fillOpacity="0.12" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="analytics-line-labels">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({
  data,
  colors,
  centerLabel,
  centerValue,
}: {
  data: SeriesPoint[];
  colors: string[];
  centerLabel: string;
  centerValue: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const stops: string[] = [];
  data.forEach((d, i) => {
    const start = acc;
    const end = acc + (d.value / total) * 100;
    stops.push(`${colors[i % colors.length]} ${start}% ${end}%`);
    acc = end;
  });
  if (acc < 100) stops.push(`transparent ${acc}% 100%`);

  return (
    <div className="analytics-donut-wrapper">
      <div
        className="analytics-donut-ring"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="analytics-donut-center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="analytics-donut-legend">
        {data.map((d, i) => {
          const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
          return (
            <li key={d.label}>
              <span
                className="analytics-donut-dot"
                style={{ background: colors[i % colors.length] }}
              />
              <span>{d.label}</span>
              <em>{pct}%</em>
              <b>{d.value}</b>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------- MAIN ----------------

const AdminAnalytics = () => {
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [barangayFilter, setBarangayFilter] = useState(all);
  const [cropFilter, setCropFilter] = useState(all);
  const [dateRange, setDateRange] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [farmersRes, farmsRes, reportsRes] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, full_name, address, created_at')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false }),
      supabase
        .from('farms')
        .select('id, farmer_id, crop, area_hectares, created_at'),
      supabase
        .from('pest_reports')
        .select('id, farmer_id, status, created_at'),
    ]);

    const firstError = farmersRes.error || farmsRes.error || reportsRes.error;
    if (firstError) {
      setError(firstError.message);
      setFarmers([]);
      setFarms([]);
      setReports([]);
      setLoading(false);
      return;
    }

    setFarmers((farmersRes.data ?? []) as FarmerRow[]);
    setFarms((farmsRes.data ?? []) as FarmRow[]);
    setReports((reportsRes.data ?? []) as ReportRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const barangays = useMemo(
    () =>
      [...new Set(farmers.map((f) => (f.address ?? '').trim()).filter(Boolean))].sort(),
    [farmers],
  );
  const crops = useMemo(
    () => [...new Set(farms.map((f) => (f.crop ?? '').trim()).filter(Boolean))].sort(),
    [farms],
  );

  const resetFilters = () => {
    setBarangayFilter(all);
    setCropFilter(all);
    setDateRange('all');
  };

  const cutoffIso = dateRange === 'all' ? null : daysAgoIso(Number(dateRange));

  const filteredFarmers = useMemo(
    () =>
      farmers.filter((f) => {
        const okBrgy = barangayFilter === all || (f.address ?? '') === barangayFilter;
        const okDate = !cutoffIso || f.created_at >= cutoffIso;
        return okBrgy && okDate;
      }),
    [farmers, barangayFilter, cutoffIso],
  );

  const filteredFarms = useMemo(() => {
    const visible = new Set(filteredFarmers.map((f) => f.id));
    return farms.filter((farm) => {
      const okCrop = cropFilter === all || (farm.crop ?? '') === cropFilter;
      const okFarmer = visible.has(farm.farmer_id);
      const okDate = !cutoffIso || farm.created_at >= cutoffIso;
      return okCrop && okFarmer && okDate;
    });
  }, [farms, filteredFarmers, cropFilter, cutoffIso]);

  const filteredReports = useMemo(() => {
    const visible = new Set(filteredFarmers.map((f) => f.id));
    return reports.filter((r) => {
      const okFarmer = visible.has(r.farmer_id);
      const okDate = !cutoffIso || r.created_at >= cutoffIso;
      return okFarmer && okDate;
    });
  }, [reports, filteredFarmers, cutoffIso]);

  const totalFarmers = filteredFarmers.length;
  const totalFarms = filteredFarms.length;
  const totalArea = filteredFarms.reduce((s, f) => s + Number(f.area_hectares ?? 0), 0);
  const totalReports = filteredReports.length;
  const avgFarmSize = totalFarms === 0 ? 0 : totalArea / totalFarms;

  const farmersByBarangay = useMemo(() => {
    const counts = new Map<string, number>();
    filteredFarmers.forEach((f) => {
      const key = (f.address ?? '').trim() || 'Address not recorded';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFarmers]);

  const areaByCrop = useMemo(() => {
    const sums = new Map<string, number>();
    filteredFarms.forEach((f) => {
      const key = (f.crop ?? '').trim() || 'Crop not recorded';
      sums.set(key, (sums.get(key) ?? 0) + Number(f.area_hectares ?? 0));
    });
    return [...sums.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFarms]);

  const cropMix = useMemo(() => {
    const counts = new Map<string, number>();
    filteredFarms.forEach((f) => {
      const key = (f.crop ?? '').trim() || 'Not recorded';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFarms]);

  const reportsByStatus = useMemo(() => {
    const counts = new Map<string, number>();
    filteredReports.forEach((r) => {
      const key =
        r.status === 'resolved' ? 'Resolved' : r.status === 'reviewed' ? 'Reviewed' : 'Pending';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return ['Pending', 'Reviewed', 'Resolved'].map((label) => ({
      label,
      value: counts.get(label) ?? 0,
    }));
  }, [filteredReports]);

  const farmersMonthly = useMemo(() => buildMonthlySeries(filteredFarmers), [filteredFarmers]);
  const farmsMonthly = useMemo(() => buildMonthlySeries(filteredFarms), [filteredFarms]);
  const reportsMonthly = useMemo(() => buildMonthlySeries(filteredReports), [filteredReports]);

  const sizeBuckets = useMemo(() => {
    let small = 0, medium = 0, large = 0;
    filteredFarms.forEach((f) => {
      const a = Number(f.area_hectares ?? 0);
      if (a <= 1) small += 1;
      else if (a <= 3) medium += 1;
      else large += 1;
    });
    return [
      { label: 'Small (≤1 ha)', value: small },
      { label: 'Medium (1–3 ha)', value: medium },
      { label: 'Large (>3 ha)', value: large },
    ];
  }, [filteredFarms]);

  const topBarangay = farmersByBarangay[0]?.label ?? '—';
  const topCrop = areaByCrop[0]?.label ?? '—';
  const resolvedCount = reportsByStatus.find((r) => r.label === 'Resolved')?.value ?? 0;
  const resolutionRate = totalReports === 0 ? 0 : Math.round((resolvedCount / totalReports) * 100);

  const farmersDelta = percentChange(farmersMonthly);
  const farmsDelta = percentChange(farmsMonthly);
  const reportsDelta = percentChange(reportsMonthly);

  const barangayMax = Math.max(...farmersByBarangay.map((r) => r.value), 1);
  const cropMax = Math.max(...areaByCrop.map((r) => r.value), 1);
  const cropMixTotal = cropMix.reduce((s, r) => s + r.value, 0);

  const hasAnyData = totalFarmers > 0 || totalFarms > 0 || totalReports > 0;

  return (
    <main className="analytics-page">
      {/* HEADER */}
      <header className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">PLAN AGRICULTURAL SUPPORT</p>
          <h1>Analytics</h1>
          <p>Live view of farmer coverage, crop area, and incoming farm reports.</p>
        </div>
        <span className="analytics-heading-icon">
          <TrendingUp size={23} />
        </span>
      </header>

      {!hasAnyData && !loading && (
        <section className="analytics-notice" role="status" aria-live="polite">
          <span className="analytics-notice-icon">
            <AlertCircle size={16} />
          </span>
          <div>
            <strong>No data yet</strong>
            <span>Analytics will appear here once farmers register and submit farm records.</span>
          </div>
        </section>
      )}

      {error && <p className="admin-error" role="alert">{error}</p>}

      {/* FILTERS */}
      <section aria-label="Analytics filters" className="analytics-filters">
        <label>
          <span><CalendarDays size={14} /> Date range</span>
          <select onChange={(e) => setDateRange(e.target.value)} value={dateRange}>
            {dateRanges.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span><MapPin size={14} /> Barangay</span>
          <select onChange={(e) => setBarangayFilter(e.target.value)} value={barangayFilter}>
            <option value={all}>All barangays</option>
            {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label>
          <span><Sprout size={14} /> Crop</span>
          <select onChange={(e) => setCropFilter(e.target.value)} value={cropFilter}>
            <option value={all}>All crops</option>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button className="analytics-reset" onClick={resetFilters} type="button">
          <RefreshCw size={13} /> Reset
        </button>
      </section>

      {/* KPI ROW */}
      <section aria-label="Filtered summary" className="analytics-metrics">
        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--green"><Users size={18} /></span>
          <div>
            <span>Farmers in registry</span>
            <strong>{loading ? '…' : totalFarmers}</strong>
            <small className="analytics-metric-trend">
              {farmersDelta === null ? (
                <span className="analytics-trend-flat">—</span>
              ) : farmersDelta >= 0 ? (
                <span className="analytics-trend-up"><ArrowUpRight size={12} /> +{farmersDelta}%</span>
              ) : (
                <span className="analytics-trend-down"><ArrowDownRight size={12} /> {farmersDelta}%</span>
              )}
            </small>
          </div>
        </article>

        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--blue"><Sprout size={18} /></span>
          <div>
            <span>Farm records</span>
            <strong>{loading ? '…' : totalFarms}</strong>
            <small className="analytics-metric-trend">
              {farmsDelta === null ? (
                <span className="analytics-trend-flat">—</span>
              ) : farmsDelta >= 0 ? (
                <span className="analytics-trend-up"><ArrowUpRight size={12} /> +{farmsDelta}%</span>
              ) : (
                <span className="analytics-trend-down"><ArrowDownRight size={12} /> {farmsDelta}%</span>
              )}
            </small>
          </div>
        </article>

        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--amber"><TrendingUp size={18} /></span>
          <div>
            <span>Planted area</span>
            <strong>{loading ? '…' : `${totalArea.toFixed(1)} ha`}</strong>
            <small>avg {avgFarmSize.toFixed(2)} ha / farm</small>
          </div>
        </article>

        <article className="analytics-metric">
          <span className="analytics-metric-icon analytics-metric-icon--purple"><FileText size={18} /></span>
          <div>
            <span>Farmer reports</span>
            <strong>{loading ? '…' : totalReports}</strong>
            <small className="analytics-metric-trend">
              {reportsDelta === null ? (
                <span className="analytics-trend-flat">{resolutionRate}% resolved</span>
              ) : reportsDelta >= 0 ? (
                <span className="analytics-trend-up"><ArrowUpRight size={12} /> +{reportsDelta}%</span>
              ) : (
                <span className="analytics-trend-down"><ArrowDownRight size={12} /> {reportsDelta}%</span>
              )}
            </small>
          </div>
        </article>
      </section>

      {/* INSIGHTS ROW */}
      <section aria-label="Quick insights" className="analytics-insights">
        <article className="analytics-insight">
          <span>Top barangay</span>
          <strong>{loading ? '…' : topBarangay}</strong>
          <small>{farmersByBarangay[0]?.value ?? 0} farmer{(farmersByBarangay[0]?.value ?? 0) === 1 ? '' : 's'}</small>
        </article>
        <article className="analytics-insight">
          <span>Top crop by area</span>
          <strong>{loading ? '…' : topCrop}</strong>
          <small>{(areaByCrop[0]?.value ?? 0).toFixed(1)} ha</small>
        </article>
        <article className="analytics-insight">
          <span>Average farm size</span>
          <strong>{loading ? '…' : `${avgFarmSize.toFixed(2)} ha`}</strong>
          <small>Across {totalFarms} farm{totalFarms === 1 ? '' : 's'}</small>
        </article>
        <article className="analytics-insight">
          <span>Report resolution rate</span>
          <strong>{loading ? '…' : `${resolutionRate}%`}</strong>
          <small>{resolvedCount} of {totalReports} resolved</small>
        </article>
      </section>

      {/* ROW A — Wide trend + barangay ranking */}
      <div className="analytics-row analytics-row--a">
        <section aria-label="New farmers per month" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>New farmers per month</h2>
              <p>Registrations over the last 6 months.</p>
            </div>
            <span className="analytics-unit-label">Farmers</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : farmersMonthly.every((m) => m.value === 0) ? (
            <p className="analytics-no-data">No registrations in the last 6 months.</p>
          ) : (
            <LineChart data={farmersMonthly} color="#16834d" />
          )}
        </section>

        <section aria-label="Farmers by barangay" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Farmers by barangay</h2>
              <p>Top barangays by registered farmers.</p>
            </div>
            <span className="analytics-unit-label">Farmers</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : farmersByBarangay.length === 0 ? (
            <p className="analytics-no-data">No farmers match these filters.</p>
          ) : (
            <ul className="analytics-bar-list">
              {farmersByBarangay.map((row) => (
                <li key={row.label}>
                  <span className="analytics-bar-label">{row.label}</span>
                  <span className="analytics-bar-track">
                    <span className="analytics-bar-fill" style={{ width: `${(row.value / barangayMax) * 100}%` }} />
                  </span>
                  <b>{row.value}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ROW B — Crop area + crop mix + donut */}
      <div className="analytics-row analytics-row--b">
        <section aria-label="Planted area by crop" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Planted area by crop</h2>
              <p>Total hectares per crop.</p>
            </div>
            <span className="analytics-unit-label">ha</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : areaByCrop.length === 0 ? (
            <p className="analytics-no-data">No farms match these filters.</p>
          ) : (
            <ul className="analytics-bar-list">
              {areaByCrop.map((row) => (
                <li key={row.label}>
                  <span className="analytics-bar-label">{row.label}</span>
                  <span className="analytics-bar-track">
                    <span className="analytics-bar-fill analytics-bar-fill--amber" style={{ width: `${(row.value / cropMax) * 100}%` }} />
                  </span>
                  <b>{row.value.toFixed(1)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Crop mix" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Crop mix</h2>
              <p>Share of farms per crop.</p>
            </div>
            <span className="analytics-unit-label">Farms</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : cropMix.length === 0 ? (
            <p className="analytics-no-data">No crops match these filters.</p>
          ) : (
            <ul className="analytics-pill-list">
              {cropMix.map((row) => {
                const pct = cropMixTotal === 0 ? 0 : Math.round((row.value / cropMixTotal) * 100);
                return (
                  <li key={row.label}>
                    <span className="analytics-pill">{row.label}</span>
                    <span className="analytics-pill-count">{row.value} <em>({pct}%)</em></span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label="Reports by status" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Reports by status</h2>
              <p>Distribution across the workflow.</p>
            </div>
            <span className="analytics-unit-label">Reports</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : totalReports === 0 ? (
            <p className="analytics-no-data">No reports match these filters.</p>
          ) : (
            <Donut
              data={reportsByStatus}
              colors={['#f4ad35', '#368bd6', '#16834d']}
              centerLabel="Total reports"
              centerValue={totalReports}
            />
          )}
        </section>
      </div>

      {/* ROW C — New farms + reports per month + size distribution */}
      <div className="analytics-row analytics-row--c">
        <section aria-label="New farms per month" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>New farms per month</h2>
              <p>Farm records added over the last 6 months.</p>
            </div>
            <span className="analytics-unit-label">Farms</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : farmsMonthly.every((m) => m.value === 0) ? (
            <p className="analytics-no-data">No farms added in the last 6 months.</p>
          ) : (
            <LineChart data={farmsMonthly} color="#368bd6" />
          )}
        </section>

        <section aria-label="Reports per month" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Reports per month</h2>
              <p>Reports submitted in the last 6 months.</p>
            </div>
            <span className="analytics-unit-label">Reports</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : reportsMonthly.every((m) => m.value === 0) ? (
            <p className="analytics-no-data">No reports in the last 6 months.</p>
          ) : (
            <LineChart data={reportsMonthly} color="#7d5fa4" />
          )}
        </section>

        <section aria-label="Farm size distribution" className="analytics-card">
          <header className="analytics-card-heading">
            <div>
              <h2>Farm size distribution</h2>
              <p>Farms per size bracket.</p>
            </div>
            <span className="analytics-unit-label">Farms</span>
          </header>
          {loading ? (
            <p className="analytics-no-data">Loading…</p>
          ) : totalFarms === 0 ? (
            <p className="analytics-no-data">No farms match these filters.</p>
          ) : (
            <ul className="analytics-bar-list">
              {sizeBuckets.map((row) => {
                const total = sizeBuckets.reduce((s, b) => s + b.value, 0) || 1;
                return (
                  <li key={row.label}>
                    <span className="analytics-bar-label">{row.label}</span>
                    <span className="analytics-bar-track">
                      <span className="analytics-bar-fill analytics-bar-fill--blue" style={{ width: `${(row.value / total) * 100}%` }} />
                    </span>
                    <b>{row.value}</b>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <footer className="analytics-data-note">
        <span>Data source: live Supabase records (farmers, farms, pest_reports).</span>
        <span>
          {loading ? 'Loading…' : `Showing ${totalFarmers} farmers · ${totalFarms} farms · ${totalReports} reports`}
        </span>
      </footer>
    </main>
  );
};

export default AdminAnalytics;