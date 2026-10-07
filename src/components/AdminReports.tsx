import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  Filter,
  MapPin,
  MessageSquare,
  Search,
  Sprout,
  ZoomIn,
  X,
} from 'lucide-react';
import sampleFarmPhoto from '../assets/images/admin-farmers.jpg';
import '../css/AdminReports.css';

type ReportStatus =
  | 'New'
  | 'Under Review'
  | 'Field Visit Needed'
  | 'Advice Sent'
  | 'Resolved'
  | 'Closed';
type ReportPriority = 'High' | 'Medium' | 'Low';

interface ReportFollowUp {
  date: string;
  author: string;
  action: string;
}

interface ReportPhoto {
  src: string;
  label: string;
  isSample?: boolean;
}

interface FarmerReport {
  id: string;
  farmerId: string;
  farmerName: string;
  farm: string;
  barangay: string;
  type: string;
  date: string;
  priority: ReportPriority;
  status: ReportStatus;
  crop: string;
  description: string;
  assignedTo: string;
  notes: string;
  followUps: ReportFollowUp[];
  photos: ReportPhoto[];
  suggestion?: string;
}

const initialReports: FarmerReport[] = [
  {
    id: 'R-2026-014',
    farmerId: 'F-0003',
    farmerName: 'Sample Farmer 003',
    farm: 'Sample Corn Farm',
    barangay: 'Sample Barangay A',
    type: 'Pest/disease symptoms',
    date: '2026-10-05',
    priority: 'High',
    status: 'New',
    crop: 'Corn',
    description: 'Sample report: the farmer noticed leaf damage on part of the corn crop and requested an assessment.',
    assignedTo: 'Unassigned',
    notes: '',
    followUps: [],
    photos: [{ src: sampleFarmPhoto, label: 'Illustrative farm photo', isSample: true }],
    suggestion: 'Demo AI suggestion: possible leaf-feeding pest. This is unverified and must not be treated as a diagnosis.',
  },
  {
    id: 'R-2026-013',
    farmerId: 'F-0001',
    farmerName: 'Sample Farmer 001',
    farm: 'Sample Rice Farm',
    barangay: 'Sample Barangay A',
    type: 'Water shortage',
    date: '2026-10-03',
    priority: 'High',
    status: 'Field Visit Needed',
    crop: 'Rice',
    description: 'Sample report: water levels in the field have dropped. The farmer asked staff to check irrigation access.',
    assignedTo: 'Agriculture Officer',
    notes: 'Coordinate a field assessment with the local agriculture office.',
    followUps: [{ date: '2026-10-04', author: 'Sample Admin', action: 'Requested a field visit to verify water availability.' }],
    photos: [],
  },
  {
    id: 'R-2026-012',
    farmerId: 'F-0005',
    farmerName: 'Sample Farmer 005',
    farm: 'Sample Coconut Farm',
    barangay: 'Sample Barangay B',
    type: 'Soil erosion',
    date: '2026-09-29',
    priority: 'Medium',
    status: 'Under Review',
    crop: 'Coconut',
    description: 'Sample report: runoff has exposed soil along one section of the farm after heavy rain.',
    assignedTo: 'Field Staff 01',
    notes: '',
    followUps: [{ date: '2026-09-30', author: 'Sample Admin', action: 'Assigned for initial review.' }],
    photos: [],
  },
  {
    id: 'R-2026-011',
    farmerId: 'F-0002',
    farmerName: 'Sample Farmer 002',
    farm: 'Sample Coconut Farm',
    barangay: 'Sample Barangay B',
    type: 'Other farm problem',
    date: '2026-09-22',
    priority: 'Low',
    status: 'Advice Sent',
    crop: 'Coconut',
    description: 'Sample report: the farmer requested general guidance about maintaining young coconut plants.',
    assignedTo: 'Agriculture Officer',
    notes: 'General advice shared; check back next month.',
    followUps: [{ date: '2026-09-24', author: 'Sample Admin', action: 'Shared general care guidance and scheduled a follow-up.' }],
    photos: [],
  },
  {
    id: 'R-2026-010',
    farmerId: 'F-0003',
    farmerName: 'Sample Farmer 003',
    farm: 'Sample Vegetable Farm',
    barangay: 'Sample Barangay A',
    type: 'Pest/disease symptoms',
    date: '2026-09-18',
    priority: 'Medium',
    status: 'Resolved',
    crop: 'Vegetables',
    description: 'Sample report: discoloration was seen on a small number of vegetable leaves.',
    assignedTo: 'Agriculture Officer',
    notes: 'Field review completed. Cause was not recorded as a confirmed diagnosis.',
    followUps: [{ date: '2026-09-20', author: 'Sample Admin', action: 'Completed a field review and shared general next steps.' }],
    photos: [],
  },
  {
    id: 'R-2026-009',
    farmerId: 'F-0004',
    farmerName: 'Sample Farmer 004',
    farm: 'Sample Mixed Farm',
    barangay: 'Sample Barangay C',
    type: 'Water shortage',
    date: '2026-08-30',
    priority: 'Low',
    status: 'Closed',
    crop: 'Rice',
    description: 'Sample report: a temporary water supply interruption was reported.',
    assignedTo: 'Field Staff 01',
    notes: 'Farmer confirmed the interruption ended.',
    followUps: [{ date: '2026-09-02', author: 'Sample Admin', action: 'Confirmed the issue had ended and closed the report.' }],
    photos: [],
  },
];

const statuses: ReportStatus[] = [
  'New',
  'Under Review',
  'Field Visit Needed',
  'Advice Sent',
  'Resolved',
  'Closed',
];
const reportTypes = [...new Set(initialReports.map((report) => report.type))];
const barangays = [...new Set(initialReports.map((report) => report.barangay))];
const crops = [...new Set(initialReports.map((report) => report.crop))];
const staffOptions = ['Unassigned', 'Agriculture Officer', 'Field Staff 01', 'Field Staff 02'];
const allFilter = 'All';

function displayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusClass(status: ReportStatus) {
  return `report-status report-status--${status.toLowerCase().replaceAll(' ', '-')}`;
}

interface ReportDetailsProps {
  report: FarmerReport;
  relatedCount: number;
  onClose: () => void;
  onSaveReview: (status: ReportStatus, assignedTo: string) => void;
  onAddFollowUp: (action: string) => void;
}

function ReportDetails({ report, relatedCount, onClose, onSaveReview, onAddFollowUp }: ReportDetailsProps) {
  const [status, setStatus] = useState(report.status);
  const [assignedTo, setAssignedTo] = useState(report.assignedTo);
  const [action, setAction] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<ReportPhoto | null>(null);

  const saveReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveReview(status, assignedTo);
    setReviewSaved(true);
  };

  const addFollowUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedAction = action.trim();
    if (!trimmedAction) return;
    onAddFollowUp(trimmedAction);
    setAction('');
  };

  return (
    <div className="reports-dialog-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="report-detail-title"
        aria-modal="true"
        className="reports-detail-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="reports-detail-header">
          <div>
            <p className="reports-eyebrow">FARMER-SUBMITTED ISSUE · SAMPLE</p>
            <h2 id="report-detail-title">{report.type}</h2>
            <p className="reports-detail-id">{report.id}</p>
          </div>
          <button aria-label="Close report details" className="reports-icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </header>

        <div className="reports-detail-tags">
          <span className={`report-priority report-priority--${report.priority.toLowerCase()}`}>{report.priority} priority</span>
          <span className={statusClass(report.status)}>{report.status}</span>
          {relatedCount > 1 && <span className="reports-related-tag">{relatedCount} similar sample reports in this barangay/crop</span>}
        </div>

        <section className="reports-detail-section">
          <h3>Report details</h3>
          <div className="reports-detail-facts">
            <div><span>Farmer</span><strong>{report.farmerName} · {report.farmerId}</strong></div>
            <div><span>Farm</span><strong>{report.farm}</strong></div>
            <div><span>Barangay</span><strong>{report.barangay}</strong></div>
            <div><span>Affected crop</span><strong>{report.crop}</strong></div>
            <div><span>Submitted</span><strong>{displayDate(report.date)}</strong></div>
            <div><span>Photos</span><strong>{report.photos.length ? `${report.photos.length} attached` : 'No photos supplied'}</strong></div>
          </div>
          <div className="reports-description">
            <span>Farmer's description</span>
            <p>{report.description}</p>
          </div>
          <div className="reports-photo-section">
            <div className="reports-photo-heading">
              <h4>Report photos</h4>
              <span>{report.photos.length} {report.photos.length === 1 ? 'image' : 'images'}</span>
            </div>
            {report.photos.length ? (
              <div className="reports-photo-gallery">
                {report.photos.map((photo) => (
                  <button
                    aria-label={`View ${photo.label}`}
                    className="reports-photo-card"
                    key={photo.src}
                    onClick={() => setPreviewPhoto(photo)}
                    type="button"
                  >
                    <img alt={photo.label} src={photo.src} />
                    <span className="reports-photo-zoom"><ZoomIn size={16} /> View image</span>
                    <span className="reports-photo-caption">
                      {photo.label}
                      {photo.isSample && <strong>ILLUSTRATIVE SAMPLE · NOT EVIDENCE</strong>}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="reports-no-photos">No images were attached to this report.</p>
            )}
          </div>
          {report.suggestion && (
            <div className="reports-ai-warning">
              <AlertTriangle size={17} />
              <p><strong>Unverified suggestion only</strong>{report.suggestion}</p>
            </div>
          )}
          <div className="reports-contact-note">
            <MessageSquare size={16} />
            <p>Contact is unavailable: this sample record has no verified phone number or approved contact channel.</p>
            <button className="reports-small-button" disabled title="No verified contact channel is available">
              Contact farmer
            </button>
          </div>
        </section>

        <form className="reports-review-form" onSubmit={saveReview}>
          <h3>Assignment &amp; status</h3>
          <div className="reports-review-controls">
            <label>
              Assigned staff
              <select onChange={(event) => { setAssignedTo(event.target.value); setReviewSaved(false); }} value={assignedTo}>
                {staffOptions.map((staff) => <option key={staff} value={staff}>{staff}</option>)}
              </select>
            </label>
            <label>
              Status
              <select onChange={(event) => { setStatus(event.target.value as ReportStatus); setReviewSaved(false); }} value={status}>
                {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="reports-form-actions">
            {reviewSaved && <span className="reports-saved-message"><Check size={14} /> Review updated</span>}
            <button className="reports-button reports-button--primary" type="submit">
              <Check size={15} /> Save review
            </button>
          </div>
        </form>

        <form className="reports-followup-form" onSubmit={addFollowUp}>
          <label htmlFor="report-action">Record an action or follow-up</label>
          <textarea
            id="report-action"
            onChange={(event) => setAction(event.target.value)}
            placeholder="Describe the action taken, advice shared, or next follow-up..."
            rows={3}
            value={action}
          />
          <div className="reports-form-actions">
            <span className="reports-form-hint">Entries are retained in this session only.</span>
            <button className="reports-button reports-button--secondary" disabled={!action.trim()} type="submit">
              <ClipboardList size={15} /> Record action
            </button>
          </div>
        </form>

        <section className="reports-detail-section reports-history-section">
          <h3>Follow-up history <span>{report.followUps.length}</span></h3>
          {report.followUps.length ? (
            <ol className="reports-timeline">
              {[...report.followUps].reverse().map((followUp, index) => (
                <li key={`${followUp.date}-${index}`}>
                  <span className="reports-timeline-marker" />
                  <div><strong>{followUp.action}</strong><span>{displayDate(followUp.date)} · {followUp.author}</span></div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports-no-history">No follow-up actions recorded yet.</p>
          )}
          {report.notes && <p className="reports-existing-notes"><strong>Reviewer notes:</strong> {report.notes}</p>}
        </section>
        {previewPhoto && (
          <div className="reports-photo-lightbox" onMouseDown={() => setPreviewPhoto(null)}>
            <section
              aria-label={`Image preview: ${previewPhoto.label}`}
              aria-modal="true"
              className="reports-photo-lightbox-content"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <button
                aria-label="Close image preview"
                className="reports-icon-button reports-photo-close"
                onClick={() => setPreviewPhoto(null)}
                type="button"
              >
                <X size={19} />
              </button>
              <img alt={previewPhoto.label} src={previewPhoto.src} />
              <p>{previewPhoto.label}{previewPhoto.isSample ? ' — illustrative sample, not farmer-uploaded evidence.' : ''}</p>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

const AdminReports = () => {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(allFilter);
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports
      .filter((report) => {
        const matchesSearch = !query || [
          report.id,
          report.farmerId,
          report.farmerName,
          report.farm,
          report.barangay,
          report.type,
        ].some((value) => value.toLowerCase().includes(query));
        return (
          matchesSearch &&
          (typeFilter === allFilter || report.type === typeFilter) &&
          (barangayFilter === allFilter || report.barangay === barangayFilter) &&
          (cropFilter === allFilter || report.crop === cropFilter) &&
          (statusFilter === allFilter || report.status === statusFilter) &&
          (!dateFrom || report.date >= dateFrom) &&
          (!dateTo || report.date <= dateTo)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [barangayFilter, cropFilter, dateFrom, dateTo, reports, search, statusFilter, typeFilter]);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null;
  const openCount = reports.filter((report) => ['New', 'Under Review', 'Field Visit Needed'].includes(report.status)).length;
  const highPriorityCount = reports.filter((report) => report.priority === 'High' && !['Resolved', 'Closed'].includes(report.status)).length;
  const resolvedCount = reports.filter((report) => report.status === 'Resolved' || report.status === 'Closed').length;

  const updateReview = (id: string, status: ReportStatus, assignedTo: string) => {
    setReports((current) => current.map((report) => {
      if (report.id !== id) return report;
      const changes: string[] = [];
      if (report.status !== status) changes.push(`Status changed from ${report.status} to ${status}.`);
      if (report.assignedTo !== assignedTo) changes.push(`Assignment changed to ${assignedTo}.`);
      return {
        ...report,
        status,
        assignedTo,
        followUps: changes.length
          ? [...report.followUps, {
            date: new Date().toISOString().slice(0, 10),
            author: 'Sample Admin',
            action: changes.join(' '),
          }]
          : report.followUps,
      };
    }));
  };

  const addFollowUp = (id: string, action: string) => {
    setReports((current) => current.map((report) => report.id === id ? {
      ...report,
      followUps: [...report.followUps, {
        date: new Date().toISOString().slice(0, 10),
        author: 'Sample Admin',
        action,
      }],
    } : report));
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter(allFilter);
    setBarangayFilter(allFilter);
    setCropFilter(allFilter);
    setStatusFilter(allFilter);
    setDateFrom('');
    setDateTo('');
  };

  return (
    <main className="reports-page">
      <header className="reports-page-heading">
        <div>
          <p className="reports-eyebrow">FARMER SUPPORT &amp; FOLLOW-UP</p>
          <h1>Reports</h1>
          <p className="reports-page-description">Review farmer-submitted farm problems, assign follow-up, and keep an action history.</p>
        </div>
        <div aria-hidden="true" className="reports-page-icon"><FileText size={22} /></div>
      </header>

      <div className="reports-demo-notice">
        <ClipboardList size={17} />
        <p><strong>Sample reports</strong> — These fictional reports demonstrate the workflow only. They are not linked to real farmers or a database, and updates last only for this session.</p>
      </div>

      <section aria-label="Report queue summary" className="reports-overview">
        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--amber"><AlertTriangle size={18} /></span>
          <div><span>Needs review</span><strong>{openCount}</strong><small>sample reports</small></div>
        </article>
        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--red"><ClipboardList size={18} /></span>
          <div><span>High priority</span><strong>{highPriorityCount}</strong><small>open sample reports</small></div>
        </article>
        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--green"><Check size={18} /></span>
          <div><span>Resolved / closed</span><strong>{resolvedCount}</strong><small>sample reports</small></div>
        </article>
        <article className="reports-overview-card">
          <span className="reports-overview-icon reports-overview-icon--blue"><FileText size={18} /></span>
          <div><span>All reports</span><strong>{reports.length}</strong><small>fictional sample records</small></div>
        </article>
      </section>

      <section aria-label="Farmer report queue" className="reports-queue">
        <header className="reports-queue-header">
          <div>
            <h2>Submitted issues</h2>
            <p>{filteredReports.length} of {reports.length} sample reports</p>
          </div>
          <div className="reports-queue-caption"><Filter size={15} /> Review queue</div>
        </header>

        <div className="reports-filters">
          <label className="reports-search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label="Search reports, farmers, farms, or barangays"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report, farmer, farm..."
              value={search}
            />
          </label>
          <label className="reports-filter-control">
            <span>Report type</span>
            <div className="reports-select-wrap">
              <select onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
                <option value={allFilter}>All types</option>
                {reportTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select><ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>
          <label className="reports-filter-control">
            <span>Barangay</span>
            <div className="reports-select-wrap">
              <select onChange={(event) => setBarangayFilter(event.target.value)} value={barangayFilter}>
                <option value={allFilter}>All barangays</option>
                {barangays.map((option) => <option key={option} value={option}>{option}</option>)}
              </select><ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>
          <label className="reports-filter-control">
            <span>Crop</span>
            <div className="reports-select-wrap">
              <select onChange={(event) => setCropFilter(event.target.value)} value={cropFilter}>
                <option value={allFilter}>All crops</option>
                {crops.map((option) => <option key={option} value={option}>{option}</option>)}
              </select><ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>
          <label className="reports-filter-control">
            <span>Status</span>
            <div className="reports-select-wrap">
              <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value={allFilter}>All statuses</option>
                {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
              </select><ChevronDown aria-hidden="true" size={14} />
            </div>
          </label>
          <label className="reports-filter-control">
            <span>From date</span>
            <input max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
          </label>
          <label className="reports-filter-control">
            <span>To date</span>
            <input min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
          </label>
          <button className="reports-clear-filters" onClick={clearFilters} type="button">Clear filters</button>
        </div>

        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Farmer / farm</th>
                <th scope="col">Barangay</th>
                <th scope="col">Crop</th>
                <th scope="col">Submitted</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="reports-visually-hidden">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const similarReports = reports.filter((item) =>
                  item.barangay === report.barangay && item.crop === report.crop,
                ).length;
                return (
                  <tr className={report.status === 'New' ? 'reports-table-row--new' : ''} key={report.id}>
                    <td>
                      <div className="reports-report-identity">
                        <span className="reports-report-icon"><Sprout size={15} /></span>
                        <span><strong>{report.type}</strong><small>{report.id}</small></span>
                      </div>
                    </td>
                    <td><span className="reports-farmer-cell"><strong>{report.farmerName}</strong><small>{report.farm} · {report.farmerId}</small></span></td>
                    <td><span className="reports-location-cell"><MapPin size={13} />{report.barangay}</span></td>
                    <td>{report.crop}</td>
                    <td>{displayDate(report.date)}</td>
                    <td><span className={`report-priority report-priority--${report.priority.toLowerCase()}`}>{report.priority}</span></td>
                    <td><span className={statusClass(report.status)}>{report.status}</span></td>
                    <td>
                      <button className="reports-view-button" onClick={() => setSelectedReportId(report.id)} type="button">
                        View details
                      </button>
                      {similarReports > 1 && <small className="reports-related-count">{similarReports} in location/crop</small>}
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr><td className="reports-empty" colSpan={8}>No sample reports match these search and filter criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="reports-source-note">
        All names, farm names, locations, dates, priorities, and descriptions are fictional sample data. Confirm reports with the farmer and a qualified staff member before taking action.
      </p>

      {selectedReport && (
        <ReportDetails
          key={selectedReport.id}
          onAddFollowUp={(action) => addFollowUp(selectedReport.id, action)}
          onClose={() => setSelectedReportId(null)}
          onSaveReview={(status, assignedTo) => updateReview(selectedReport.id, status, assignedTo)}
          relatedCount={reports.filter((report) => report.barangay === selectedReport.barangay && report.crop === selectedReport.crop).length}
          report={selectedReport}
        />
      )}
    </main>
  );
};

export default AdminReports;
