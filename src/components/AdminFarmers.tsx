import { useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  List,
  Map,
  MapPin,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import './AdminFarmers.css';

type FarmerStatus = 'Active' | 'Pending Verification' | 'Inactive';

interface FarmerFarm {
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
  phone: string;
  email: string;
  mainCrop: string;
  status: FarmerStatus;
  farms: FarmerFarm[];
  assistanceRequests: string[];
  reports: FarmerReport[];
}

const initialFarmers: Farmer[] = [
  {
    id: 'F-0001',
    name: 'Sample Farmer 001',
    barangay: 'Sample Barangay A',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: 'Rice',
    status: 'Active',
    farms: [{ name: 'Sample Rice Farm', crop: 'Rice', area: '1.5 ha' }],
    assistanceRequests: ['Seed assistance — Sample record'],
    reports: [{ id: 'R-0001', type: 'Water shortage', date: '2026-03-14', status: 'Advice Sent' }],
  },
  {
    id: 'F-0002',
    name: 'Sample Farmer 002',
    barangay: 'Sample Barangay B',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: 'Coconut',
    status: 'Pending Verification',
    farms: [{ name: 'Sample Coconut Farm', crop: 'Coconut', area: '2 ha' }],
    assistanceRequests: [],
    reports: [],
  },
  {
    id: 'F-0003',
    name: 'Sample Farmer 003',
    barangay: 'Sample Barangay A',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: 'Corn',
    status: 'Active',
    farms: [
      { name: 'Sample Corn Farm', crop: 'Corn', area: '1 ha' },
      { name: 'Sample Vegetable Farm', crop: 'Vegetables', area: '0.5 ha' },
    ],
    assistanceRequests: ['Training support — Sample record'],
    reports: [{ id: 'R-0002', type: 'Pest symptoms', date: '2026-04-19', status: 'Under Review' }],
  },
  {
    id: 'F-0004',
    name: 'Sample Farmer 004',
    barangay: 'Sample Barangay C',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: 'Rice',
    status: 'Inactive',
    farms: [{ name: 'Sample Mixed Farm', crop: 'Rice', area: '0.8 ha' }],
    assistanceRequests: [],
    reports: [],
  },
  {
    id: 'F-0005',
    name: 'Sample Farmer 005',
    barangay: 'Sample Barangay B',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: 'Coconut',
    status: 'Active',
    farms: [{ name: 'Sample Coconut Farm', crop: 'Coconut', area: '3 ha' }],
    assistanceRequests: ['Fertilizer assistance — Sample record'],
    reports: [{ id: 'R-0003', type: 'Soil erosion', date: '2026-06-01', status: 'Resolved' }],
  },
  {
    id: 'F-0006',
    name: 'Sample Farmer 006',
    barangay: 'Sample Barangay C',
    phone: 'Not provided',
    email: 'Not provided',
    mainCrop: '',
    status: 'Pending Verification',
    farms: [],
    assistanceRequests: [],
    reports: [],
  },
];

const statusOptions: FarmerStatus[] = ['Active', 'Pending Verification', 'Inactive'];
const allFilter = 'All';

interface FarmerFormProps {
  farmer: Farmer | null;
  onClose: () => void;
  onSave: (farmer: Farmer) => void;
}

function FarmerForm({ farmer, onClose, onSave }: FarmerFormProps) {
  const [name, setName] = useState(farmer?.name ?? '');
  const [barangay, setBarangay] = useState(farmer?.barangay ?? '');
  const [phone, setPhone] = useState(
    farmer?.phone === 'Not provided' ? '' : farmer?.phone ?? '',
  );
  const [crop, setCrop] = useState(farmer?.mainCrop ?? '');
  const [status, setStatus] = useState<FarmerStatus>(farmer?.status ?? 'Pending Verification');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      id: farmer?.id ?? '',
      name: name.trim(),
      barangay: barangay.trim(),
      phone: phone.trim() || 'Not provided',
      email: farmer?.email ?? 'Not provided',
      mainCrop: crop.trim(),
      status,
      farms:
        farmer?.farms.length
          ? farmer.farms.map((farm, index) => (index === 0 ? { ...farm, crop: crop.trim() } : farm))
          : [],
      assistanceRequests: farmer?.assistanceRequests ?? [],
      reports: farmer?.reports ?? [],
    });
  };

  return (
    <div className="farmers-modal-backdrop" onMouseDown={onClose}>
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
            <h2 id="farmer-form-title">{farmer ? 'Edit farmer' : 'Add farmer'}</h2>
          </div>
          <button aria-label="Close form" className="farmers-icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>
        <p className="farmers-modal-note">
          Enter verified information only. Changes are kept in this browser session and are not saved to a database.
        </p>
        <form className="farmer-form" onSubmit={handleSubmit}>
          <label>
            Farmer name
            <input autoFocus onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label>
            Barangay
            <input onChange={(event) => setBarangay(event.target.value)} required value={barangay} />
          </label>
          <label>
            Phone <span className="farmer-field-optional">Optional</span>
            <input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} value={phone} />
          </label>
          <label>
            Main crop <span className="farmer-field-optional">Optional</span>
            <input onChange={(event) => setCrop(event.target.value)} value={crop} />
          </label>
          <label className="farmer-status-field">
            Registration status
            <select onChange={(event) => setStatus(event.target.value as FarmerStatus)} value={status}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="farmers-modal-actions">
            <button className="farmers-button farmers-button--secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="farmers-button farmers-button--primary" type="submit">
              <Check size={16} />
              {farmer ? 'Save changes' : 'Add farmer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FarmerProfile({ farmer, onClose, onEdit }: { farmer: Farmer; onClose: () => void; onEdit: () => void }) {
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
            <div className="farmer-avatar">{farmer.name.slice(-3)}</div>
            <div>
              <p className="farmers-eyebrow">{farmer.id} · SAMPLE RECORD</p>
              <h2 id="farmer-profile-title">{farmer.name}</h2>
            </div>
          </div>
          <button aria-label="Close profile" className="farmers-icon-button" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>

        <div className="farmer-profile-summary">
          <span className={`farmer-status farmer-status--${farmer.status.toLowerCase().replaceAll(' ', '-')}`}>
            {farmer.status}
          </span>
          <span><MapPin size={15} /> {farmer.barangay}</span>
        </div>

        <div className="farmer-profile-section">
          <h3>Contact details</h3>
          <dl className="farmer-contact-grid">
            <div><dt>Phone</dt><dd>{farmer.phone}</dd></div>
            <div><dt>Email</dt><dd>{farmer.email}</dd></div>
          </dl>
        </div>

        <div className="farmer-profile-section">
          <h3>Farm records <span>{farmer.farms.length}</span></h3>
          {farmer.farms.length ? (
            <div className="farmer-profile-list">
              {farmer.farms.map((farm) => (
                <div className="farmer-detail-row" key={farm.name}>
                  <div><strong>{farm.name}</strong><span>{farm.crop}</span></div>
                  <span>{farm.area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="farmer-empty-detail">No farm records have been added.</p>
          )}
        </div>

        <div className="farmer-profile-section">
          <h3>Assistance-request history</h3>
          {farmer.assistanceRequests.length ? (
            <ul className="farmer-assistance-list">
              {farmer.assistanceRequests.map((request) => <li key={request}>{request}</li>)}
            </ul>
          ) : (
            <p className="farmer-empty-detail">No assistance requests in this sample record.</p>
          )}
        </div>

        <div className="farmer-profile-section">
          <h3>Submitted reports <span>{farmer.reports.length}</span></h3>
          {farmer.reports.length ? (
            <div className="farmer-profile-list">
              {farmer.reports.map((report) => (
                <div className="farmer-detail-row" key={report.id}>
                  <div><strong>{report.type}</strong><span>{report.id} · {report.date}</span></div>
                  <span className="farmer-report-status">{report.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="farmer-empty-detail">No submitted reports in this sample record.</p>
          )}
        </div>

        <div className="farmers-modal-actions">
          <button className="farmers-button farmers-button--secondary" onClick={onClose} type="button">
            Close
          </button>
          <button className="farmers-button farmers-button--primary" onClick={onEdit} type="button">
            <Pencil size={15} /> Edit farmer
          </button>
        </div>
      </section>
    </div>
  );
}

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState(initialFarmers);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [formFarmer, setFormFarmer] = useState<Farmer | null | undefined>(undefined);

  const barangays = useMemo(
    () => [...new Set(farmers.map((farmer) => farmer.barangay))].sort(),
    [farmers],
  );
  const crops = useMemo(
    () => [...new Set(farmers.flatMap((farmer) => farmer.farms.map((farm) => farm.crop)))].sort(),
    [farmers],
  );
  const filteredFarmers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return farmers.filter((farmer) => {
      const matchesSearch =
        !normalizedSearch ||
        [farmer.name, farmer.id, farmer.barangay, farmer.phone].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      const matchesCrop =
        cropFilter === allFilter || farmer.farms.some((farm) => farm.crop === cropFilter);
      return (
        matchesSearch &&
        (barangayFilter === allFilter || farmer.barangay === barangayFilter) &&
        matchesCrop &&
        (statusFilter === allFilter || farmer.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, farmers, search, statusFilter]);

  const saveFarmer = (farmer: Farmer) => {
    if (farmer.id) {
      setFarmers((current) => current.map((record) => (record.id === farmer.id ? farmer : record)));
    } else {
      const nextId = Math.max(0, ...farmers.map((record) => Number(record.id.slice(2)))) + 1;
      setFarmers((current) => [...current, { ...farmer, id: `F-${String(nextId).padStart(4, '0')}` }]);
    }
    setFormFarmer(undefined);
  };

  const editFarmer = (farmer: Farmer) => {
    setSelectedFarmer(null);
    setFormFarmer(farmer);
  };

  const activeCount = farmers.filter((farmer) => farmer.status === 'Active').length;
  const pendingCount = farmers.filter((farmer) => farmer.status === 'Pending Verification').length;
  const farmCount = farmers.reduce((total, farmer) => total + farmer.farms.length, 0);

  return (
    <main className="farmers-page">
      <header className="farmers-page-heading">
        <div>
          <p className="farmers-eyebrow">COMMUNITY DIRECTORY</p>
          <h1>Farmers</h1>
          <p className="farmers-page-description">Find and manage farmer records across the community.</p>
        </div>
        <button className="farmers-button farmers-button--primary" onClick={() => setFormFarmer(null)} type="button">
          <Plus size={17} /> Register farmer
        </button>
      </header>

      <div className="farmers-demo-notice">
        <ClipboardList size={17} />
        <p><strong>Sample data</strong> — These example records are for demonstration only. They are not verified and are not saved to a database.</p>
      </div>

      <section aria-label="Farmer directory summary" className="farmers-summary">
        <article className="farmers-summary-card">
          <div className="farmers-summary-icon"><Users size={18} /></div>
          <div><span>Total sample farmers</span><strong>{farmers.length}</strong></div>
        </article>
        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--green"><Check size={18} /></div>
          <div><span>Active</span><strong>{activeCount}</strong></div>
        </article>
        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--amber"><ClipboardList size={18} /></div>
          <div><span>Pending verification</span><strong>{pendingCount}</strong></div>
        </article>
        <article className="farmers-summary-card">
          <div className="farmers-summary-icon farmers-summary-icon--blue"><MapPin size={18} /></div>
          <div><span>Sample farm records</span><strong>{farmCount}</strong></div>
        </article>
      </section>

      <section aria-label="Farmer directory" className="farmers-directory-card">
        <div className="farmers-directory-heading">
          <div>
            <h2>Farmer directory</h2>
            <p>{filteredFarmers.length} {filteredFarmers.length === 1 ? 'record' : 'records'} shown</p>
          </div>
          <div aria-label="Directory view" className="farmers-view-toggle" role="group">
            <button
              aria-pressed={view === 'list'}
              className={view === 'list' ? 'farmers-view-button farmers-view-button--active' : 'farmers-view-button'}
              onClick={() => setView('list')}
              type="button"
            >
              <List size={15} /> List
            </button>
            <button
              aria-pressed={view === 'map'}
              className={view === 'map' ? 'farmers-view-button farmers-view-button--active' : 'farmers-view-button'}
              onClick={() => setView('map')}
              type="button"
            >
              <Map size={15} /> Map
            </button>
          </div>
        </div>
        <div className="farmers-filters">
          <label className="farmers-search">
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search farmers by name, ID, barangay, or phone"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, barangay..."
              value={search}
            />
          </label>
          <label className="farmers-filter">
            <span>Barangay</span>
            <select onChange={(event) => setBarangayFilter(event.target.value)} value={barangayFilter}>
              <option value={allFilter}>All barangays</option>
              {barangays.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
          <label className="farmers-filter">
            <span>Crop</span>
            <select onChange={(event) => setCropFilter(event.target.value)} value={cropFilter}>
              <option value={allFilter}>All crops</option>
              {crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
          <label className="farmers-filter">
            <span>Status</span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value={allFilter}>All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
        </div>

        {view === 'list' ? <div className="farmers-table-wrap">
          <table className="farmers-table">
            <thead>
              <tr>
                <th scope="col">Farmer ID</th>
                <th scope="col">Farmer</th>
                <th scope="col">Barangay</th>
                <th scope="col">Contact status</th>
                <th scope="col">Main crop</th>
                <th scope="col">Farms</th>
                <th scope="col">Registration status</th>
                <th scope="col"><span className="farmers-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>{farmer.id}</td>
                  <td>
                    <div className="farmer-table-identity">
                      <div className="farmer-avatar">{farmer.name.slice(-3)}</div>
                      <div><strong>{farmer.name}</strong></div>
                    </div>
                  </td>
                  <td>{farmer.barangay}</td>
                  <td>
                    <span className={`farmer-contact-status${farmer.phone === 'Not provided' ? ' farmer-contact-status--missing' : ''}`}>
                      {farmer.phone === 'Not provided' ? 'Not provided' : 'Available'}
                    </span>
                  </td>
                  <td>{farmer.mainCrop || 'Not recorded'}</td>
                  <td>{farmer.farms.length}</td>
                  <td>
                    <span className={`farmer-status farmer-status--${farmer.status.toLowerCase().replaceAll(' ', '-')}`}>
                      {farmer.status}
                    </span>
                  </td>
                  <td>
                    <div className="farmer-row-actions">
                      <button className="farmer-text-action" onClick={() => setSelectedFarmer(farmer)} type="button">
                        View profile
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
              ))}
              {filteredFarmers.length === 0 && (
                <tr>
                  <td className="farmers-empty-state" colSpan={8}>
                    No farmers match these search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div> : (
          <div className="farmers-map-overview">
            <div className="farmers-map-notice">
              <MapPin size={17} />
              <p><strong>Barangay-level overview · not to scale.</strong> No verified farmer or farm coordinates are available, so no map markers are shown.</p>
            </div>
            <div className="farmers-map-groups">
              {barangays
                .filter((name) => barangayFilter === allFilter || name === barangayFilter)
                .map((name) => {
                  const group = filteredFarmers.filter((farmer) => farmer.barangay === name);
                  return (
                    <section className="farmers-map-group" key={name}>
                      <header>
                        <span className="farmers-map-group-icon"><MapPin size={16} /></span>
                        <div><h3>{name}</h3><p>{group.length} matching {group.length === 1 ? 'farmer' : 'farmers'}</p></div>
                        <span className="farmers-map-count">{group.length}</span>
                      </header>
                      {group.length ? (
                        <ul>
                          {group.map((farmer) => (
                            <li key={farmer.id}>
                              <span className="farmer-map-record">
                                <strong>{farmer.name}</strong>
                                <span>{farmer.id} · {farmer.mainCrop || 'Crop not recorded'} · {farmer.farms.length} {farmer.farms.length === 1 ? 'farm' : 'farms'}</span>
                              </span>
                              <button className="farmer-text-action" onClick={() => setSelectedFarmer(farmer)} type="button">View profile</button>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="farmers-map-empty">No farmers match the current search and filters.</p>}
                    </section>
                  );
                })}
            </div>
            <p className="farmers-map-footnote"><FileText size={14} /> Records are grouped by their barangay only; this view does not imply precise or verified locations.</p>
          </div>
        )}
      </section>

      {selectedFarmer && (
        <FarmerProfile
          farmer={selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
          onEdit={() => editFarmer(selectedFarmer)}
        />
      )}
      {formFarmer !== undefined && (
        <FarmerForm farmer={formFarmer} onClose={() => setFormFarmer(undefined)} onSave={saveFarmer} />
      )}
    </main>
  );
};

export default AdminFarmers;
