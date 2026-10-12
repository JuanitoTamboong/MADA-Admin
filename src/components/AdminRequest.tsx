import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Inbox,
  MapPin,
  Search,
  Send,
  X,
} from 'lucide-react';
import '../css/AdminRequest.css';

import {
  fetchAllAssistanceRequests,
  setAssistanceRequestStatus,
} from '../supabase/assistance';
import type {
  AdminAssistanceRequest,
  AssistanceCategory,
  AssistanceStatus,
} from '../supabase/assistance';

const allFilter = 'All';

const statuses: AssistanceStatus[] = [
  'Pending',
  'Approved',
  'In Progress',
  'Completed',
  'Rejected',
];

const categories: AssistanceCategory[] = [
  'Seeds',
  'Fertilizer',
  'Technical Assistance',
  'Pest Inspection',
  'Financial Subsidy',
];

const statusClass = (s: AssistanceStatus) =>
  `admin-req-status admin-req-status--${s
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function preview(text: string, max = 90): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + '…';
}

const AdminRequest = () => {
  const [requests, setRequests] = useState<AdminAssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [categoryFilter, setCategoryFilter] = useState(allFilter);

  const [selected, setSelected] = useState<AdminAssistanceRequest | null>(null);

  useEffect(() => {
    let alive = true;

    fetchAllAssistanceRequests()
      .then((rows) => {
        if (!alive) return;
        setRequests(rows);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesSearch =
        !needle ||
        `${r.farmerName} ${r.farmerBarangay} ${r.category} ${r.notes ?? ''}`
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        statusFilter === allFilter || r.status === statusFilter;
      const matchesCategory =
        categoryFilter === allFilter || r.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [requests, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    const c: Record<'total' | AssistanceStatus, number> = {
      total: requests.length,
      Pending: 0,
      Approved: 0,
      'In Progress': 0,
      Completed: 0,
      Rejected: 0,
    };
    for (const r of requests) c[r.status] += 1;
    return c;
  }, [requests]);

  const handleStatusChange = async (
    id: string,
    next: AssistanceStatus,
  ) => {
    if (savingId) return;
    setSavingId(id);
    try {
      await setAssistanceRequestStatus(id, next);
      setRequests((current) =>
        current.map((r) => (r.id === id ? { ...r, status: next } : r)),
      );
      if (selected?.id === id) {
        setSelected({ ...selected, status: next });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="admin-requests-page">
      <header className="admin-requests-header">
        <div>
          <p className="admin-requests-eyebrow">FARMER SUPPORT</p>
          <h1>Assistance Requests</h1>
          <p>Review, approve, and track requests submitted by farmers.</p>
        </div>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <section className="admin-requests-summary">
        <article className="admin-summary-card">
          <Inbox size={18} />
          <div>
            <span>Total</span>
            <strong>{counts.total}</strong>
          </div>
        </article>
        <article className="admin-summary-card admin-summary-card--amber">
          <Clock size={18} />
          <div>
            <span>Pending</span>
            <strong>{counts.Pending}</strong>
          </div>
        </article>
        <article className="admin-summary-card admin-summary-card--blue">
          <Filter size={18} />
          <div>
            <span>In Progress</span>
            <strong>{counts['In Progress']}</strong>
          </div>
        </article>
        <article className="admin-summary-card admin-summary-card--green">
          <CheckCircle2 size={18} />
          <div>
            <span>Completed</span>
            <strong>{counts.Completed}</strong>
          </div>
        </article>
      </section>

      <section className="admin-requests-toolbar">
        <label className="admin-requests-search">
          <Search size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer, note, or category"
          />
        </label>

        <label className="admin-requests-filter">
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value={allFilter}>All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>

        <label className="admin-requests-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value={allFilter}>All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
      </section>

      <section className="admin-requests-table-wrap">
        {loading ? (
          <p className="admin-requests-empty">Loading requests…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-requests-empty">
            {requests.length === 0
              ? 'No assistance requests yet.'
              : 'No requests match these filters.'}
          </p>
        ) : (
          <table className="admin-requests-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="admin-req-farmer">
                      <strong>{r.farmerName}</strong>
                      {r.farmerBarangay && (
                        <span className="admin-req-barangay">
                          <MapPin size={11} /> {r.farmerBarangay}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span>{r.category}</span>
                    {r.notes && (
                      <span className="admin-req-note-preview">
                        {preview(r.notes)}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="admin-req-actions">
                    <button
                      className="admin-req-text-btn"
                      onClick={() => setSelected(r)}
                      type="button"
                    >
                      View
                    </button>
                    {r.status === 'Pending' && (
                      <button
                        className="admin-req-btn admin-req-btn--primary"
                        onClick={() => handleStatusChange(r.id, 'Approved')}
                        disabled={savingId === r.id}
                        type="button"
                      >
                        <Send size={13} />
                        {savingId === r.id ? 'Saving…' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selected && (
        <div
          className="admin-req-modal-backdrop"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Request details"
        >
          <section
            className="admin-req-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-req-modal-header">
              <div>
                <p className="admin-requests-eyebrow">REQUEST</p>
                <h2>{selected.category}</h2>
              </div>
              <button
                className="admin-req-modal-close"
                onClick={() => setSelected(null)}
                type="button"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <dl className="admin-req-detail-grid">
              <div>
                <dt>Farmer</dt>
                <dd>{selected.farmerName}</dd>
              </div>
              <div>
                <dt>Barangay</dt>
                <dd>{selected.farmerBarangay || '—'}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={statusClass(selected.status)}>
                    {selected.status}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="admin-req-block">
              <h3>Formal request letter</h3>
              <pre className="admin-req-letter">
                {selected.notes?.trim() || 'No notes provided.'}
              </pre>
            </div>

            {selected.adminNote && (
              <div className="admin-req-block">
                <h3>Admin note</h3>
                <p>{selected.adminNote}</p>
              </div>
            )}

            <div className="admin-req-block">
              <h3>Change status</h3>
              <div className="admin-req-status-picker">
                {statuses.map((s) => (
                  <button
                    key={s}
                    className={`admin-req-status-btn ${
                      selected.status === s ? 'is-active' : ''
                    }`}
                    onClick={() => handleStatusChange(selected.id, s)}
                    disabled={savingId === selected.id}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default AdminRequest;