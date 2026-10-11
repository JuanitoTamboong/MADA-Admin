import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import '../css/AdminMap.css';
import { supabase } from '../supabase/supabase-client';

type FarmerStatus = 'Active' | 'Inactive';

interface MappedFarmer {
  id: string;
  name: string;
  barangay: string;
  mainCrop: string;
  farmCount: number;
  status: FarmerStatus;
  avatarPath: string | null;
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
  status: 'active' | 'inactive' | null;
  avatar_path: string | null;
}

interface FarmRow {
  farmer_id: string;
  crop: string | null;
}

const statuses: FarmerStatus[] = ['Active', 'Inactive'];
const allFilter = 'All';

const mapEmbedUrl =
  'https://www.openstreetmap.org/export/embed.html?bbox=116.5%2C4.5%2C127.5%2C21.5&layer=mapnik';

function toUiStatus(raw: 'active' | 'inactive' | null | undefined): FarmerStatus {
  return raw === 'inactive' ? 'Inactive' : 'Active';
}

function statusClass(ui: FarmerStatus): string {
  return ui.toLowerCase();
}

// Batch-sign avatar paths in one round-trip. Returns { path -> url }.
async function signAvatarUrls(
  paths: string[],
): Promise<Record<string, string>> {
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

const AdminMap = () => {
  const [farmers, setFarmers] = useState<MappedFarmer[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [farmersRes, farmsRes] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, full_name, address, status, avatar_path')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false }),

      supabase.from('farms').select('farmer_id, crop'),
    ]);

    const firstError = farmersRes.error || farmsRes.error;
    if (firstError) {
      setError(firstError.message);
      setFarmers([]);
      setAvatarUrls({});
      setLoading(false);
      return;
    }

    // Aggregate farms per farmer: count + main crop (first non-null)
    const farmCountById = new Map<string, number>();
    const mainCropById = new Map<string, string>();

    for (const row of (farmsRes.data ?? []) as FarmRow[]) {
      farmCountById.set(
        row.farmer_id,
        (farmCountById.get(row.farmer_id) ?? 0) + 1,
      );
      if (row.crop && !mainCropById.has(row.farmer_id)) {
        mainCropById.set(row.farmer_id, row.crop);
      }
    }

    const rows = (farmersRes.data ?? []) as FarmerRow[];

    const mapped: MappedFarmer[] = rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      barangay: row.address ?? '',
      mainCrop: mainCropById.get(row.id) ?? 'Not recorded',
      farmCount: farmCountById.get(row.id) ?? 0,
      status: toUiStatus(row.status),
      avatarPath: row.avatar_path,
    }));

    setFarmers(mapped);

    // Sign all avatars in a single request
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
          farmers
            .map((f) => f.mainCrop)
            .filter((c) => c && c !== 'Not recorded'),
        ),
      ].sort(),
    [farmers],
  );

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return farmers.filter((farmer) => {
      const matchesSearch =
        !query ||
        [farmer.id, farmer.name].some((value) =>
          (value ?? '').toLowerCase().includes(query),
        );
      return (
        matchesSearch &&
        (barangayFilter === allFilter || farmer.barangay === barangayFilter) &&
        (cropFilter === allFilter || farmer.mainCrop === cropFilter) &&
        (statusFilter === allFilter || farmer.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, farmers, search, statusFilter]);

  const farmerCountByBarangay = useMemo(() => {
    const counts = new Map<string, number>();
    filteredFarmers.forEach((farmer) => {
      const key = farmer.barangay || 'Not recorded';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFarmers]);

  const clearFilters = () => {
    setSearch('');
    setBarangayFilter(allFilter);
    setCropFilter(allFilter);
    setStatusFilter(allFilter);
    setSelectedFarmerId(null);
  };

  return (
    <main className="farmers-map-page">
      <header className="farmers-map-page-heading">
        <div>
          <p className="farmers-map-eyebrow">GEOGRAPHIC DIRECTORY</p>
          <h1>Farmers Map</h1>
          <p className="farmers-map-description">
            Explore farmer coverage by barangay. Exact coordinates are not
            collected at registration.
          </p>
        </div>
        <span className="farmers-map-title-icon">
          <MapIcon size={21} />
        </span>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <div className="farmers-map-demo-notice">
        <AlertTriangle size={17} />
        <p>
          <strong>No coordinates are stored for farmers.</strong> The base map
          is a country overview only. The farmer list below shows the address
          each farmer entered at registration.
        </p>
      </div>

      <section aria-label="Map summary" className="farmers-map-summary">
        <article>
          <span className="farmers-map-summary-icon">
            <Users size={17} />
          </span>
          <div>
            <span>Matching farmers</span>
            <strong>{loading ? '—' : filteredFarmers.length}</strong>
          </div>
        </article>

        <article>
          <span className="farmers-map-summary-icon farmers-map-summary-icon--green">
            <MapPin size={17} />
          </span>
          <div>
            <span>With verified locations</span>
            <strong>0</strong>
          </div>
        </article>

        <article>
          <span className="farmers-map-summary-icon farmers-map-summary-icon--amber">
            <AlertTriangle size={17} />
          </span>
          <div>
            <span>Location not on record</span>
            <strong>{loading ? '—' : filteredFarmers.length}</strong>
          </div>
        </article>

        <article>
          <span className="farmers-map-summary-icon farmers-map-summary-icon--blue">
            <MapIcon size={17} />
          </span>
          <div>
            <span>Barangays represented</span>
            <strong>{loading ? '—' : farmerCountByBarangay.length}</strong>
          </div>
        </article>
      </section>

      <section aria-label="Search and filter farmers" className="farmers-map-filters">
        <label className="farmers-map-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search farmer by name or ID"
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedFarmerId(null);
            }}
            placeholder="Search farmer name or ID..."
            value={search}
          />
        </label>

        <label className="farmers-map-filter">
          <span>Barangay</span>
          <div>
            <select
              onChange={(event) => {
                setBarangayFilter(event.target.value);
                setSelectedFarmerId(null);
              }}
              value={barangayFilter}
            >
              <option value={allFilter}>All barangays</option>
              {barangays.map((barangay) => (
                <option key={barangay} value={barangay}>{barangay}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </label>

        <label className="farmers-map-filter">
          <span>Crop</span>
          <div>
            <select
              onChange={(event) => {
                setCropFilter(event.target.value);
                setSelectedFarmerId(null);
              }}
              value={cropFilter}
            >
              <option value={allFilter}>All crops</option>
              {crops.map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </label>

        <label className="farmers-map-filter">
          <span>Registration status</span>
          <div>
            <select
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setSelectedFarmerId(null);
              }}
              value={statusFilter}
            >
              <option value={allFilter}>All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </label>

        <button className="farmers-map-clear" onClick={clearFilters} type="button">
          Clear filters
        </button>
      </section>

      <div className="farmers-map-content">
        <section aria-label="Map showing the Philippines" className="farmers-map-panel">
          <header className="farmers-map-panel-header">
            <div>
              <h2>Map overview</h2>
              <p>Philippines · map context only</p>
            </div>
            <a href="https://www.openstreetmap.org/" rel="noreferrer" target="_blank">
              Open map <ExternalLink size={13} />
            </a>
          </header>

          <div className="farmers-map-viewport">
            <iframe
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer"
              src={mapEmbedUrl}
              title="OpenStreetMap view of the Philippines, with no farmer locations plotted"
            />
            <div className="farmers-map-empty-overlay">
              <span><MapPin size={20} /></span>
              <strong>No farmer locations to plot</strong>
              <p>Verified coordinates have not been collected for farmers.</p>
            </div>
          </div>

          <footer className="farmers-map-attribution">
            Map data © <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap contributors</a>. Base map only; no farmer locations are displayed.
          </footer>
        </section>

        <aside
          aria-label="Farmers without verified coordinates"
          className="farmers-map-records"
        >
          <header className="farmers-map-records-header">
            <div>
              <h2>Farmer list</h2>
              <p>
                {loading
                  ? 'Loading…'
                  : `${filteredFarmers.length} matching ${
                      filteredFarmers.length === 1 ? 'record' : 'records'
                    }`}
              </p>
            </div>
            <span>{loading ? '—' : `${filteredFarmers.length} no location`}</span>
          </header>

          <div className="farmers-map-barangay-groups">
            {!loading && farmerCountByBarangay.length === 0 && (
              <p className="farmers-map-empty-list">
                {farmers.length === 0
                  ? 'No farmers registered yet.'
                  : 'No farmers match these search and filter criteria.'}
              </p>
            )}

            {farmerCountByBarangay.map(([barangay, count]) => (
              <div className="farmers-map-barangay-group" key={barangay}>
                <header>
                  <MapPin size={14} />
                  <strong>{barangay}</strong>
                  <span>{count}</span>
                </header>

                <ul>
                  {filteredFarmers
                    .filter((farmer) => (farmer.barangay || 'Not recorded') === barangay)
                    .map((farmer) => {
                      const avatarUrl = farmer.avatarPath
                        ? avatarUrls[farmer.avatarPath]
                        : null;
                      return (
                        <li key={farmer.id}>
                          <button
                            aria-pressed={selectedFarmerId === farmer.id}
                            className={`farmers-map-record-button${
                              selectedFarmerId === farmer.id
                                ? ' farmers-map-record-button--selected'
                                : ''
                            }`}
                            onClick={() =>
                              setSelectedFarmerId(
                                selectedFarmerId === farmer.id ? null : farmer.id,
                              )
                            }
                            type="button"
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={farmer.name}
                                className="farmers-map-record-avatar farmers-map-record-avatar--img"
                              />
                            ) : (
                              <span className="farmers-map-record-avatar">
                                {farmer.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}

                            <span className="farmers-map-record-copy">
                              <strong>{farmer.name}</strong>
                              <small>
                                {farmer.id.slice(0, 8).toUpperCase()} · {farmer.mainCrop} · {farmer.farmCount}{' '}
                                {farmer.farmCount === 1 ? 'farm' : 'farms'}
                              </small>
                            </span>

                            <span
                              className={`farmers-map-status farmers-map-status--${statusClass(
                                farmer.status,
                              )}`}
                            >
                              {farmer.status}
                            </span>
                          </button>

                          {selectedFarmerId === farmer.id && (
                            <div className="farmers-map-record-detail">
                              <p>
                                <MapPin size={13} /> Exact location not on record
                              </p>
                              <a href="#farmers">
                                View farmer profile <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>

          <footer className="farmers-map-list-note">
            List and barangay counts use the same search and filters as the map.
          </footer>
        </aside>
      </div>
    </main>
  );
};

export default AdminMap;