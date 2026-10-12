import { supabase } from './supabase-client';

export type AnnouncementStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';
export type AnnouncementCategory =
  | 'Assistance'
  | 'Training'
  | 'Distribution Schedule'
  | 'Weather Advisory'
  | 'General';

export interface Announcement {
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
  imageUrl: string | null;   // ← NEW
}

// DB row shape (snake_case)
type AnnouncementRow = {
  id: string;
  title: string;
  category: AnnouncementCategory;
  audience: string;
  location: string;
  publish_date: string;
  expiry_date: string;
  status: AnnouncementStatus;
  summary: string;
  instructions: string;
  contact: string;
  image_url: string | null;  // ← NEW
};

const rowToAnnouncement = (row: AnnouncementRow): Announcement => ({
  id: row.id,
  title: row.title,
  category: row.category,
  audience: row.audience,
  location: row.location,
  publishDate: row.publish_date,
  expiryDate: row.expiry_date,
  status: row.status,
  summary: row.summary,
  instructions: row.instructions,
  contact: row.contact,
  imageUrl: row.image_url ?? null,
});

const toRowPayload = (
  a: Omit<Announcement, 'id'> & { id?: string },
): AnnouncementRow => ({
  id: a.id ?? crypto.randomUUID(),
  title: a.title,
  category: a.category,
  audience: a.audience,
  location: a.location,
  publish_date: a.publishDate,
  expiry_date: a.expiryDate,
  status: a.status,
  summary: a.summary,
  instructions: a.instructions,
  contact: a.contact,
  image_url: a.imageUrl,
});

// ============================================================
// CRUD
// ============================================================

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAnnouncement);
}

export async function createAnnouncement(
  payload: Omit<Announcement, 'id'>,
): Promise<Announcement> {
  const row = toRowPayload(payload);
  const { data, error } = await supabase
    .from('announcements')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToAnnouncement(data as AnnouncementRow);
}

export async function updateAnnouncement(
  id: string,
  payload: Omit<Announcement, 'id'>,
): Promise<Announcement> {
  const row = toRowPayload({ id, ...payload });
  const { data, error } = await supabase
    .from('announcements')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToAnnouncement(data as AnnouncementRow);
}

export async function setAnnouncementStatus(
  id: string,
  status: AnnouncementStatus,
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  // Grab the image URL first so we can clean up storage
  const { data: existing, error: fetchErr } = await supabase
    .from('announcements')
    .select('image_url')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Best-effort image cleanup — don't fail the delete if this errors
  if (existing?.image_url) {
    try {
      await deleteAnnouncementImage(existing.image_url);
    } catch (err) {
      console.warn('Row deleted, but image cleanup failed:', err);
    }
  }
}

// ============================================================
// Storage — image upload / delete
// ============================================================

const BUCKET = 'announcement-images';
const MAX_IMAGE_MB = 5;

export async function uploadAnnouncementImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAnnouncementImage(imageUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return; // not a file from our bucket — skip

  const path = imageUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}