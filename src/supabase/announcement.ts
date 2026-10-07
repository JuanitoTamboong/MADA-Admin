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
});

const toRowPayload = (
  a: Omit<Announcement, 'id'> & { id?: string },
): AnnouncementRow => ({
  id: a.id ?? `A-${Date.now()}`,
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
});

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
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}