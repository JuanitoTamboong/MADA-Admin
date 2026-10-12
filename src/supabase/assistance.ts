import { supabase } from './supabase-client';

export type AssistanceCategory =
  | 'Seeds'
  | 'Fertilizer'
  | 'Technical Assistance'
  | 'Pest Inspection'
  | 'Financial Subsidy';

export type AssistanceStatus =
  | 'Pending'
  | 'Approved'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';

export interface AdminAssistanceRequest {
  id: string;
  farmerName: string;
  farmerBarangay: string;
  category: AssistanceCategory;
  notes: string | null;
  adminNote: string | null;
  status: AssistanceStatus;
  createdAt: string;
}

interface AssistanceRequestRow {
  id: string;
  farmer_id: string;
  category: string;
  notes: string | null;
  admin_note: string | null;
  status: string;
  created_at: string;
}

interface FarmerRow {
  id: string;
  full_name: string;
  address: string | null;
}

const statuses: AssistanceStatus[] = [
  'Pending',
  'Approved',
  'In Progress',
  'Completed',
  'Rejected',
];

function normalizeStatus(status: string): AssistanceStatus {
  const matchingStatus = statuses.find(
    (candidate) => candidate.toLowerCase() === status.trim().toLowerCase(),
  );
  if (!matchingStatus) {
    throw new Error(`Unsupported assistance request status: ${status}`);
  }
  return matchingStatus;
}

export async function fetchAllAssistanceRequests(): Promise<
  AdminAssistanceRequest[]
> {
  const { data: requestData, error: requestError } = await supabase
    .from('assistance_requests')
    .select('id, farmer_id, category, notes, admin_note, status, created_at')
    .order('created_at', { ascending: false });

  if (requestError) throw new Error(requestError.message);

  const requestRows = (requestData ?? []) as AssistanceRequestRow[];
  const farmerIds = Array.from(
    new Set(requestRows.map((request) => request.farmer_id).filter(Boolean)),
  );
  const farmersById = new Map<string, FarmerRow>();

  if (farmerIds.length > 0) {
    const { data: farmerData, error: farmerError } = await supabase
      .from('farmers')
      .select('id, full_name, address')
      .in('id', farmerIds);

    if (farmerError) throw new Error(farmerError.message);

    for (const farmer of (farmerData ?? []) as FarmerRow[]) {
      farmersById.set(farmer.id, farmer);
    }
  }

  return requestRows.map((request) => {
    const farmer = farmersById.get(request.farmer_id);
    return {
      id: request.id,
      farmerName: farmer?.full_name ?? 'Unknown farmer',
      farmerBarangay: farmer?.address ?? '',
      category: request.category as AssistanceCategory,
      notes: request.notes,
      adminNote: request.admin_note,
      status: normalizeStatus(request.status),
      createdAt: request.created_at,
    };
  });
}

export async function setAssistanceRequestStatus(
  id: string,
  status: AssistanceStatus,
): Promise<void> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .update({ status })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('The assistance request could not be updated.');
}
