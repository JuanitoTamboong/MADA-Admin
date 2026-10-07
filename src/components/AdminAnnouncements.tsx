import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Filter,
  MapPin,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import './AdminAnnouncements.css';

type AnnouncementStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';
type AnnouncementCategory =
  | 'Assistance'
  | 'Training'
  | 'Distribution Schedule'
  | 'Weather Advisory'
  | 'General';

interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  audience: string;
  location: string;
  publishDate: string;
  expiryDate: string;
  status: AnnouncementStatus;
  summary: string;
  instructions: string;
  contact: string;
}

const allFilter = 'All';
const initialAnnouncements: Announcement[] = [
  {
    id: 'A-101',
    title: 'Rice planting support schedule',
    category: 'Assistance',
    audience: 'Rice farmers',
    location: 'Barangay A and B',
    publishDate: '2026-10-05',
    expiryDate: '2026-10-20',
    status: 'Published',
    summary: 'Seed and fertilizer support will be released by barangay planning staff on the assigned dates.',
    instructions: 'Bring your farmer ID, the farm registration form, and the latest crop record if available.',
    contact: 'Office of the Municipal Agriculture Coordinator',
  },
  {
    id: 'A-102',
    title: 'Farmer training on soil management',
    category: 'Training',
    audience: 'Vegetable and corn growers',
    location: 'Barangay C training center',
    publishDate: '2026-10-08',
    expiryDate: '2026-10-12',
    status: 'Scheduled',
    summary: 'A half-day training will cover soil testing, compost production, and safe fertilizer use.',
    instructions: 'Participants should attend from 8:00 AM to 12:00 PM and bring a notebook or phone for notes.',
    contact: 'Agriculture Extension Office',
  },
  {
    id: 'A-103',
    title: 'Distribution schedule for irrigation equipment',
    category: 'Distribution Schedule',
    audience: 'Registered farmers with irrigation needs',
    location: 'Municipal agriculture shed',
    publishDate: '2026-10-01',
    expiryDate: '2026-10-18',
    status: 'Published',
    summary: 'Farmers eligible for the equipment grant may claim their allocation during the next distribution window.',
    instructions: 'Check your eligibility and bring the signed acknowledgement form from the barangay office.',
    contact: 'Municipal agriculture office',
  },
  {
    id: 'A-104',
    title: 'Heavy rain precaution advisory',
    category: 'Weather Advisory',
    audience: 'All crop growers',
    location: 'Barangay A, B, and C',
    publishDate: '2026-10-06',
    expiryDate: '2026-10-10',
    status: 'Draft',
    summary: 'Rainfall may affect drainage and access roads in low-lying farms. Farmers should review field conditions before work.',
    instructions: 'Secure equipment, check drainage channels, and avoid entering flooded areas after strong rainfall.',
    contact: 'Municipal disaster and agriculture desk',
  },
  {
    id: 'A-105',
    title: 'General reminder: update crop records',
    category: 'General',
    audience: 'All registered farmers',
    location: 'Municipal agriculture office',
    publishDate: '2026-09-28',
    expiryDate: '2026-11-15',
    status: 'Archived',
    summary: 'All farmers are encouraged to update crop and farm records before the next community assessment cycle.',
    instructions: 'Bring or submit your relevant records through the barangay agriculture desk or the office counters.',
    contact: 'Barangay agriculture desk',
  },
];

const categories: AnnouncementCategory[] = [
  'Assistance',
  'Training',
  'Distribution Schedule',
  'Weather Advisory',
  'General',
];
const statuses: AnnouncementStatus[] = ['Draft', 'Published', 'Scheduled', 'Archived'];
const createBlankAnnouncement = (): Omit<Announcement, 'id'> => ({
  title: '',
  category: 'General',
  audience: '',
  location: '',
  publishDate: new Date().toISOString().slice(0, 10),
  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: 'Draft',
  summary: '',
  instructions: '',
  contact: '',
});

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const statusClass = (status: AnnouncementStatus) =>
  `announcement-status announcement-status--${status.toLowerCase()}`;

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedId, setSelectedId] = useState(initialAnnouncements[0].id);
  const [showComposer, setShowComposer] = useState(false);
  const [draftAnnouncement, setDraftAnnouncement] = useState<Omit<Announcement, 'id'>>(createBlankAnnouncement());

  const filteredAnnouncements = useMemo(
    () =>
      announcements.filter((announcement) => {
        const matchesSearch = `${announcement.title} ${announcement.location} ${announcement.audience}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory = categoryFilter === allFilter || announcement.category === categoryFilter;
        const matchesStatus = statusFilter === allFilter || announcement.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [announcements, categoryFilter, search, statusFilter],
  );

  useEffect(() => {
    if (!filteredAnnouncements.some((announcement) => announcement.id === selectedId) && filteredAnnouncements[0]) {
      setSelectedId(filteredAnnouncements[0].id);
    }
  }, [filteredAnnouncements, selectedId]);

  const selectedAnnouncement =
    filteredAnnouncements.find((announcement) => announcement.id === selectedId) ?? filteredAnnouncements[0] ?? null;

  const handleAnnouncementAction = (id: string, action: 'preview' | 'publish' | 'archive' | 'edit') => {
    setAnnouncements((current) =>
      current.map((announcement) => {
        if (announcement.id !== id) return announcement;

        if (action === 'publish') return { ...announcement, status: 'Published' };
        if (action === 'archive') return { ...announcement, status: 'Archived' };
        if (action === 'edit') return { ...announcement, status: 'Draft' };
        return announcement;
      }),
    );

    if (action === 'preview') setSelectedId(id);
    if (action === 'edit') {
      const announcementToEdit = announcements.find((item) => item.id === id);
      if (announcementToEdit) {
        setDraftAnnouncement({
          title: announcementToEdit.title,
          category: announcementToEdit.category,
          audience: announcementToEdit.audience,
          location: announcementToEdit.location,
          publishDate: announcementToEdit.publishDate,
          expiryDate: announcementToEdit.expiryDate,
          status: announcementToEdit.status,
          summary: announcementToEdit.summary,
          instructions: announcementToEdit.instructions,
          contact: announcementToEdit.contact,
        });
        setShowComposer(true);
      }
    }
  };

  const handleSaveAnnouncement = () => {
    if (!draftAnnouncement.title.trim() || !draftAnnouncement.audience.trim() || !draftAnnouncement.summary.trim()) {
      return;
    }

    const nextAnnouncement: Announcement = {
      id: `A-${Date.now()}`,
      title: draftAnnouncement.title.trim(),
      category: draftAnnouncement.category,
      audience: draftAnnouncement.audience.trim(),
      location: draftAnnouncement.location.trim() || 'Municipal agriculture office',
      publishDate: draftAnnouncement.publishDate,
      expiryDate: draftAnnouncement.expiryDate,
      status: draftAnnouncement.status,
      summary: draftAnnouncement.summary.trim(),
      instructions: draftAnnouncement.instructions.trim() || 'Review the notice and share the required guidance with the target audience.',
      contact: draftAnnouncement.contact.trim() || 'Municipal agriculture office',
    };

    setAnnouncements((current) => [nextAnnouncement, ...current]);
    setSelectedId(nextAnnouncement.id);
    setShowComposer(false);
    setDraftAnnouncement(createBlankAnnouncement());
  };

  const totalPublished = announcements.filter((announcement) => announcement.status === 'Published').length;
  const totalScheduled = announcements.filter((announcement) => announcement.status === 'Scheduled').length;
  const totalDrafts = announcements.filter((announcement) => announcement.status === 'Draft').length;

  return (
    <main className="announcements-page">
      <header className="announcements-header">
        <div>
          <p className="announcements-eyebrow">OUTREACH & UPDATES</p>
          <h1>Announcements</h1>
          <p>Share relevant office updates, support schedules, and farmer guidance without exposing private details.</p>
        </div>
        <button
          className="announcement-create-button"
          onClick={() => {
            setDraftAnnouncement(createBlankAnnouncement());
            setShowComposer(true);
          }}
          type="button"
        >
          <Plus size={16} />
          Create announcement
        </button>
      </header>

      {showComposer ? (
        <section aria-label="Create announcement form" className="announcement-composer">
          <div className="announcement-composer-header">
            <h2>Create announcement</h2>
            <button
              aria-label="Close announcement form"
              className="announcement-close-button"
              onClick={() => setShowComposer(false)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>

          <div className="announcement-composer-grid">
            <label>
              <span>Title</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, title: event.target.value }))}
                placeholder="Farmer support schedule"
                type="text"
                value={draftAnnouncement.title}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, category: event.target.value as AnnouncementCategory }))}
                value={draftAnnouncement.category}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Audience</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, audience: event.target.value }))}
                placeholder="Rice farmers"
                type="text"
                value={draftAnnouncement.audience}
              />
            </label>
            <label>
              <span>Location</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, location: event.target.value }))}
                placeholder="Barangay A"
                type="text"
                value={draftAnnouncement.location}
              />
            </label>
            <label>
              <span>Publish date</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, publishDate: event.target.value }))}
                type="date"
                value={draftAnnouncement.publishDate}
              />
            </label>
            <label>
              <span>Expiry date</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, expiryDate: event.target.value }))}
                type="date"
                value={draftAnnouncement.expiryDate}
              />
            </label>
            <label className="announcement-composer-full">
              <span>Summary</span>
              <textarea
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Add a short message farmers need to know."
                rows={3}
                value={draftAnnouncement.summary}
              />
            </label>
            <label className="announcement-composer-full">
              <span>Instructions</span>
              <textarea
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, instructions: event.target.value }))}
                placeholder="Include dates, eligibility, and office contact details."
                rows={3}
                value={draftAnnouncement.instructions}
              />
            </label>
            <label className="announcement-composer-full">
              <span>Office contact</span>
              <input
                onChange={(event) => setDraftAnnouncement((current) => ({ ...current, contact: event.target.value }))}
                placeholder="Municipal agriculture office"
                type="text"
                value={draftAnnouncement.contact}
              />
            </label>
          </div>

          <div className="announcement-composer-actions">
            <button className="action secondary" onClick={() => setShowComposer(false)} type="button">
              Cancel
            </button>
            <button className="action primary" onClick={handleSaveAnnouncement} type="button">
              <Save size={14} /> Save announcement
            </button>
          </div>
        </section>
      ) : null}

      <section aria-label="Announcement summary" className="announcement-summary-grid">
        <article className="summary-card summary-card--green">
          <span className="summary-icon"><Megaphone size={18} /></span>
          <div>
            <span>Total</span>
            <strong>{announcements.length}</strong>
          </div>
        </article>
        <article className="summary-card summary-card--blue">
          <span className="summary-icon"><CheckCircle2 size={18} /></span>
          <div>
            <span>Published</span>
            <strong>{totalPublished}</strong>
          </div>
        </article>
        <article className="summary-card summary-card--amber">
          <span className="summary-icon"><CalendarDays size={18} /></span>
          <div>
            <span>Scheduled</span>
            <strong>{totalScheduled}</strong>
          </div>
        </article>
        <article className="summary-card summary-card--purple">
          <span className="summary-icon"><Sparkles size={18} /></span>
          <div>
            <span>Drafts</span>
            <strong>{totalDrafts}</strong>
          </div>
        </article>
      </section>

      <section aria-label="Announcement filters" className="announcement-toolbar">
        <label className="announcement-search">
          <Search size={14} />
          <input
            aria-label="Search announcements"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, barangay, or audience"
            type="search"
            value={search}
          />
        </label>
        <label>
          <span><Filter size={14} /> Category</span>
          <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option value={allFilter}>All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span><CalendarDays size={14} /> Status</span>
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value={allFilter}>All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="announcement-layout">
        <section aria-label="Announcement list" className="announcement-list">
          {filteredAnnouncements.length ? (
            filteredAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                aria-pressed={selectedAnnouncement?.id === announcement.id}
                className={`announcement-item${selectedAnnouncement?.id === announcement.id ? ' is-selected' : ''}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedId(announcement.id);
                  }
                }}
                onClick={() => setSelectedId(announcement.id)}
                role="button"
                tabIndex={0}
              >
                <div className="announcement-item-topline">
                  <span className="announcement-chip">{announcement.category}</span>
                  <span className={statusClass(announcement.status)}>{announcement.status}</span>
                </div>
                <h2>{announcement.title}</h2>
                <p>{announcement.summary}</p>
                <div className="announcement-meta">
                  <span><MapPin size={12} /> {announcement.location}</span>
                  <span><Users size={12} /> {announcement.audience}</span>
                </div>
                <time dateTime={announcement.publishDate}>Published {formatDate(announcement.publishDate)}</time>
              </article>
            ))
          ) : (
            <div className="announcement-empty-state">No announcements match the selected filters.</div>
          )}
        </section>

        {selectedAnnouncement ? (
          <aside aria-live="polite" className="announcement-detail">
            <div className="announcement-detail-header">
              <div>
                <span className="announcement-chip">{selectedAnnouncement.category}</span>
                <h2>{selectedAnnouncement.title}</h2>
              </div>
              <span className={statusClass(selectedAnnouncement.status)}>{selectedAnnouncement.status}</span>
            </div>

            <div className="announcement-detail-grid">
              <div>
                <label>Audience</label>
                <p>{selectedAnnouncement.audience}</p>
              </div>
              <div>
                <label>Location</label>
                <p>{selectedAnnouncement.location}</p>
              </div>
              <div>
                <label>Publish date</label>
                <p>{formatDate(selectedAnnouncement.publishDate)}</p>
              </div>
              <div>
                <label>Expiry date</label>
                <p>{formatDate(selectedAnnouncement.expiryDate)}</p>
              </div>
            </div>

            <div className="announcement-detail-text">
              <label>Summary</label>
              <p>{selectedAnnouncement.summary}</p>
            </div>

            <div className="announcement-detail-text">
              <label>Instructions</label>
              <p>{selectedAnnouncement.instructions}</p>
            </div>

            <div className="announcement-contact-box">
              <label>Office contact</label>
              <p>{selectedAnnouncement.contact}</p>
            </div>

            <div className="announcement-actions">
              <button
                className="action secondary"
                onClick={() => handleAnnouncementAction(selectedAnnouncement.id, 'preview')}
                type="button"
              >
                <Search size={14} /> Preview
              </button>
              <button
                className="action primary"
                onClick={() => handleAnnouncementAction(selectedAnnouncement.id, 'publish')}
                type="button"
              >
                <Send size={14} /> Publish
              </button>
              <button
                className="action secondary"
                onClick={() => handleAnnouncementAction(selectedAnnouncement.id, 'edit')}
                type="button"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="action danger"
                onClick={() => handleAnnouncementAction(selectedAnnouncement.id, 'archive')}
                type="button"
              >
                <Archive size={14} /> Archive
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
};

export default AdminAnnouncements;
