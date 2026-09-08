import { supabase } from './supabase';
import type { EZPassRecord, EZPassDispute, EZPassSummary, DuplicateGroup, EZPassSource, EZPassStatus } from './ezpass-types';

// Obtener todos los registros de un mes
export async function fetchRecordsByMonth(year: number, month: number): Promise<EZPassRecord[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 
    ? `${year + 1}-01-01` 
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('ezpass_records')
    .select('*')
    .gte('trip_date', startDate)
    .lt('trip_date', endDate)
    .order('trip_date', { ascending: false })
    .order('trip_time', { ascending: false });

  if (error) throw error;
  return (data || []) as EZPassRecord[];
}

// Crear registro
export async function createRecord(record: Omit<EZPassRecord, 'id' | 'created_at' | 'updated_at'>): Promise<EZPassRecord> {
  const { data, error } = await supabase
    .from('ezpass_records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as EZPassRecord;
}

// Actualizar estado
export async function updateRecordStatus(id: string, status: EZPassStatus, duplicateOfId?: string): Promise<void> {
  const update: Partial<EZPassRecord> = { status };
  if (duplicateOfId) update.duplicate_of_id = duplicateOfId;

  const { error } = await supabase
    .from('ezpass_records')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

// Obtener resumen del mes
export async function fetchSummary(year: number, month: number): Promise<EZPassSummary> {
  const records = await fetchRecordsByMonth(year, month);

  const totalBilled = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const duplicatesDetected = records.filter(r => r.status === 'duplicate').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalRealToPay = records.filter(r => r.status !== 'duplicate').reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const verifiedCount = records.filter(r => r.status === 'verified').length;
  const disputedCount = records.filter(r => r.status === 'disputed').length;

  return {
    totalBilled: Number(totalBilled.toFixed(2)),
    duplicatesDetected: Number(duplicatesDetected.toFixed(2)),
    totalRealToPay: Number(totalRealToPay.toFixed(2)),
    pendingCount,
    verifiedCount,
    disputedCount,
  };
}

// Detectar duplicados por fecha + hora
export function detectDuplicates(records: EZPassRecord[]): { unique: EZPassRecord[]; duplicates: DuplicateGroup[] } {
  const groups = new Map<string, EZPassRecord[]>();
  
  for (const record of records) {
    const key = `${record.trip_date}|${record.trip_time || ''}`;
    const existing = groups.get(key) || [];
    existing.push(record);
    groups.set(key, existing);
  }

  const unique: EZPassRecord[] = [];
  const duplicates: DuplicateGroup[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      unique.push(group[0]);
    } else {
      // Mantener el primero como único, los demás como duplicados
      unique.push(group[0]);
      duplicates.push({
        records: group.slice(1),
        reason: `Misma fecha y hora que "${group[0].location}" (${group[0].trip_date} ${group[0].trip_time})`,
      });
    }
  }

  return { unique, duplicates };
}

// Obtener disputas
export async function fetchDisputes(): Promise<EZPassDispute[]> {
  const { data, error } = await supabase
    .from('ezpass_disputes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as EZPassDispute[];
}

// Crear disputa
export async function createDispute(recordId: string, evidenceUrls: string[] =[]): Promise<EZPassDispute> {
  const disputeNumber = `DIS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  
  const { data, error } = await supabase
    .from('ezpass_disputes')
    .insert({
      record_id: recordId,
      dispute_number: disputeNumber,
      evidence_urls: evidenceUrls,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as EZPassDispute;
}

// Filtrar registros por fuente
export function filterBySource(records: EZPassRecord[], source: EZPassSource | 'all'): EZPassRecord[] {
  if (source === 'all') return records;
  return records.filter(r => r.source === source);
}