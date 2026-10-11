import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  Filter,
  MapPin,
  Search,
  Sprout,
  ZoomIn,
  X,
} from 'lucide-react';
import '../css/AdminReports.css';
import { supabase } from '../supabase/supabase-client';

// ---------- types ----------

type ReportStatus = 'pending' | 'reviewed' | 'resolved';

interface FollowUp {
  id: string;
  date: string;
  author: string;
  action: string;
}

interface ReportRow {
  id: string;
  farmer_id: string;
  note: string | null;
  image_path: string | null;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
}

interface FollowUpRow {
  id: string;
  report_id: string;
  action: string;
  author: string;
  created_at: string;
}

interface EnrichedReport {
  id: string;
  farmerId: string;
  farmerName: string;
  barangay: string;
  date: string;
  status: ReportStatus;
  description: string;
  notes: string;
  imagePath: string | null;
  imageUrl: string | null;
  followUps: FollowUp[];
}

// ---------- constants ----------

const statuses: ReportStatus[] = ['pending', 'reviewed', 'resolved'];
const allFilter = 'All';

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
};

function statusClass(status: ReportStatus): string {
  return `report-status report-status--${status}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
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

function isDirectUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw) || /^data:/i.test(raw);
}

async function signPestUrls(
  paths: string[],
): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter((p) => p && !isDirectUrl(p))));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from('pest-reports')
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

function resolveImageUrl(
  raw: string | null,
  signed: Record<string, string>,
): string | null {
  if (!raw) return null;
  if (isDirectUrl(raw)) return raw;
  return signed[raw] ?? null;
}

// ---------- details modal ----------

interface ReportDetailsProps {
  report: EnrichedReport;
  saving: boolean;
  onClose: () => void;
  onSaveReview: (status: ReportStatus, adminNote: string) => Promise<void>;
  onAddFollowUp: (action: string) => Promise<void>;
}

function ReportDetails({
  report,
  saving,
  onClose,
  onSaveReview,
  onAddFollowUp,
}: ReportDetailsProps) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [adminNote, setAdminNote] = useState(report.notes);
  const [action, setAction] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const saveReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    await onSaveReview(status, adminNote.trim());
    setReviewSaved(true);
  };

  const addFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = action.trim();
    if (!trimmed || saving) return;
    await onAddFollowUp(trimmed);
    setAction('');
  };

  return (
    <div className="reports-dialog-backdrop" onMouseDown={saving ? undefined : onClose}>
      <section
        aria-labelledby="report-detail-title"
        aria-modal="true"
        className="reports-detail-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="reports-detail-header">
          <div>
            <p className="reports-eyebrow">FARMER-SUBMITTED ISSUE</p>
            <h2 id="report-detail-title">
              {report.description
                ? report.description.slice(0, 60)
                : 'Pest / disease report'}
            </h2>
            <p className="reports-detail-id">
              {report.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            aria-label="Close report details"
            className="reports-icon-button"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <div className="reports-detail-tags">
          <span className={statusClass(report.status)}>
            {STATUS_LABELS[report.status]}
          </span>
        </div>

        <section className="reports-detail-section">
          <h3>Report details</h3>
          <div className="reports-detail-facts">
            <div>
              <span>Farmer</span>
              <strong>
                {report.farmerName} · {report.farmerId.slice(0, 8).toUpperCase()}
              </strong>
            </div>
            {report.barangay && (
              <div>
                <span>Barangay</span>
                <strong>{report.barangay}</strong>
              </div>
            )}
            <div>
              <span>Submitted</span>
              <strong>{formatDate(report.date)}</strong>
            </div>
            <div>
              <span>Photo</span>
              <strong>{report.imagePath ? 'Attached' : 'None'}</strong>
            </div>
          </div>

          {report.description && (
            <div className="reports-description">
              <span>Farmer's note</span>
              <p>{report.description}</p>
            </div>
          )}

          <div className="reports-photo-section">
            <div className="reports-photo-heading">
              <h4>Report photo</h4>
              <span>{report.imageUrl ? '1 image' : '0 images'}</span>
            </div>

            {report.imageUrl ? (
              <div className="reports-photo-gallery">
                <button
                  aria-label="View uploaded report photo"
                  className="reports-photo-card"
                  onClick={() => setPreviewOpen(true)}
                  type="button"
                >
                  <img
                    src={report.imageUrl}
                    alt="Farmer-submitted report"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="reports-photo-zoom">
                    <ZoomIn size={16} /> View image
                  </span>
                </button>
              </div>
            ) : (
              <p className="reports-no-photos">
                No image was attached to this report.
              </p>
            )}
          </div>

          {previewOpen && report.imageUrl && (
            <div
              className="reports-photo-lightbox"
              onMouseDown={() => setPreviewOpen(false)}
            >
              <section
                aria-label="Image preview"
                aria-modal="true"
                className="reports-photo-lightbox-content"
                onMouseDown={(event) => event.stopPropagation()}
                role="dialog"
              >
                <button
                  aria-label="Close image preview"
                  className="reports-icon-button reports-photo-close"
                  onClick={() => setPreviewOpen(false)}
                  type="button"
                >
                  <X size={19} />
                </button>
                <img src={report.imageUrl} alt="Farmer-submitted report" />
              </section>
            </div>
          )}
        </section>

        <form className="reports-review-form" onSubmit={saveReview}>
          <h3>Assignment &amp; status</h3>
          <div className="reports-review-controls">
            <label>
              Status
              <select
                onChange={(event) => {
                  setStatus(event.target.value as ReportStatus);
                  setReviewSaved(false);
                }}
                value={status}
                disabled={saving}
              >
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reviewer note
              <input
                onChange={(event) => {
                  setAdminNote(event.target.value);
                  setReviewSaved(false);
                }}
                placeholder="Add a short note for the farmer"
                value={adminNote}
                disabled={saving}
              />
            </label>
          </div>
          <div className="reports-form-actions">
            {reviewSaved && (
              <span className="reports-saved-message">
                <Check size={14} /> Review updated
              </span>
            )}
            <button
              className="reports-button reports-button--primary"
              type="submit"
              disabled={saving}
            >
              <Check size={15} /> {saving ? 'Saving…' : 'Save review'}
            </button>
          </div>
        </form>

        <form className="reports-followup-form" onSubmit={addFollowUp}>
          <label htmlFor="report-action">Record an action or follow-up</label>
          <textarea
            id="report-action"
            onChange={(event) => setAction(event.target.value)}
            placeholder="Describe the action taken or next follow-up…"
            rows={3}
            value={action}
            disabled={saving}
          />
          <div className="reports-form-actions">
            <button
              className="reports-button reports-button--secondary"
              disabled={!action.trim() || saving}
              type="submit"
            >
              <ClipboardList size={15} /> Record action
            </button>
          </div>
        </form>

        <section className="reports-detail-section reports-history-section">
          <h3>
            Follow-up history <span>{report.followUps.length}</span>
          </h3>
          {report.followUps.length ? (
            <ol className="reports-timeline">
              {report.followUps.map((f) => (
                <li key={f.id}>
                  <span className="reports-timeline-marker" />
                  <div>
                    <strong>{f.action}</strong>
                    <span>
                      {formatDateTime(f.date)} · {f.author}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports-no-history">
              No follow-up actions recorded yet.
            </p>
          )}
          {report.notes && (
            <p className="reports-existing-notes">
              <strong>Reviewer note:</strong> {report.notes}
            </p>
          )}
        </section>
      </section>
    </div>
  );
}

// ---------- main ----------

const AdminReports = () => {
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [reportsRes, farmersRes, followUpsRes] = await Promise.all([
      supabase
        .from('pest_reports')
        .select(
          'id, farmer_id, note, image_path, status, admin_note, created_at, reviewed_at',
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('farmers')
        .select('id, full_name, address')
        .eq('role', 'farmer'),

      supabase
        .from('report_followups')
        .select('id, report_id, action, author, created_at')
        .order('created_at', { ascending: true }),
    ]);

    const firstError =
      reportsRes.error || farmersRes.error || followUpsRes.error;

    if (firstError) {
      setError(firstError.message);
      setReports([]);
      setImageUrls({});
      setLoading(false);
      return;
    }

    const farmerById = new Map<string, FarmerRow>();
    for (const f of (farmersRes.data ?? []) as FarmerRow[]) {
      farmerById.set(f.id, f);
    }

    const followUpsByReport = new Map<string, FollowUp[]>();
    for (const row of (followUpsRes.data ?? []) as FollowUpRow[]) {
      const list = followUpsByReport.get(row.report_id) ?? [];
      list.push({
        id: row.id,
        action: row.action,
        author: row.author,
        date: row.created_at,
      });
      followUpsByReport.set(row.report_id, list);
    }

    const rows = (reportsRes.data ?? []) as ReportRow[];

    const mapped: EnrichedReport[] = rows.map((row) => {
      const farmer = farmerById.get(row.farmer_id);
      return {
        id: row.id,
        farmerId: row.farmer_id,
        farmerName: farmer?.full_name ?? 'Unknown farmer',
        barangay: farmer?.address ?? '',
        date: row.created_at,
        status: row.status,
        description: row.note ?? '',
        notes: row.admin_note ?? '',
        imagePath: row.image_path,
        imageUrl: null,
        followUps: followUpsByReport.get(row.id) ?? [],
      };
    });

    setReports(mapped);

    const signed = await signPestUrls(
      rows.map((r) => r.image_path ?? ''),
    );
    setImageUrls(signed);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  const resolvedSelected: EnrichedReport | null = selectedReport
    ? {
        ...selectedReport,
        imageUrl: resolveImageUrl(selectedReport.imagePath, imageUrls),
      }
    : null;

  const barangays = useMemo(
    () => [...new Set(reports.map((r) => r.barangay).filter(Boolean))].sort(),
    [reports],
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.id,
          report.farmerId,
          report.farmerName,
          report.barangay,
          report.description,
        ].some((v) => (v ?? '').toLowerCase().includes(query));

      const dayOnly = report.date.slice(0, 10);
      return (
        matchesSearch &&
        (statusFilter === allFilter || report.status === statusFilter) &&
        (barangayFilter === allFilter || report.barangay === barangayFilter) &&
        (!dateFrom || dayOnly >= dateFrom) &&
        (!dateTo || dayOnly <= dateTo)
      );
    });
  }, [barangayFilter, dateFrom, dateTo, reports, search, statusFilter]);

  const openCount = reports.filter((r) => r.status === 'pending').length;
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  const saveReview = async (
    id: string,
    status: ReportStatus,
    adminNote: string,
  ) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('pest_reports')
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    await load();
  };

  const addFollowUp = async (id: string, action: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();

    const { error: dbError } = await supabase
      .from('report_followups')
      .insert({
        report_id: id,
        action,
        author:
          userData?.user?.email ?? userData?.user?.id?.slice(0, 8) ?? 'admin',
      });

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    await load();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(allFilter);
    setBarangayFilter(allFilter);
    setDateFrom('');
    setDateTo('');
  };

  return (
    <main className="reports-page">
      <header className="reports-page-heading">
        <div>
          <p className="reports-eyebrow">FARMER SUPPORT &amp; FOLLOW-UP</p>
          <h1>Reports</h1>
          <p className="reports-page-description">
            Review farmer-submitted farm problems and keep an action history.
          </p>
        </div>
        <div aria-hidden="true" className="reports-page-icon">
          <FileText size={22} />
        </div>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <section aria-label="Report queue summary" className="reports-overview">
        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--amber">
            <AlertTriangle size={18} />
          </span>
          <div>
            <span>Needs review</span>
            <strong>{loading ? '—' : openCount}</strong>
            <small>pending reports</small>
          </div>
        </article>

        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--red">
            <ClipboardList size={18} />
          </span>
          <div>
            <span>Under review</span>
            <strong>{loading ? '—' : reviewedCount}</strong>
            <small>in progress</small>
          </div>
        </article>

        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--green">
            <Check size={18} />
          </span>
          <div>
            <span>Resolved</span>
            <strong>{loading ? '—' : resolvedCount}</strong>
            <small>closed issues</small>
          </div>
        </article>

        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--blue">
            <FileText size={18} />
          </span>
          <div>
            <span>All reports</span>
            <strong>{loading ? '—' : reports.length}</strong>
            <small>total submitted</small>
          </div>
        </article>
      </section>

      <section aria-label="Farmer report queue" className="reports-queue">
        <header className="reports-queue-header">
          <div>
            <h2>Submitted issues</h2>
            <p>
              {loading
                ? 'Loading…'
                : `${filteredReports.length} of ${reports.length} reports`}
            </p>
          </div>
          <div className="reports-queue-caption">
            <Filter size={15} /> Review queue
          </div>
        </header>

        <div className="reports-filters">
          <label className="reports-search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label="Search reports, farmers, or barangays"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report, farmer, barangay..."
              value={search}
            />
          </label>

          <label className="reports-filter-control">
            <span>Barangay</span>
            <div className="reports-select-wrap">
              <select
                onChange={(event) => setBarangayFilter(event.target.value)}
                value={barangayFilter}
              >
                <option value={allFilter}>All barangays</option>
                {barangays.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>

          <label className="reports-filter-control">
            <span>Status</span>
            <div className="reports-select-wrap">
              <select
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value={allFilter}>All statuses</option>
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>

          <label className="reports-filter-control">
            <span>From date</span>
            <input
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </label>

          <label className="reports-filter-control">
            <span>To date</span>
            <input
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </label>

          <button
            className="reports-clear-filters"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        </div>

        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Farmer</th>
                <th scope="col">Barangay</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="reports-visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="reports-empty" colSpan={6}>
                    Loading reports…
                  </td>
                </tr>
              )}

              {!loading && filteredReports.length === 0 && (
                <tr>
                  <td className="reports-empty" colSpan={6}>
                    {reports.length === 0
                      ? 'No reports yet.'
                      : 'No reports match these filters.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="reports-report-identity">
                        <span className="reports-report-icon">
                          <Sprout size={15} />
                        </span>
                        <span>
                          <strong>
                            {report.description
                              ? report.description.slice(0, 40)
                              : 'Pest / disease report'}
                          </strong>
                          <small>{report.id.slice(0, 8).toUpperCase()}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="reports-farmer-cell">
                        <strong>{report.farmerName}</strong>
                        <small>{report.farmerId.slice(0, 8).toUpperCase()}</small>
                      </span>
                    </td>
                    <td>
                      <span className="reports-location-cell">
                        <MapPin size={13} />
                        {report.barangay || '—'}
                      </span>
                    </td>
                    <td>{formatDate(report.date)}</td>
                    <td>
                      <span className={statusClass(report.status)}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="reports-view-button"
                        onClick={() => setSelectedReportId(report.id)}
                        type="button"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="reports-source-note">
        Every row comes from a pest report a farmer submitted through the app.
        Confirm actions with the farmer and a qualified staff member before
        marking a report as resolved.
      </p>

      {resolvedSelected && (
        <ReportDetails
          key={resolvedSelected.id}
          report={resolvedSelected}
          saving={saving}
          onAddFollowUp={(action) => addFollowUp(resolvedSelected.id, action)}
          onClose={() => {
            if (saving) return;
            setSelectedReportId(null);
          }}
          onSaveReview={(status, adminNote) =>
            saveReview(resolvedSelected.id, status, adminNote)
          }
        />
      )}
    </main>
  );
};

export default AdminReports;