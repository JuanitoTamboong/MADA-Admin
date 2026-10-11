import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  MapPin,
  Pencil,
  Search,
  Sprout,
  X,
} from 'lucide-react';
import '../css/CropProduction.css';
import { supabase } from '../supabase/supabase-client';

// ---------- types ----------

type CropStatus = 'Growing' | 'Ready to Harvest' | 'Harvested' | 'Fallow';

interface CropRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farm: string;
  barangay: string;
  crop: string;
  variety: string;
  area: number;
  plantingDate: string;
  expectedHarvest: string;
  status: CropStatus;
  imagePath: string | null;
}

interface FarmRow {
  id: string;
  farmer_id: string;
  name: string;
  crop: string | null;
  variety: string | null;
  area_hectares: number;
  location: string | null;
  status: string | null;
  planted_date: string | null;
  expected_harvest: string | null;
  image_url: string | null;
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
}

// ---------- constants + helpers ----------

const statuses: CropStatus[] = ['Growing', 'Ready to Harvest', 'Harvested', 'Fallow'];
const allFilter = 'All';

function toUiStatus(raw: string | null | undefined): CropStatus {
  if (!raw) return 'Growing';
  const lower = raw.toLowerCase();
  if (lower === 'harvested') return 'Harvested';
  if (lower === 'fallow') return 'Fallow';
  if (lower === 'ready to harvest') return 'Ready to Harvest';
  return 'Growing';
}

// Maps the UI-only "Ready to Harvest" back to the DB-allowed "Growing".
// (The check constraint on farms.status allows Growing/Harvested/Fallow only.)
function toDbStatus(ui: CropStatus): string {
  if (ui === 'Ready to Harvest') return 'Growing';
  return ui;
}

function statusClass(ui: CropStatus): string {
  return ui.toLowerCase().replaceAll(' ', '-');
}

function formatDate(date: string | null): string {
  if (!date) return 'Not set';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Not set';
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

// Should we skip signing for this value? True for http(s) URLs and data URIs.
function isDirectUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw) || /^data:/i.test(raw);
}

// Batch-sign storage paths. Non-path values (URLs, data URIs, blanks)
// are filtered out before the round-trip.
async function signFarmImageUrls(
  paths: string[],
): Promise<Record<string, string>> {
  const uniq = Array.from(
    new Set(paths.filter((p) => p && !isDirectUrl(p))),
  );
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

// Resolve the best URL for a farms.image_url value.
function resolveImageUrl(
  raw: string | null,
  signed: Record<string, string>,
): string | null {
  if (!raw) return null;
  if (isDirectUrl(raw)) return raw;         // data URI or http(s) URL
  return signed[raw] ?? null;                // storage path
}

// ---------- edit form ----------

interface CropRecordFormProps {
  record: CropRecord;
  saving: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    patch: {
      status: string;
      crop: string;
      variety: string;
      area_hectares: number;
      planted_date: string | null;
      expected_harvest: string | null;
    },
  ) => void;
}

function CropRecordForm({ record, saving, onClose, onSave }: CropRecordFormProps) {
  const [status, setStatus] = useState<CropStatus>(record.status);
  const [crop, setCrop] = useState(record.crop);
  const [variety, setVariety] = useState(record.variety);
  const [area, setArea] = useState(String(record.area));
  const [plantedDate, setPlantedDate] = useState(record.plantingDate);
  const [expectedHarvest, setExpectedHarvest] = useState(record.expectedHarvest);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const parsedArea = Number.parseFloat(area);
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) return;

    onSave(record.id, {
      status: toDbStatus(status),
      crop: crop.trim(),
      variety: variety.trim(),
      area_hectares: parsedArea,
      planted_date: plantedDate || null,
      expected_harvest: expectedHarvest || null,
    });
  };

  return (
    <div className="crops-modal-backdrop" onMouseDown={saving ? undefined : onClose}>
      <section
        aria-labelledby="crop-edit-title"
        aria-modal="true"
        className="crops-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="crops-modal-header">
          <div>
            <p className="crops-eyebrow">{record.farmerName}</p>
            <h2 id="crop-edit-title">Update crop record</h2>
            <p>{record.farm}</p>
          </div>
          <button
            aria-label="Close form"
            className="crops-icon-button"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <form className="crops-form" onSubmit={submit}>
          <label>
            Crop
            <input
              onChange={(event) => setCrop(event.target.value)}
              required
              value={crop}
              disabled={saving}
            />
          </label>

          <label>
            Variety
            <input
              onChange={(event) => setVariety(event.target.value)}
              value={variety}
              disabled={saving}
            />
          </label>

          <label>
            Area (hectares)
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              onChange={(event) => setArea(event.target.value)}
              value={area}
              disabled={saving}
            />
          </label>

          <label>
            Planting date
            <input
              type="date"
              onChange={(event) => setPlantedDate(event.target.value)}
              value={plantedDate}
              disabled={saving}
            />
          </label>

          <label>
            Expected harvest
            <input
              type="date"
              onChange={(event) => setExpectedHarvest(event.target.value)}
              value={expectedHarvest}
              disabled={saving}
            />
          </label>

          <label>
            Status
            <select
              onChange={(event) => setStatus(event.target.value as CropStatus)}
              value={status}
              disabled={saving}
            >
              {statuses.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <footer className="crops-modal-actions">
            <button
              className="crops-button crops-button--secondary"
              onClick={onClose}
              type="button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="crops-button crops-button--primary"
              type="submit"
              disabled={saving}
            >
              <Pencil size={15} />
              {saving ? 'Saving…' : 'Save update'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

// ---------- detail modal ----------

interface CropDetailsProps {
  record: CropRecord;
  imageUrl: string | null;
  onClose: () => void;
  onEdit: () => void;
}

function CropDetails({ record, imageUrl, onClose, onEdit }: CropDetailsProps) {
  return (
    <div className="crops-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="crop-detail-title"
        aria-modal="true"
        className="crops-modal crops-detail-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="crops-detail-hero">
          {imageUrl ? (
            <img src={imageUrl} alt={record.farm} className="crops-detail-image" />
          ) : (
            <div className="crops-detail-image crops-detail-image--empty" aria-hidden="true">
              <Sprout size={34} />
            </div>
          )}
        </div>

        <header className="crops-modal-header crops-modal-header--over-hero">
          <div>
            <p className="crops-eyebrow">
              {record.farmerId.slice(0, 8).toUpperCase()}
            </p>
            <h2 id="crop-detail-title">
              {record.crop}{record.variety ? ` · ${record.variety}` : ''}
            </h2>
            <p>{record.farm}{record.barangay ? ` · ${record.barangay}` : ''}</p>
          </div>
          <button
            aria-label="Close details"
            className="crops-icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <div className="crops-detail-status-row">
          <span className={`crop-status crop-status--${statusClass(record.status)}`}>
            {record.status}
          </span>
        </div>

        <div className="crops-detail-grid">
          <div>
            <span>Farmer</span>
            <strong>{record.farmerName}</strong>
            <a href="#farmers">Open farmer directory ↗</a>
          </div>
          <div>
            <span>Farm</span>
            <strong>{record.farm}</strong>
            <small>{record.farmerId.slice(0, 8).toUpperCase()}</small>
          </div>
          {record.barangay && (
            <div>
              <span>Barangay</span>
              <strong>{record.barangay}</strong>
            </div>
          )}
          <div>
            <span>Planted area</span>
            <strong>{record.area.toFixed(2)} ha</strong>
          </div>
          <div>
            <span>Planting date</span>
            <strong>{formatDate(record.plantingDate)}</strong>
          </div>
          <div>
            <span>Expected harvest</span>
            <strong>{formatDate(record.expectedHarvest)}</strong>
          </div>
        </div>

        <footer className="crops-modal-actions">
          <button
            className="crops-button crops-button--secondary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className="crops-button crops-button--primary"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={15} /> Update record
          </button>
        </footer>
      </section>
    </div>
  );
}

// ---------- main ----------

const CropProduction = () => {
  const [records, setRecords] = useState<CropRecord[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);

  const [selectedRecord, setSelectedRecord] = useState<CropRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<CropRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [farmsRes, farmersRes] = await Promise.all([
      supabase
        .from('farms')
        .select(
          'id, farmer_id, name, crop, variety, area_hectares, location, status, planted_date, expected_harvest, image_url',
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('farmers')
        .select('id, full_name, address')
        .eq('role', 'farmer'),
    ]);

    const firstError = farmsRes.error || farmersRes.error;
    if (firstError) {
      setError(firstError.message);
      setRecords([]);
      setImageUrls({});
      setLoading(false);
      return;
    }

    const farmerById = new Map<string, FarmerRow>();
    for (const f of (farmersRes.data ?? []) as FarmerRow[]) {
      farmerById.set(f.id, f);
    }

    const farmRows = (farmsRes.data ?? []) as FarmRow[];

    const mapped: CropRecord[] = farmRows.map((row) => {
      const farmer = farmerById.get(row.farmer_id);
      return {
        id: row.id,
        farmerId: row.farmer_id,
        farmerName: farmer?.full_name ?? 'Unknown farmer',
        farm: row.name,
        barangay: row.location ?? farmer?.address ?? '',
        crop: row.crop ?? 'Unknown',
        variety: row.variety ?? '',
        area: Number(row.area_hectares ?? 0),
        plantingDate: row.planted_date ?? '',
        expectedHarvest: row.expected_harvest ?? '',
        status: toUiStatus(row.status),
        imagePath: row.image_url,
      };
    });

    setRecords(mapped);

    // Sign only the storage paths. data: URIs and http(s) URLs pass through.
    const signed = await signFarmImageUrls(
      farmRows.map((r) => r.image_url ?? ''),
    );
    setImageUrls(signed);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const crops = useMemo(
    () => [...new Set(records.map((r) => r.crop).filter(Boolean))].sort(),
    [records],
  );

  const barangays = useMemo(
    () => [...new Set(records.map((r) => r.barangay).filter(Boolean))].sort(),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !query ||
        [
          record.farmerId,
          record.farmerName,
          record.farm,
          record.id,
          record.crop,
          record.barangay,
        ].some((value) => (value ?? '').toLowerCase().includes(query));

      return (
        matchesSearch &&
        (cropFilter === allFilter || record.crop === cropFilter) &&
        (barangayFilter === allFilter || record.barangay === barangayFilter) &&
        (statusFilter === allFilter || record.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, records, search, statusFilter]);

  const totalArea = filteredRecords.reduce((total, r) => total + r.area, 0);
  const growingCount = filteredRecords.filter((r) => r.status === 'Growing').length;
  const readyCount = filteredRecords.filter((r) => r.status === 'Ready to Harvest').length;

  const updateRecord = async (
    id: string,
    patch: {
      status: string;
      crop: string;
      variety: string;
      area_hectares: number;
      planted_date: string | null;
      expected_harvest: string | null;
    },
  ) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('farms')
      .update({
        status: patch.status,
        crop: patch.crop,
        variety: patch.variety || null,
        area_hectares: patch.area_hectares,
        planted_date: patch.planted_date,
        expected_harvest: patch.expected_harvest,
      })
      .eq('id', id);

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setEditingRecord(null);
    setSelectedRecord(null);
    await load();
  };

  return (
    <main className="crops-page">
      <header className="crops-page-heading">
        <div>
          <p className="crops-eyebrow">FARM &amp; CROP RECORDS</p>
          <h1>Crops &amp; Production</h1>
          <p className="crops-page-description">
            Track crop progress and keep harvest records linked to farmers and farms.
          </p>
        </div>
        <div aria-hidden="true" className="crops-page-icon">
          <Sprout size={22} />
        </div>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <section aria-label="Crop record summary" className="crops-summary">
        <article>
          <span className="crops-summary-icon">
            <Sprout size={17} />
          </span>
          <div>
            <span>Crop records</span>
            <strong>{loading ? '—' : filteredRecords.length}</strong>
          </div>
        </article>

        <article>
          <span className="crops-summary-icon crops-summary-icon--green">
            <MapPin size={17} />
          </span>
          <div>
            <span>Planted area</span>
            <strong>{loading ? '—' : `${totalArea.toFixed(1)} ha`}</strong>
          </div>
        </article>

        <article>
          <span className="crops-summary-icon crops-summary-icon--blue">
            <CalendarDays size={17} />
          </span>
          <div>
            <span>Growing</span>
            <strong>{loading ? '—' : growingCount}</strong>
          </div>
        </article>

        <article>
          <span className="crops-summary-icon crops-summary-icon--amber">
            <ClipboardList size={17} />
          </span>
          <div>
            <span>Ready to harvest</span>
            <strong>{loading ? '—' : readyCount}</strong>
          </div>
        </article>
      </section>

      <section aria-label="Crop and production records" className="crops-directory">
        <header className="crops-directory-header">
          <div>
            <h2>Crop records</h2>
            <p>
              {loading
                ? 'Loading…'
                : `${filteredRecords.length} matching ${
                    filteredRecords.length === 1 ? 'record' : 'records'
                  }`}
            </p>
          </div>
        </header>

        <div className="crops-filters">
          <label className="crops-search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label="Search crops, farms, farmers, or IDs"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search crop, farm, farmer..."
              value={search}
            />
          </label>

          <label className="crops-filter">
            <span>Crop</span>
            <div>
              <select
                onChange={(event) => setCropFilter(event.target.value)}
                value={cropFilter}
              >
                <option value={allFilter}>All crops</option>
                {crops.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </label>

          <label className="crops-filter">
            <span>Barangay</span>
            <div>
              <select
                onChange={(event) => setBarangayFilter(event.target.value)}
                value={barangayFilter}
              >
                <option value={allFilter}>All barangays</option>
                {barangays.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </label>

          <label className="crops-filter">
            <span>Status</span>
            <div>
              <select
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value={allFilter}>All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </label>
        </div>

        <div className="crops-table-wrap">
          <table className="crops-table">
            <thead>
              <tr>
                <th scope="col">Farmer / farm</th>
                <th scope="col">Barangay</th>
                <th scope="col">Crop / variety</th>
                <th scope="col">Area</th>
                <th scope="col">Planted</th>
                <th scope="col">Expected harvest</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="crops-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="crops-empty" colSpan={8}>
                    Loading crop records…
                  </td>
                </tr>
              )}

              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td className="crops-empty" colSpan={8}>
                    {records.length === 0
                      ? 'No crop records yet.'
                      : 'No crop records match these search and filter criteria.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredRecords.map((record) => {
                  const img = resolveImageUrl(record.imagePath, imageUrls);
                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="crops-farm-cell">
                          {img ? (
                            <img
                              src={img}
                              alt={record.farm}
                              className="crops-farm-thumb"
                            />
                          ) : (
                            <div className="crops-farm-thumb crops-farm-thumb--empty">
                              {initialFromName(record.farm)}
                            </div>
                          )}
                          <div className="crops-farmer-cell">
                            <strong>{record.farmerName}</strong>
                            <span>
                              {record.farm} · {record.farmerId.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{record.barangay || 'Not recorded'}</td>
                      <td>
                        <div className="crops-crop-cell">
                          <strong>{record.crop}</strong>
                          <span>{record.variety || '—'}</span>
                        </div>
                      </td>
                      <td>{record.area.toFixed(2)} ha</td>
                      <td>{formatDate(record.plantingDate)}</td>
                      <td>{formatDate(record.expectedHarvest)}</td>
                      <td>
                        <span className={`crop-status crop-status--${statusClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="crops-row-actions">
                          <button
                            className="crops-text-button"
                            onClick={() => setSelectedRecord(record)}
                            type="button"
                          >
                            View details
                          </button>
                          <button
                            aria-label={`Update ${record.crop} record for ${record.farmerName}`}
                            className="crops-icon-button crops-edit-button"
                            onClick={() => setEditingRecord(record)}
                            type="button"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <p className="crops-record-note">
          <FileText size={13} /> Every row comes from a farm record created by a
          farmer. Only the admin can update the crop details.
        </p>
      </section>

      {selectedRecord && (
        <CropDetails
          record={selectedRecord}
          imageUrl={resolveImageUrl(selectedRecord.imagePath, imageUrls)}
          onClose={() => setSelectedRecord(null)}
          onEdit={() => {
            setEditingRecord(selectedRecord);
            setSelectedRecord(null);
          }}
        />
      )}

      {editingRecord && (
        <CropRecordForm
          record={editingRecord}
          saving={saving}
          onClose={() => {
            if (saving) return;
            setEditingRecord(null);
          }}
          onSave={updateRecord}
        />
      )}
    </main>
  );
};

export default CropProduction;