import { useMemo, useState, type FormEvent } from 'react';
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

type CropStatus = 'Growing' | 'Ready to Harvest' | 'Harvested';
type QuantitySource = 'Farmer-reported' | 'Estimated' | 'Verified' | 'Not recorded';

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
  season: string;
  status: CropStatus;
  harvestQuantity: number | null;
  harvestUnit: string;
  harvestDate: string;
  quantitySource: QuantitySource;
  relatedReports: string[];
}

const initialRecords: CropRecord[] = [
  {
    id: 'C-2026-001',
    farmerId: 'F-0001',
    farmerName: 'Sample Farmer 001',
    farm: 'Sample Rice Farm',
    barangay: 'Sample Barangay A',
    crop: 'Rice',
    variety: 'Sample variety A',
    area: 1.5,
    plantingDate: '2026-06-12',
    expectedHarvest: '2026-10-20',
    season: 'Wet Season',
    status: 'Ready to Harvest',
    harvestQuantity: null,
    harvestUnit: 'kg',
    harvestDate: '',
    quantitySource: 'Not recorded',
    relatedReports: ['R-2026-013'],
  },
  {
    id: 'C-2026-002',
    farmerId: 'F-0003',
    farmerName: 'Sample Farmer 003',
    farm: 'Sample Corn Farm',
    barangay: 'Sample Barangay A',
    crop: 'Corn',
    variety: 'Sample variety B',
    area: 1,
    plantingDate: '2026-07-03',
    expectedHarvest: '2026-11-15',
    season: 'Wet Season',
    status: 'Growing',
    harvestQuantity: null,
    harvestUnit: 'kg',
    harvestDate: '',
    quantitySource: 'Not recorded',
    relatedReports: ['R-2026-014'],
  },
  {
    id: 'C-2026-003',
    farmerId: 'F-0003',
    farmerName: 'Sample Farmer 003',
    farm: 'Sample Vegetable Farm',
    barangay: 'Sample Barangay A',
    crop: 'Vegetables',
    variety: 'Sample leafy greens',
    area: 0.5,
    plantingDate: '2026-08-05',
    expectedHarvest: '2026-10-28',
    season: 'Wet Season',
    status: 'Growing',
    harvestQuantity: null,
    harvestUnit: 'kg',
    harvestDate: '',
    quantitySource: 'Not recorded',
    relatedReports: ['R-2026-010'],
  },
  {
    id: 'C-2026-004',
    farmerId: 'F-0002',
    farmerName: 'Sample Farmer 002',
    farm: 'Sample Coconut Farm',
    barangay: 'Sample Barangay B',
    crop: 'Coconut',
    variety: 'Sample variety C',
    area: 2,
    plantingDate: '2025-05-10',
    expectedHarvest: '2026-12-01',
    season: 'Dry Season',
    status: 'Growing',
    harvestQuantity: null,
    harvestUnit: 'kg',
    harvestDate: '',
    quantitySource: 'Not recorded',
    relatedReports: ['R-2026-011'],
  },
  {
    id: 'C-2026-005',
    farmerId: 'F-0004',
    farmerName: 'Sample Farmer 004',
    farm: 'Sample Mixed Farm',
    barangay: 'Sample Barangay C',
    crop: 'Rice',
    variety: 'Sample variety D',
    area: 0.8,
    plantingDate: '2026-01-18',
    expectedHarvest: '2026-05-26',
    season: 'Dry Season',
    status: 'Harvested',
    harvestQuantity: 1850,
    harvestUnit: 'kg',
    harvestDate: '2026-05-29',
    quantitySource: 'Farmer-reported',
    relatedReports: ['R-2026-009'],
  },
  {
    id: 'C-2026-006',
    farmerId: 'F-0005',
    farmerName: 'Sample Farmer 005',
    farm: 'Sample Coconut Farm',
    barangay: 'Sample Barangay B',
    crop: 'Coconut',
    variety: 'Sample variety E',
    area: 3,
    plantingDate: '2025-08-22',
    expectedHarvest: '2026-09-30',
    season: 'Wet Season',
    status: 'Harvested',
    harvestQuantity: 950,
    harvestUnit: 'kg',
    harvestDate: '2026-10-02',
    quantitySource: 'Verified',
    relatedReports: ['R-2026-012'],
  },
];

const statuses: CropStatus[] = ['Growing', 'Ready to Harvest', 'Harvested'];
const quantitySources: QuantitySource[] = ['Farmer-reported', 'Estimated', 'Verified', 'Not recorded'];
const cropOptions = [...new Set(initialRecords.map((record) => record.crop))];
const barangayOptions = [...new Set(initialRecords.map((record) => record.barangay))];
const seasonOptions = [...new Set(initialRecords.map((record) => record.season))];
const allFilter = 'All';

function formatDate(date: string) {
  if (!date) return 'Not set';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CropRecordFormProps {
  record: CropRecord;
  onClose: () => void;
  onSave: (record: CropRecord) => void;
}

function CropRecordForm({ record, onClose, onSave }: CropRecordFormProps) {
  const [status, setStatus] = useState(record.status);
  const [quantity, setQuantity] = useState(
    record.harvestQuantity === null ? '' : String(record.harvestQuantity),
  );
  const [unit, setUnit] = useState(record.harvestUnit);
  const [reportingDate, setReportingDate] = useState(record.harvestDate);
  const [source, setSource] = useState(record.quantitySource);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...record,
      status,
      harvestQuantity: quantity.trim() ? Number(quantity) : null,
      harvestUnit: unit.trim() || 'kg',
      harvestDate: reportingDate,
      quantitySource: quantity.trim() ? source : 'Not recorded',
    });
  };

  return (
    <div className="crops-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="crop-edit-title"
        aria-modal="true"
        className="crops-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="crops-modal-header">
          <div>
            <p className="crops-eyebrow">{record.id} · SAMPLE RECORD</p>
            <h2 id="crop-edit-title">Update crop record</h2>
            <p>{record.crop} · {record.farm} · {record.farmerName}</p>
          </div>
          <button aria-label="Close form" className="crops-icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </header>
        <p className="crops-modal-note">Changes are held for this browser session only; this prototype does not save to a database.</p>
        <form className="crops-form" onSubmit={submit}>
          <label>
            Production status
            <select onChange={(event) => setStatus(event.target.value as CropStatus)} value={status}>
              {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="crops-form-divider"><span>Harvest record</span></div>
          <label>
            Quantity <span className="crops-optional">Leave blank if not reported</span>
            <input min="0" onChange={(event) => setQuantity(event.target.value)} step="any" type="number" value={quantity} />
          </label>
          <label>
            Unit
            <select onChange={(event) => setUnit(event.target.value)} value={unit}>
              <option value="kg">Kilograms (kg)</option>
              <option value="sacks">Sacks</option>
              <option value="tons">Metric tons</option>
              <option value="pieces">Pieces</option>
            </select>
          </label>
          <label>
            Reporting date
            <input onChange={(event) => setReportingDate(event.target.value)} type="date" value={reportingDate} />
          </label>
          <label>
            Quantity source
            <select disabled={!quantity.trim()} onChange={(event) => setSource(event.target.value as QuantitySource)} value={quantity.trim() ? source : 'Not recorded'}>
              {quantitySources.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="crops-source-guidance">
            Mark a quantity as <strong>Verified</strong> only after an authorized staff member has confirmed it. Estimated and farmer-reported values are not verified harvest.
          </div>
          <footer className="crops-modal-actions">
            <button className="crops-button crops-button--secondary" onClick={onClose} type="button">Cancel</button>
            <button className="crops-button crops-button--primary" type="submit"><Pencil size={15} /> Save update</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CropDetails({ record, onClose, onEdit }: { record: CropRecord; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="crops-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="crop-detail-title"
        aria-modal="true"
        className="crops-modal crops-detail-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="crops-modal-header">
          <div>
            <p className="crops-eyebrow">{record.id} · SAMPLE RECORD</p>
            <h2 id="crop-detail-title">{record.crop} · {record.variety}</h2>
            <p>{record.farm} · {record.barangay}</p>
          </div>
          <button aria-label="Close details" className="crops-icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </header>
        <div className="crops-detail-status-row">
          <span className={`crop-status crop-status--${record.status.toLowerCase().replaceAll(' ', '-')}`}>{record.status}</span>
          <span>{record.season}</span>
        </div>
        <div className="crops-detail-grid">
          <div><span>Farmer</span><strong>{record.farmerName}</strong><a href="#farmers">Open farmer directory ↗</a></div>
          <div><span>Farm</span><strong>{record.farm}</strong><small>{record.farmerId}</small></div>
          <div><span>Barangay</span><strong>{record.barangay}</strong></div>
          <div><span>Planted area</span><strong>{record.area} ha</strong></div>
          <div><span>Planting date</span><strong>{formatDate(record.plantingDate)}</strong></div>
          <div><span>Expected harvest</span><strong>{formatDate(record.expectedHarvest)}</strong></div>
        </div>
        <section className="crops-detail-harvest">
          <h3>Harvest record</h3>
          {record.harvestQuantity === null ? (
            <p>No harvest quantity recorded.</p>
          ) : (
            <div className="crops-harvest-value">
              <strong>{record.harvestQuantity.toLocaleString()} {record.harvestUnit}</strong>
              <span className={`crop-source crop-source--${record.quantitySource.toLowerCase().replaceAll('-', '')}`}>
                {record.quantitySource}
              </span>
              <small>Reported {formatDate(record.harvestDate)}</small>
            </div>
          )}
          <p className="crops-detail-warning">Values are sample records; reported or estimated quantities are not verified harvest totals.</p>
        </section>
        <section className="crops-related-reports">
          <h3>Related farmer reports <span>{record.relatedReports.length}</span></h3>
          {record.relatedReports.length ? (
            <ul>{record.relatedReports.map((id) => <li key={id}><FileText size={14} /><a href="#reports">{id} · Open Reports</a></li>)}</ul>
          ) : <p>No related sample reports.</p>}
        </section>
        <footer className="crops-modal-actions">
          <button className="crops-button crops-button--secondary" onClick={onClose} type="button">Close</button>
          <button className="crops-button crops-button--primary" onClick={onEdit} type="button"><Pencil size={15} /> Update record</button>
        </footer>
      </section>
    </div>
  );
}

const CropProduction = () => {
  const [records, setRecords] = useState(initialRecords);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState(allFilter);
  const [seasonFilter, setSeasonFilter] = useState(allFilter);
  const [barangayFilter, setBarangayFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedRecord, setSelectedRecord] = useState<CropRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<CropRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [
        record.farmerId,
        record.farmerName,
        record.farm,
        record.id,
        record.crop,
        record.barangay,
      ].some((value) => value.toLowerCase().includes(query));
      return (
        matchesSearch &&
        (cropFilter === allFilter || record.crop === cropFilter) &&
        (seasonFilter === allFilter || record.season === seasonFilter) &&
        (barangayFilter === allFilter || record.barangay === barangayFilter) &&
        (statusFilter === allFilter || record.status === statusFilter)
      );
    });
  }, [barangayFilter, cropFilter, records, search, seasonFilter, statusFilter]);

  const totalArea = filteredRecords.reduce((total, record) => total + record.area, 0);
  const growingCount = filteredRecords.filter((record) => record.status === 'Growing').length;
  const readyCount = filteredRecords.filter((record) => record.status === 'Ready to Harvest').length;
  const updateRecord = (updated: CropRecord) => {
    setRecords((current) => current.map((record) => record.id === updated.id ? updated : record));
    setEditingRecord(null);
  };

  return (
    <main className="crops-page">
      <header className="crops-page-heading">
        <div>
          <p className="crops-eyebrow">FARM &amp; CROP RECORDS</p>
          <h1>Crops &amp; Production</h1>
          <p className="crops-page-description">Track crop progress and keep harvest records linked to farmers and farms.</p>
        </div>
        <div aria-hidden="true" className="crops-page-icon"><Sprout size={22} /></div>
      </header>

      <div className="crops-demo-notice">
        <ClipboardList size={17} />
        <p><strong>Sample records</strong> — All farmer, farm, crop, area, and harvest values are fictional examples and are not saved to a database.</p>
      </div>

      <section aria-label="Filtered crop record summary" className="crops-summary">
        <article><span className="crops-summary-icon"><Sprout size={17} /></span><div><span>Crop records</span><strong>{filteredRecords.length}</strong></div></article>
        <article><span className="crops-summary-icon crops-summary-icon--green"><MapPin size={17} /></span><div><span>Planted area</span><strong>{totalArea.toFixed(1)} ha</strong></div></article>
        <article><span className="crops-summary-icon crops-summary-icon--blue"><CalendarDays size={17} /></span><div><span>Growing</span><strong>{growingCount}</strong></div></article>
        <article><span className="crops-summary-icon crops-summary-icon--amber"><ClipboardList size={17} /></span><div><span>Ready to harvest</span><strong>{readyCount}</strong></div></article>
      </section>

      <section aria-label="Crop and production records" className="crops-directory">
        <header className="crops-directory-header">
          <div><h2>Crop records</h2><p>{filteredRecords.length} matching sample {filteredRecords.length === 1 ? 'record' : 'records'}</p></div>
          <span className="crops-sample-count"><FileText size={14} /> Sample data</span>
        </header>
        <div className="crops-filters">
          <label className="crops-search">
            <Search aria-hidden="true" size={16} />
            <input aria-label="Search crops, farms, farmers, or IDs" onChange={(event) => setSearch(event.target.value)} placeholder="Search crop, farm, farmer..." value={search} />
          </label>
          <label className="crops-filter"><span>Crop</span><div><select onChange={(event) => setCropFilter(event.target.value)} value={cropFilter}><option value={allFilter}>All crops</option>{cropOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <label className="crops-filter"><span>Season</span><div><select onChange={(event) => setSeasonFilter(event.target.value)} value={seasonFilter}><option value={allFilter}>All seasons</option>{seasonOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <label className="crops-filter"><span>Barangay</span><div><select onChange={(event) => setBarangayFilter(event.target.value)} value={barangayFilter}><option value={allFilter}>All barangays</option>{barangayOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
          <label className="crops-filter"><span>Status</span><div><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value={allFilter}>All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></label>
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
                <th scope="col">Season</th>
                <th scope="col">Status</th>
                <th scope="col">Harvest record</th>
                <th scope="col"><span className="crops-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td><div className="crops-farmer-cell"><strong>{record.farmerName}</strong><span>{record.farm} · {record.farmerId}</span></div></td>
                  <td>{record.barangay}</td>
                  <td><div className="crops-crop-cell"><strong>{record.crop}</strong><span>{record.variety}</span></div></td>
                  <td>{record.area} ha</td>
                  <td>{formatDate(record.plantingDate)}</td>
                  <td>{formatDate(record.expectedHarvest)}</td>
                  <td>{record.season}</td>
                  <td><span className={`crop-status crop-status--${record.status.toLowerCase().replaceAll(' ', '-')}`}>{record.status}</span></td>
                  <td>
                    {record.harvestQuantity === null ? (
                      <span className="crops-no-harvest">Not recorded</span>
                    ) : (
                      <span className="crops-harvest-cell">
                        <strong>{record.harvestQuantity.toLocaleString()} {record.harvestUnit}</strong>
                        <span className={`crop-source crop-source--${record.quantitySource.toLowerCase().replaceAll('-', '')}`}>{record.quantitySource}</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="crops-row-actions">
                      <button className="crops-text-button" onClick={() => setSelectedRecord(record)} type="button">View details</button>
                      <button aria-label={`Update ${record.crop} record for ${record.farmerName}`} className="crops-icon-button crops-edit-button" onClick={() => setEditingRecord(record)} type="button"><Pencil size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && <tr><td className="crops-empty" colSpan={10}>No crop records match these search and filter criteria.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="crops-record-note">Only farmer-reported, estimated, and verified quantities are shown with their source. Blank harvest records mean no quantity has been recorded.</p>
      </section>

      {selectedRecord && (
        <CropDetails
          onClose={() => setSelectedRecord(null)}
          onEdit={() => { setEditingRecord(selectedRecord); setSelectedRecord(null); }}
          record={selectedRecord}
        />
      )}
      {editingRecord && <CropRecordForm onClose={() => setEditingRecord(null)} onSave={updateRecord} record={editingRecord} />}
    </main>
  );
};

export default CropProduction;
