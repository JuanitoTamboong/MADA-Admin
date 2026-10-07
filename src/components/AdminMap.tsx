import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import './AdminMap.css';

type FarmerStatus = 'Active' | 'Pending Verification' | 'Inactive';

interface MappedFarmer {
  id: string;
  name: string;
  barangay: string;
  mainCrop: string;
  farmCount: number;
  status: FarmerStatus;
  verifiedCoordinates: { latitude: number; longitude: number } | null;
}

const sampleFarmers: MappedFarmer[] = [
  { id: 'F-0001', name: 'Sample Farmer 001', barangay: 'Sample Barangay A', mainCrop: 'Rice', farmCount: 1, status: 'Active', verifiedCoordinates: null },
  { id: 'F-0002', name: 'Sample Farmer 002', barangay: 'Sample Barangay B', mainCrop: 'Coconut', farmCount: 1, status: 'Pending Verification', verifiedCoordinates: null },
  { id: 'F-0003', name: 'Sample Farmer 003', barangay: 'Sample Barangay A', mainCrop: 'Corn', farmCount: 2, status: 'Active', verifiedCoordinates: null },
  { id: 'F-0004', name: 'Sample Farmer 004', barangay: 'Sample Barangay C', mainCrop: 'Rice', farmCount: 1, status: 'Inactive', verifiedCoordinates: null },
  { id: 'F-0005', name: 'Sample Farmer 005', barangay: 'Sample Barangay B', mainCrop: 'Coconut', farmCount: 1, status: 'Active', verifiedCoordinates: null },
  { id: 'F-0006', name: 'Sample Farmer 006', barangay: 'Sample Barangay C', mainCrop: 'Not recorded', farmCount: 0, status: 'Pending Verification', verifiedCoordinates: null },
];

const statuses: FarmerStatus[] = ['Active', 'Pending Verification', 'Inactive'];
const crops = [...new Set(sampleFarmers.map((farmer) => farmer.mainCrop).filter((crop) => crop !== 'Not recorded'))];
const barangays = [...new Set(sampleFarmers.map((farmer) => farmer.barangay))];
const allFilter = 'All';

const mapEmbedUrl =
  'https://www.openstreetmap.org/export/embed.html?bbox=116.5%2C4.5%2C127.5%2C21.5&layer=mapnik';

const AdminMap = () => {
  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sampleFarmers.filter((farmer) => {
      const matchesSearch = !query || [farmer.id, farmer.name].some((value) => value.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (barangayFilter === allFilter || farmer.barangay === barangayFilter) &&
        (cropFilter === allFilter || farmer.mainCrop === cropFilter) &&
        (statusFilter === allFilter || farmer.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, search, statusFilter]);

  const farmerCountByBarangay = useMemo(() => {
    const counts = new Map<string, number>();
    filteredFarmers.forEach((farmer) => {
      counts.set(farmer.barangay, (counts.get(farmer.barangay) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFarmers]);

  const locatedCount = filteredFarmers.filter((farmer) => farmer.verifiedCoordinates !== null).length;
  const unlocatedCount = filteredFarmers.length - locatedCount;

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
          <p className="farmers-map-description">Explore farmer coverage by barangay and view map locations when verified coordinates are available.</p>
        </div>
        <span className="farmers-map-title-icon"><MapIcon size={21} /></span>
      </header>

      <div className="farmers-map-demo-notice">
        <AlertTriangle size={17} />
        <p><strong>Sample records have no verified coordinates.</strong> No farmer markers are shown. Barangay labels and counts below are fictional demonstration data.</p>
      </div>

      <section aria-label="Map summary" className="farmers-map-summary">
        <article><span className="farmers-map-summary-icon"><Users size={17} /></span><div><span>Matching farmers</span><strong>{filteredFarmers.length}</strong></div></article>
        <article><span className="farmers-map-summary-icon farmers-map-summary-icon--green"><MapPin size={17} /></span><div><span>With verified locations</span><strong>{locatedCount}</strong></div></article>
        <article><span className="farmers-map-summary-icon farmers-map-summary-icon--amber"><AlertTriangle size={17} /></span><div><span>Location not on record</span><strong>{unlocatedCount}</strong></div></article>
        <article><span className="farmers-map-summary-icon farmers-map-summary-icon--blue"><MapIcon size={17} /></span><div><span>Barangays represented</span><strong>{farmerCountByBarangay.length}</strong></div></article>
      </section>

      <section aria-label="Search and filter farmers" className="farmers-map-filters">
        <label className="farmers-map-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search farmer by name or ID"
            onChange={(event) => { setSearch(event.target.value); setSelectedFarmerId(null); }}
            placeholder="Search farmer name or ID..."
            value={search}
          />
        </label>
        <label className="farmers-map-filter"><span>Barangay</span><div><select onChange={(event) => { setBarangayFilter(event.target.value); setSelectedFarmerId(null); }} value={barangayFilter}><option value={allFilter}>All barangays</option>{barangays.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select><ChevronDown size={14} /></div></label>
        <label className="farmers-map-filter"><span>Crop</span><div><select onChange={(event) => { setCropFilter(event.target.value); setSelectedFarmerId(null); }} value={cropFilter}><option value={allFilter}>All crops</option>{crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}</select><ChevronDown size={14} /></div></label>
        <label className="farmers-map-filter"><span>Registration status</span><div><select onChange={(event) => { setStatusFilter(event.target.value); setSelectedFarmerId(null); }} value={statusFilter}><option value={allFilter}>All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><ChevronDown size={14} /></div></label>
        <button className="farmers-map-clear" onClick={clearFilters} type="button">Clear filters</button>
      </section>

      <div className="farmers-map-content">
        <section aria-label="Map showing the Philippines" className="farmers-map-panel">
          <header className="farmers-map-panel-header">
            <div><h2>Map overview</h2><p>Philippines · map context only</p></div>
            <a href="https://www.openstreetmap.org/" rel="noreferrer" target="_blank">Open map <ExternalLink size={13} /></a>
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
              <p>Verified coordinates have not been added to these records.</p>
            </div>
          </div>
          <footer className="farmers-map-attribution">
            Map data © <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap contributors</a>. Base map only; no farmer locations are displayed.
          </footer>
        </section>

        <aside aria-label="Farmers without verified coordinates" className="farmers-map-records">
          <header className="farmers-map-records-header">
            <div><h2>Farmer list</h2><p>{filteredFarmers.length} matching {filteredFarmers.length === 1 ? 'record' : 'records'}</p></div>
            <span>{unlocatedCount} no location</span>
          </header>
          <div className="farmers-map-barangay-groups">
            {farmerCountByBarangay.map(([barangay, count]) => (
              <div className="farmers-map-barangay-group" key={barangay}>
                <header><MapPin size={14} /><strong>{barangay}</strong><span>{count}</span></header>
                <ul>
                  {filteredFarmers.filter((farmer) => farmer.barangay === barangay).map((farmer) => (
                    <li key={farmer.id}>
                      <button
                        aria-pressed={selectedFarmerId === farmer.id}
                        className={`farmers-map-record-button${selectedFarmerId === farmer.id ? ' farmers-map-record-button--selected' : ''}`}
                        onClick={() => setSelectedFarmerId(selectedFarmerId === farmer.id ? null : farmer.id)}
                        type="button"
                      >
                        <span className="farmers-map-record-avatar">{farmer.id.slice(-2)}</span>
                        <span className="farmers-map-record-copy">
                          <strong>{farmer.name}</strong>
                          <small>{farmer.id} · {farmer.mainCrop} · {farmer.farmCount} {farmer.farmCount === 1 ? 'farm' : 'farms'}</small>
                        </span>
                        <span className={`farmers-map-status farmers-map-status--${farmer.status.toLowerCase().replaceAll(' ', '-')}`}>{farmer.status}</span>
                      </button>
                      {selectedFarmerId === farmer.id && (
                        <div className="farmers-map-record-detail">
                          <p><MapPin size={13} /> Exact location not on record</p>
                          <a href="#farmers">View farmer profile <ExternalLink size={12} /></a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {filteredFarmers.length === 0 && <p className="farmers-map-empty-list">No farmers match these search and filter criteria.</p>}
          </div>
          <footer className="farmers-map-list-note">List and barangay counts use the same search and filters as the map.</footer>
        </aside>
      </div>
    </main>
  );
};

export default AdminMap;
