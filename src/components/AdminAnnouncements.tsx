import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Eye,
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
import '../css/AdminAnnouncements.css';

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(allFilter);
  const [statusFilter, setStatusFilter] = useState(allFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Create / Edit modal state
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAnnouncement, setDraftAnnouncement] =
    useState<Omit<Announcement, 'id'>>(createBlankAnnouncement());

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filteredAnnouncements = useMemo(
    () =>
      announcements.filter((announcement) => {
        const matchesSearch = `${announcement.title} ${announcement.location} ${announcement.audience}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === allFilter || announcement.category === categoryFilter;
        const matchesStatus =
          statusFilter === allFilter || announcement.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [announcements, categoryFilter, search, statusFilter],
  );

  // Keep selection valid as the filtered list changes
  useEffect(() => {
    if (filteredAnnouncements.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!filteredAnnouncements.some((a) => a.id === selectedId)) {
      setSelectedId(filteredAnnouncements[0].id);
    }
  }, [filteredAnnouncements, selectedId]);

  // Close composer on Escape
  useEffect(() => {
    if (!showComposer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeComposer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showComposer]);

  // Close preview on Escape
  useEffect(() => {
    if (!showPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPreview]);

  // Lock body scroll while either modal is open
  useEffect(() => {
    if (showComposer || showPreview) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showComposer, showPreview]);

  const selectedAnnouncement =
    filteredAnnouncements.find((announcement) => announcement.id === selectedId) ??
    null;

  const previewAnnouncement =
    announcements.find((a) => a.id === previewId) ?? null;

  const openComposerForCreate = () => {
    setEditingId(null);
    setDraftAnnouncement(createBlankAnnouncement());
    setShowComposer(true);
  };

  const openComposerForEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setDraftAnnouncement({
      title: announcement.title,
      category: announcement.category,
      audience: announcement.audience,
      location: announcement.location,
      publishDate: announcement.publishDate,
      expiryDate: announcement.expiryDate,
      status: announcement.status,
      summary: announcement.summary,
      instructions: announcement.instructions,
      contact: announcement.contact,
    });
    setShowComposer(true);
  };

  const closeComposer = () => {
    setShowComposer(false);
    setEditingId(null);
    setDraftAnnouncement(createBlankAnnouncement());
  };

  const openPreview = (id: string) => {
    setPreviewId(id);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewId(null);
  };

  const handleAnnouncementAction = (
    id: string,
    action: 'preview' | 'publish' | 'archive' | 'edit',
  ) => {
    if (action === 'preview') {
      openPreview(id);
      return;
    }

    if (action === 'edit') {
      const announcementToEdit = announcements.find((item) => item.id === id);
      if (announcementToEdit) openComposerForEdit(announcementToEdit);
      return;
    }

    setAnnouncements((current) =>
      current.map((announcement) => {
        if (announcement.id !== id) return announcement;
        if (action === 'publish') return { ...announcement, status: 'Published' };
        if (action === 'archive') return { ...announcement, status: 'Archived' };
        return announcement;
      }),
    );
  };

  const handleSaveAnnouncement = () => {
    if (
      !draftAnnouncement.title.trim() ||
      !draftAnnouncement.audience.trim() ||
      !draftAnnouncement.summary.trim()
    ) {
      return;
    }

    const sanitized = {
      title: draftAnnouncement.title.trim(),
      category: draftAnnouncement.category,
      audience: draftAnnouncement.audience.trim(),
      location: draftAnnouncement.location.trim() || 'Municipal agriculture office',
      publishDate: draftAnnouncement.publishDate,
      expiryDate: draftAnnouncement.expiryDate,
      status: draftAnnouncement.status,
      summary: draftAnnouncement.summary.trim(),
      instructions:
        draftAnnouncement.instructions.trim() ||
        'Review the notice and share the required guidance with the target audience.',
      contact:
        draftAnnouncement.contact.trim() || 'Municipal agriculture office',
    };

    if (editingId) {
      setAnnouncements((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...sanitized } : item,
        ),
      );
      setSelectedId(editingId);
    } else {
      const nextAnnouncement: Announcement = {
        id: `A-${Date.now()}`,
        ...sanitized,
      };
      setAnnouncements((current) => [nextAnnouncement, ...current]);
      setSelectedId(nextAnnouncement.id);
    }

    closeComposer();
  };

  const totalPublished = announcements.filter(
    (announcement) => announcement.status === 'Published',
  ).length;
  const totalScheduled = announcements.filter(
    (announcement) => announcement.status === 'Scheduled',
  ).length;
  const totalDrafts = announcements.filter(
    (announcement) => announcement.status === 'Draft',
  ).length;

  return (
    <main className="announcements-page">
      <header className="announcements-header">
        <div>
          <p className="announcements-eyebrow">OUTREACH &amp; UPDATES</p>
          <h1>Announcements</h1>
          <p>
            Share relevant office updates, support schedules, and farmer guidance
            without exposing private details.
          </p>
        </div>
        <button
          className="announcement-create-button"
          onClick={openComposerForCreate}
          type="button"
        >
          <Plus size={16} />
          Create announcement
        </button>
      </header>

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
          <select
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value={allFilter}>All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span><CalendarDays size={14} /> Status</span>
          <select
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
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
                className={`announcement-item${
                  selectedAnnouncement?.id === announcement.id ? ' is-selected' : ''
                }`}
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
                  <span className={statusClass(announcement.status)}>
                    {announcement.status}
                  </span>
                </div>
                <h2>{announcement.title}</h2>
                <p>{announcement.summary}</p>
                <div className="announcement-meta">
                  <span><MapPin size={12} /> {announcement.location}</span>
                  <span><Users size={12} /> {announcement.audience}</span>
                </div>
                <time dateTime={announcement.publishDate}>
                  Published {formatDate(announcement.publishDate)}
                </time>
              </article>
            ))
          ) : (
            <div className="announcement-empty-state">
              No announcements yet. Create one to get started.
            </div>
          )}
        </section>

        {selectedAnnouncement ? (
          <aside aria-live="polite" className="announcement-detail">
            <div className="announcement-detail-header">
              <div>
                <span className="announcement-chip">
                  {selectedAnnouncement.category}
                </span>
                <h2>{selectedAnnouncement.title}</h2>
              </div>
              <span className={statusClass(selectedAnnouncement.status)}>
                {selectedAnnouncement.status}
              </span>
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
                onClick={() =>
                  handleAnnouncementAction(selectedAnnouncement.id, 'preview')
                }
                type="button"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                className="action primary"
                onClick={() =>
                  handleAnnouncementAction(selectedAnnouncement.id, 'publish')
                }
                type="button"
              >
                <Send size={14} /> Publish
              </button>
              <button
                className="action secondary"
                onClick={() =>
                  handleAnnouncementAction(selectedAnnouncement.id, 'edit')
                }
                type="button"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="action danger"
                onClick={() =>
                  handleAnnouncementAction(selectedAnnouncement.id, 'archive')
                }
                type="button"
              >
                <Archive size={14} /> Archive
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      {/* ---------------- CREATE / EDIT MODAL ---------------- */}
      {showComposer ? (
        <div
          className="announcement-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Edit announcement' : 'Create announcement'}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeComposer();
          }}
        >
          <section className="announcement-modal">
            <div className="announcement-composer-header">
              <h2>{editingId ? 'Edit announcement' : 'Create announcement'}</h2>
              <button
                aria-label="Close announcement form"
                className="announcement-close-button"
                onClick={closeComposer}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="announcement-composer-grid">
              <label>
                <span>Title</span>
                <input
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Farmer support schedule"
                  type="text"
                  value={draftAnnouncement.title}
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      category: event.target.value as AnnouncementCategory,
                    }))
                  }
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
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      audience: event.target.value,
                    }))
                  }
                  placeholder="Rice farmers"
                  type="text"
                  value={draftAnnouncement.audience}
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Barangay A"
                  type="text"
                  value={draftAnnouncement.location}
                />
              </label>
              <label>
                <span>Publish date</span>
                <input
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      publishDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={draftAnnouncement.publishDate}
                />
              </label>
              <label>
                <span>Expiry date</span>
                <input
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      expiryDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={draftAnnouncement.expiryDate}
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      status: event.target.value as AnnouncementStatus,
                    }))
                  }
                  value={draftAnnouncement.status}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="announcement-composer-full">
                <span>Summary</span>
                <textarea
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  placeholder="Add a short message farmers need to know."
                  rows={3}
                  value={draftAnnouncement.summary}
                />
              </label>
              <label className="announcement-composer-full">
                <span>Instructions</span>
                <textarea
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                  placeholder="Include dates, eligibility, and office contact details."
                  rows={3}
                  value={draftAnnouncement.instructions}
                />
              </label>
              <label className="announcement-composer-full">
                <span>Office contact</span>
                <input
                  onChange={(event) =>
                    setDraftAnnouncement((current) => ({
                      ...current,
                      contact: event.target.value,
                    }))
                  }
                  placeholder="Municipal agriculture office"
                  type="text"
                  value={draftAnnouncement.contact}
                />
              </label>
            </div>

            <div className="announcement-composer-actions">
              <button
                className="action secondary"
                onClick={closeComposer}
                type="button"
              >
                Cancel
              </button>
              <button
                className="action primary"
                onClick={handleSaveAnnouncement}
                type="button"
              >
                <Save size={14} />
                {editingId ? 'Update announcement' : 'Save announcement'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* ---------------- PREVIEW MODAL (public-facing look) ---------------- */}
      {showPreview && previewAnnouncement ? (
        <div
          className="announcement-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Announcement preview"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePreview();
          }}
        >
          <section className="announcement-modal announcement-preview">
            <div className="announcement-composer-header">
              <h2>Preview — public view</h2>
              <button
                aria-label="Close preview"
                className="announcement-close-button"
                onClick={closePreview}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <article className="preview-body">
              <p className="preview-eyebrow">MUNICIPAL AGRICULTURE OFFICE</p>

              <span className="announcement-chip">
                {previewAnnouncement.category}
              </span>

              <h1 className="preview-title">{previewAnnouncement.title}</h1>

              <ul className="preview-meta">
                <li>
                  <CalendarDays size={14} />
                  {formatDate(previewAnnouncement.publishDate)} –{' '}
                  {formatDate(previewAnnouncement.expiryDate)}
                </li>
                <li><MapPin size={14} /> {previewAnnouncement.location}</li>
                <li><Users size={14} /> {previewAnnouncement.audience}</li>
              </ul>

              <section className="preview-block">
                <h3>Summary</h3>
                <p>{previewAnnouncement.summary}</p>
              </section>

              <section className="preview-block">
                <h3>Instructions</h3>
                <p>{previewAnnouncement.instructions}</p>
              </section>

              <section className="preview-block preview-contact">
                <h3>Contact</h3>
                <p>{previewAnnouncement.contact}</p>
              </section>
            </article>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default AdminAnnouncements;