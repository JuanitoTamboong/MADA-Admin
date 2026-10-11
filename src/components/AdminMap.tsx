import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  latitude: number | null;
  longitude: number | null;
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

function toUiStatus(
  raw: 'active' | 'inactive' | null | undefined,
): FarmerStatus {
  return raw === 'inactive' ? 'Inactive' : 'Active';
}

function statusClass(ui: FarmerStatus): string {
  return ui.toLowerCase();
}

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

function simplifyAddress(address: string): string {
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const candidate = parts[parts.length - 1] ?? address;

  return candidate
    .replace(/^(barangay|brgy\.?|brgy|purok|sitio)\s+/i, '')
    .trim();
}

async function geocodeAddress(
  address: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const q = simplifyAddress(address) || address;
  if (!q) return null;

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q,
      )}&count=1&language=en&format=json`,
    );
    const json = await res.json();
    const place = json?.results?.[0];
    if (!place) return null;
    return { latitude: place.latitude, longitude: place.longitude };
  } catch {
    return null;
  }
}

const AdminMap = () => {
  const [farmers, setFarmers] = useState<MappedFarmer[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

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
      latitude: null,
      longitude: null,
    }));

    setFarmers(mapped);

    const signed = await signAvatarUrls(
      rows.map((r) => r.avatar_path ?? '').filter(Boolean),
    );
    setAvatarUrls(signed);

    setLoading(false);

    // Geocode every unique address — even the ones with empty addresses
    // are skipped cleanly. Any farmer whose address resolves gets a pin.
    setGeocoding(true);
    try {
      const uniqueAddresses = Array.from(
        new Set(mapped.map((f) => f.barangay).filter(Boolean)),
      );

      const resolved = await Promise.all(
        uniqueAddresses.map(async (address) => ({
          address,
          coords: await geocodeAddress(address),
        })),
      );

      const byAddress = new Map(
        resolved
          .filter((r) => r.coords !== null)
          .map((r) => [r.address, r.coords!] as const),
      );

      setFarmers((current) =>
        current.map((f) => {
          const coords = byAddress.get(f.barangay);
          return coords
            ? {
                ...f,
                latitude: coords.latitude,
                longitude: coords.longitude,
              }
            : f;
        }),
      );
    } finally {
      setGeocoding(false);
    }
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
      const key = farmer.barangay || 'Address not recorded';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFarmers]);

  const locatedCount = filteredFarmers.filter(
    (f) => f.latitude !== null && f.longitude !== null,
  ).length;
  const unlocatedCount = filteredFarmers.length - locatedCount;

  const clearFilters = () => {
    setSearch('');
    setBarangayFilter(allFilter);
    setCropFilter(allFilter);
    setStatusFilter(allFilter);
    setSelectedFarmerId(null);
  };

  // ---- Leaflet: create map once ----
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.8797, 121.774],
      zoom: 5,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- Leaflet: update markers whenever the filtered set changes ----
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (groupRef.current) {
      map.removeLayer(groupRef.current);
      groupRef.current = null;
    }

    const withCoords = filteredFarmers.filter(
      (f) => f.latitude !== null && f.longitude !== null,
    );

    if (withCoords.length === 0) return;

    const group = L.featureGroup();

    // Fan out markers that share the same coordinate so they don't stack.
    const coordKey = (f: MappedFarmer) =>
      `${f.latitude!.toFixed(4)},${f.longitude!.toFixed(4)}`;
    const coordBuckets = new Map<string, MappedFarmer[]>();
    withCoords.forEach((f) => {
      const key = coordKey(f);
      const list = coordBuckets.get(key) ?? [];
      list.push(f);
      coordBuckets.set(key, list);
    });

    withCoords.forEach((farmer) => {
      const avatar = farmer.avatarPath
        ? avatarUrls[farmer.avatarPath]
        : null;

      const popupHtml = `
        <div style="display:flex;gap:8px;align-items:center;min-width:200px">
          ${
            avatar
              ? `<img src="${avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover" />`
              : `<div style="width:36px;height:36px;border-radius:50%;background:#eaf4ed;color:#34704d;display:grid;place-items:center;font-weight:800">${farmer.name
                  .slice(0, 1)
                  .toUpperCase()}</div>`
          }
          <div style="min-width:0">
            <div style="font-weight:700;font-size:12px;color:#26392e">${farmer.name}</div>
            <div style="font-size:11px;color:#849088">${farmer.barangay || 'Address not recorded'}</div>
            <div style="font-size:10px;color:#a2a89e;margin-top:2px">
              ${farmer.mainCrop} · ${farmer.farmCount} ${
                farmer.farmCount === 1 ? 'farm' : 'farms'
              }
            </div>
          </div>
        </div>
      `;

      // Custom pin: farmer photo if uploaded and reachable, initials otherwise.
      const initial = farmer.name.slice(0, 1).toUpperCase();

      const markerIcon = L.divIcon({
        className: 'farmer-marker',
        html: avatar
          ? `<div class="farmer-marker-pin farmer-marker-pin--photo">
               <img
                 src="${avatar}"
                 alt=""
                 onerror="this.parentNode.classList.remove('farmer-marker-pin--photo'); this.parentNode.textContent='${initial}';"
               />
             </div>`
          : `<div class="farmer-marker-pin">${initial}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 52],
        popupAnchor: [0, -48],
      });

      // Fan out markers that share a coordinate.
      const bucket = coordBuckets.get(coordKey(farmer)) ?? [];
      const idxInBucket = bucket.indexOf(farmer);
      const total = bucket.length;
      let lat = farmer.latitude as number;
      let lng = farmer.longitude as number;

      if (total > 1 && idxInBucket >= 0) {
        const angle = (idxInBucket / total) * Math.PI * 2;
        const offset = 0.0035; // ~350m, cosmetic fan-out
        lat += Math.cos(angle) * offset;
        lng += Math.sin(angle) * offset;
      }

      L.marker([lat, lng], { icon: markerIcon })
        .bindPopup(popupHtml)
        .addTo(group);
    });

    group.addTo(map);
    groupRef.current = group;

    try {
      map.fitBounds(group.getBounds().pad(0.3));
    } catch {
      // ignore; map stays at default
    }
  }, [filteredFarmers, avatarUrls]);

  return (
    <main className="farmers-map-page">
      <header className="farmers-map-page-heading">
        <div>
          <p className="farmers-map-eyebrow">GEOGRAPHIC DIRECTORY</p>
          <h1>Farmers Map</h1>
          <p className="farmers-map-description">
            Every registered farmer is listed below. Pins are barangay-level
            approximations from the address on file — not exact farm locations.
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
          <strong>Approximate locations only.</strong> Pins are placed at the
          center of the town parsed from each farmer's address. Farmers without
          an address appear in the sidebar list but have no pin.
        </p>
      </div>

      <section aria-label="Map summary" className="farmers-map-summary">
        <article>
          <span className="farmers-map-summary-icon">
            <Users size={17} />
          </span>
          <div>
            <span>Total farmers</span>
            <strong>{loading ? '—' : filteredFarmers.length}</strong>
          </div>
        </article>

        <article>
          <span className="farmers-map-summary-icon farmers-map-summary-icon--green">
            <MapPin size={17} />
          </span>
          <div>
            <span>Approximate locations</span>
            <strong>{loading || geocoding ? '…' : locatedCount}</strong>
          </div>
        </article>

        <article>
          <span className="farmers-map-summary-icon farmers-map-summary-icon--amber">
            <AlertTriangle size={17} />
          </span>
          <div>
            <span>No location on file</span>
            <strong>{loading || geocoding ? '…' : unlocatedCount}</strong>
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

      <section
        aria-label="Search and filter farmers"
        className="farmers-map-filters"
      >
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
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
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
                <option key={crop} value={crop}>
                  {crop}
                </option>
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
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </label>

        <button
          className="farmers-map-clear"
          onClick={clearFilters}
          type="button"
        >
          Clear filters
        </button>
      </section>

      <div className="farmers-map-content">
        <section aria-label="Map" className="farmers-map-panel">
          <header className="farmers-map-panel-header">
            <div>
              <h2>Map overview</h2>
              <p>
                {geocoding
                  ? 'Locating barangays…'
                  : `${locatedCount} pin${locatedCount === 1 ? '' : 's'} shown${
                      unlocatedCount > 0
                        ? ` · ${unlocatedCount} without a pin`
                        : ''
                    }`}
              </p>
            </div>
            <a
              href="https://www.openstreetmap.org/"
              rel="noreferrer"
              target="_blank"
            >
              Open map <ExternalLink size={13} />
            </a>
          </header>

          <div className="farmers-map-viewport">
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%' }}
            />
            {!geocoding && locatedCount === 0 && !loading && (
              <div className="farmers-map-empty-overlay">
                <span>
                  <MapPin size={20} />
                </span>
                <strong>No locations to plot</strong>
                <p>Addresses could not be geocoded.</p>
              </div>
            )}
          </div>

          <footer className="farmers-map-attribution">
            Map data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMap contributors
            </a>
            . Pins are barangay-level approximations.
          </footer>
        </section>

        <aside aria-label="All farmers" className="farmers-map-records">
          <header className="farmers-map-records-header">
            <div>
              <h2>All farmers</h2>
              <p>
                {loading
                  ? 'Loading…'
                  : `${filteredFarmers.length} of ${farmers.length} shown`}
              </p>
            </div>
            <span>
              {loading ? '—' : `${unlocatedCount} without a pin`}
            </span>
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
                    .filter(
                      (farmer) =>
                        (farmer.barangay || 'Address not recorded') ===
                        barangay,
                    )
                    .map((farmer) => {
                      const avatarUrl = farmer.avatarPath
                        ? avatarUrls[farmer.avatarPath]
                        : null;
                      const located =
                        farmer.latitude !== null && farmer.longitude !== null;
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
                                selectedFarmerId === farmer.id
                                  ? null
                                  : farmer.id,
                              )
                            }
                            type="button"
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={farmer.name}
                                className="farmers-map-record-avatar farmers-map-record-avatar--img"
                                onError={(e) => {
                                  // If the image fails, hide it so the initial circle
                                  // underneath isn't obscured.
                                  (e.currentTarget as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            ) : (
                              <span className="farmers-map-record-avatar">
                                {farmer.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}

                            <span className="farmers-map-record-copy">
                              <strong>{farmer.name}</strong>
                              <small>
                                {farmer.id.slice(0, 8).toUpperCase()} ·{' '}
                                {farmer.mainCrop} · {farmer.farmCount}{' '}
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
                                <MapPin size={13} />
                                {located
                                  ? 'Approximate pin · not exact farm'
                                  : 'Address could not be geocoded'}
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
            Every registered farmer appears here. Pins are barangay-level
            approximations.
          </footer>
        </aside>
      </div>
    </main>
  );
};

export default AdminMap;