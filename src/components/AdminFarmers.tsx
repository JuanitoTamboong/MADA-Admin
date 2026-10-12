import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardList,
  MapPin,
  Pencil,
  Search,
  Users,
  X,
} from 'lucide-react';
import '../css/AdminFarmers.css';
import { supabase } from '../supabase/supabase-client';

// ---------- types ----------

type FarmerStatus = 'Active' | 'Inactive';

interface FarmerFarm {
  id: string;
  name: string;
  crop: string;
  area: string;
}

interface FarmerReport {
  id: string;
  type: string;
  date: string;
  status: string;
}

interface Farmer {
  id: string;
  name: string;
  barangay: string;
  email: string;
  mainCrop: string;
  status: FarmerStatus;
  avatarPath: string | null;
  farms: FarmerFarm[];
  reports: FarmerReport[];
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
  email: string | null;
  status: 'active' | 'inactive' | null;
  avatar_path: string | null;
}

interface FarmRow {
  id: string;
  farmer_id: string;
  name: string;
  crop: string | null;
  area_hectares: number;
}

interface ReportRow {
  id: string;
  farmer_id: string;
  note: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

// ---------- constants + helpers ----------

const statusOptions: FarmerStatus[] = ['Active', 'Inactive'];
const allFilter = 'All';

function toUiStatus(
  raw: 'active' | 'inactive' | null | undefined,
): FarmerStatus {
  return raw === 'inactive' ? 'Inactive' : 'Active';
}

function statusClass(ui: FarmerStatus): string {
  return ui.toLowerCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function initialFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts[0][0].toUpperCase();
}

// Batch-sign storage paths for avatars.
async function signAvatarUrls(paths: string[]): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(paths.filter(Boolean)));
  if (uniq.length === 0) return {};

  const { data, error } = await supabase.storage
    .from('profile-avatars')
    .createSignedUrls(uniq, 60 * 60);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

// ---------- edit form ----------

interface FarmerFormProps {
  farmer: Farmer;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    patch: { full_name: string; address: string; status: 'active' | 'inactive' },
  ) => void;
}

function FarmerForm({ farmer, saving = false, onClose, onSave }: FarmerFormProps) {
  const [name, setName] = useState(farmer.name);
  const [barangay, setBarangay] = useState(farmer.barangay);
  const [rawStatus, setRawStatus] = useState<'active' | 'inactive'>(
    farmer.status === 'Inactive' ? 'inactive' : 'active',
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    onSave(farmer.id, {
      full_name: name.trim(),
      address: barangay.trim(),
      status: rawStatus,
    });
  };

  return (
    <div
      className="farmers-modal-backdrop"
      onMouseDown={saving ? undefined : onClose}
    >
      <section
        aria-labelledby="farmer-form-title"
        aria-modal="true"
        className="farmers-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="farmers-modal-header">
          <div>
            <p className="farmers-eyebrow">FARMER DIRECTORY</p>
            <h2 id="farmer-form-title">Edit farmer</h2>
          </div>
          <button
            aria-label="Close form"
            className="farmers-icon-button"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <form className="farmer-form" onSubmit={handleSubmit}>
          <label>
            Farmer name
            <input
              autoFocus
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
              disabled={saving}
            />
          </label>

          <label>
            Address / Barangay
            <input
              onChange={(event) => setBarangay(event.target.value)}
              required
              value={barangay}
              disabled={saving}
            />
          </label>

          <label className="farmer-status-field">
            Account status
            <select
              onChange={(event) =>
                setRawStatus(event.target.value as 'active' | 'inactive')
              }
              value={rawStatus}
              disabled={saving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="farmers-modal-actions">
            <button
              className="farmers-button farmers-button--secondary"
              onClick={onClose}
              type="button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="farmers-button farmers-button--primary"
              type="submit"
              disabled={saving}
            >
              <Check size={16} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ---------- profile modal ----------

interface FarmerProfileProps {
  farmer: Farmer;
  avatarUrl: string | null;
  onClose: () => void;
  onEdit: () => void;
}

function FarmerProfile({
  farmer,
  avatarUrl,
  onClose,
  onEdit,
}: FarmerProfileProps) {
  return (
    <div className="farmers-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="farmer-profile-title"
        aria-modal="true"
        className="farmers-modal farmers-profile-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="farmers-modal-header">
          <div className="farmer-profile-heading">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={farmer.name}
                className="farmer-avatar farmer-avatar--img"
              />
            ) : (
              <div className="farmer-avatar">
                {initialFromName(farmer.name)}
              </div>
            )}
            <div>
              <p className="farmers-eyebrow">
                {farmer.id.slice(0, 8).toUpperCase()}
              </p>
              <h2 id="farmer-profile-title">{farmer.name}</h2>
            </div>
          </div>
          <button
            aria-label="Close profile"
            className="farmers-icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <div className="farmer-profile-summary">
          <span
            className={`farmer-status farmer-status--${statusClass(farmer.status)}`}
          >
            {farmer.status}
          </span>
          {farmer.barangay && (
            <span>
              <MapPin size={15} /> {farmer.barangay}
            </span>
          )}
        </div>

        <div className="farmer-profile-section">
          <h3>Contact details</h3>
          <dl className="farmer-contact-grid">
            <div>
              <dt>Email</dt>
              <dd>{farmer.email || 'Not provided'}</dd>
            </div>
          </dl>
        </div>

        <div className="farmer-profile-section">
          <h3>
            Farm records <span>{farmer.farms.length}</span>
          </h3>
          {farmer.farms.length ? (
            <div className="farmer-profile-list">
              {farmer.farms.map((farm) => (
                <div className="farmer-detail-row" key={farm.id}>
                  <div>
                    <strong>{farm.name}</strong>
                    <span>{farm.crop || 'Crop not recorded'}</span>
                  </div>
                  <span>{farm.area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="farmer-empty-detail">No farms recorded yet.</p>
          )}
        </div>

        <div className="farmer-profile-section">
          <h3>
            Submitted reports <span>{farmer.reports.length}</span>
          </h3>
          {farmer.reports.length ? (
            <div className="farmer-profile-list">
              {farmer.reports.map((report) => (
                <div className="farmer-detail-row" key={report.id}>
                  <div>
                    <strong>{report.type}</strong>
                    <span>{report.date}</span>
                  </div>
                  <span className="farmer-report-status">{report.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="farmer-empty-detail">No reports submitted yet.</p>
          )}
        </div>

        <div className="farmers-modal-actions">
          <button
            className="farmers-button farmers-button--secondary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className="farmers-button farmers-button--primary"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={15} /> Edit farmer
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------- main ----------

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [farmersRes, farmsRes, reportsRes] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, full_name, address, email, status, avatar_path')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false }),

      supabase
        .from('farms')
        .select('id, farmer_id, name, crop, area_hectares'),

      supabase
        .from('pest_reports')
        .select('id, farmer_id, note, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    const firstError = farmersRes.error || farmsRes.error || reportsRes.error;
    if (firstError) {
      setError(firstError.message);
      setFarmers([]);
      setAvatarUrls({});
      setLoading(false);
      return;
    }

    const farmsByFarmer = new Map<string, FarmerFarm[]>();
    for (const f of (farmsRes.data ?? []) as FarmRow[]) {
      const list = farmsByFarmer.get(f.farmer_id) ?? [];
      list.push({
        id: f.id,
        name: f.name,
        crop: f.crop ?? '',
        area: `${Number(f.area_hectares ?? 0).toFixed(1)} ha`,
      });
      farmsByFarmer.set(f.farmer_id, list);
    }

    const reportsByFarmer = new Map<string, FarmerReport[]>();
    for (const r of (reportsRes.data ?? []) as ReportRow[]) {
      const list = reportsByFarmer.get(r.farmer_id) ?? [];
      list.push({
        id: r.id,
        type: r.note?.trim() || 'Report submitted',
        date: formatDate(r.created_at),
        status:
          r.status === 'resolved'
            ? 'Resolved'
            : r.status === 'reviewed'
              ? 'Reviewed'
              : 'Pending',
      });
      reportsByFarmer.set(r.farmer_id, list);
    }

    const rows = (farmersRes.data ?? []) as FarmerRow[];

    const mapped: Farmer[] = rows.map((row) => {
      const farmList = farmsByFarmer.get(row.id) ?? [];
      return {
        id: row.id,
        name: row.full_name,
        barangay: row.address ?? '',
        email: row.email ?? '',
        mainCrop: farmList[0]?.crop ?? '',
        status: toUiStatus(row.status),
        avatarPath: row.avatar_path,
        farms: farmList,
        reports: reportsByFarmer.get(row.id) ?? [],
      };
    });

    setFarmers(mapped);

    const signed = await signAvatarUrls(
      rows.map((r) => r.avatar_path ?? '').filter(Boolean),
    );
    setAvatarUrls(signed);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const barangays = useMemo(
    () => [...new Set(farmers.map((f) => f.barangay).filter(Boolean))].sort(),
    [farmers],
  );

  const crops = useMemo(
    () =>
      [
        ...new Set(
          farmers.flatMap((f) =>
            f.farms.map((farm) => farm.crop).filter(Boolean),
          ),
        ),
      ].sort(),
    [farmers],
  );

  const filteredFarmers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return farmers.filter((farmer) => {
      const matchesSearch =
        !normalizedSearch ||
        [farmer.name, farmer.id, farmer.barangay, farmer.email].some((value) =>
          (value ?? '').toLowerCase().includes(normalizedSearch),
        );
      const matchesCrop =
        cropFilter === allFilter ||
        farmer.farms.some((farm) => farm.crop === cropFilter);
      return (
        matchesSearch &&
        (barangayFilter === allFilter || farmer.barangay === barangayFilter) &&
        matchesCrop &&
        (statusFilter === allFilter || farmer.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, farmers, search, statusFilter]);

  const handleSaveFarmer = async (
    id: string,
    patch: { full_name: string; address: string; status: 'active' | 'inactive' },
  ) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('farmers')
      .update({
        full_name: patch.full_name,
        address: patch.address,
        status: patch.status,
      })
      .eq('id', id);

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setEditingFarmer(null);
    setSelectedFarmer(null);
    await load();
  };

  const editFarmer = (farmer: Farmer) => {
    setSelectedFarmer(null);
    setEditingFarmer(farmer);
  };

  const activeCount = farmers.filter((f) => f.status === 'Active').length;
  const inactiveCount = farmers.filter((f) => f.status === 'Inactive').length;
  const farmCount = farmers.reduce((total, f) => total + f.farms.length, 0);

  return (
    <main className="farmers-page">
      <header className="farmers-page-heading">
        <div>
          <p className="farmers-eyebrow">COMMUNITY DIRECTORY</p>
          <h1>Farmers</h1>
          <p className="farmers-page-description">
            Find and manage farmer records across the community.
          </p>
        </div>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <section aria-label="Farmer directory summary" className="farmers-summary">
        <article className="farmers-summary-card">
          <div className="farmers-summary-icon">
            <Users size={18} />
          </div>
          <div>
            <span>Total farmers</span>
            <strong>{loading ? '—' : farmers.length}</strong>
          </div>
        </article>

        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--green">
            <Check size={18} />
          </div>
          <div>
            <span>Active</span>
            <strong>{loading ? '—' : activeCount}</strong>
          </div>
        </article>

        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--amber">
            <ClipboardList size={18} />
          </div>
          <div>
            <span>Inactive</span>
            <strong>{loading ? '—' : inactiveCount}</strong>
          </div>
        </article>

        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--blue">
            <MapPin size={18} />
          </div>
          <div>
            <span>Farm records</span>
            <strong>{loading ? '—' : farmCount}</strong>
          </div>
        </article>
      </section>

      <section aria-label="Farmer directory" className="farmers-directory-card">
        <div className="farmers-directory-heading">
          <div>
            <h2>Farmer directory</h2>
            <p>
              {loading
                ? 'Loading…'
                : `${filteredFarmers.length} ${
                    filteredFarmers.length === 1 ? 'record' : 'records'
                  } shown`}
            </p>
          </div>
        </div>

        <div className="farmers-filters">
          <label className="farmers-search">
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search farmers by name, ID, barangay, or email"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, barangay..."
              value={search}
            />
          </label>

          <label className="farmers-filter">
            <span>Barangay</span>
            <select
              onChange={(event) => setBarangayFilter(event.target.value)}
              value={barangayFilter}
            >
              <option value={allFilter}>All barangays</option>
              {barangays.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>

          <label className="farmers-filter">
            <span>Crop</span>
            <select
              onChange={(event) => setCropFilter(event.target.value)}
              value={cropFilter}
            >
              <option value={allFilter}>All crops</option>
              {crops.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>

          <label className="farmers-filter">
            <span>Status</span>
            <select
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value={allFilter}>All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
        </div>

        <div className="farmers-table-wrap">
          <table className="farmers-table">
            <thead>
              <tr>
                <th scope="col">Farmer ID</th>
                <th scope="col">Farmer</th>
                <th scope="col">Barangay</th>
                <th scope="col">Email</th>
                <th scope="col">Main crop</th>
                <th scope="col">Farms</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="farmers-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="farmers-empty-state" colSpan={8}>
                    Loading farmers…
                  </td>
                </tr>
              )}

              {!loading && filteredFarmers.length === 0 && (
                <tr>
                  <td className="farmers-empty-state" colSpan={8}>
                    {farmers.length === 0
                      ? 'No farmers registered yet.'
                      : 'No farmers match these search and filter criteria.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredFarmers.map((farmer) => {
                  const avatarUrl = farmer.avatarPath
                    ? avatarUrls[farmer.avatarPath]
                    : null;
                  return (
                    <tr key={farmer.id}>
                      <td>{farmer.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <div className="farmer-table-identity">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={farmer.name}
                              className="farmer-avatar farmer-avatar--img"
                            />
                          ) : (
                            <div className="farmer-avatar">
                              {initialFromName(farmer.name)}
                            </div>
                          )}
                          <div>
                            <strong>{farmer.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{farmer.barangay || 'Not recorded'}</td>
                      <td>{farmer.email || '—'}</td>
                      <td>{farmer.mainCrop || 'Not recorded'}</td>
                      <td>{farmer.farms.length}</td>
                      <td>
                        <span
                          className={`farmer-status farmer-status--${statusClass(
                            farmer.status,
                          )}`}
                        >
                          {farmer.status}
                        </span>
                      </td>
                      <td>
                        <div className="farmer-row-actions">
                          <button
                            className="farmer-text-action"
                            onClick={() => setSelectedFarmer(farmer)}
                            type="button"
                          >
                            View
                          </button>
                          <button
                            aria-label={`Edit ${farmer.name}`}
                            className="farmers-icon-button farmers-edit-button"
                            onClick={() => editFarmer(farmer)}
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedFarmer && (
        <FarmerProfile
          farmer={selectedFarmer}
          avatarUrl={
            selectedFarmer.avatarPath
              ? avatarUrls[selectedFarmer.avatarPath] ?? null
              : null
          }
          onClose={() => setSelectedFarmer(null)}
          onEdit={() => editFarmer(selectedFarmer)}
        />
      )}

      {editingFarmer && (
        <FarmerForm
          farmer={editingFarmer}
          saving={saving}
          onClose={() => {
            if (saving) return;
            setEditingFarmer(null);
          }}
          onSave={handleSaveFarmer}
        />
      )}
    </main>
  );
};

export default AdminFarmers;