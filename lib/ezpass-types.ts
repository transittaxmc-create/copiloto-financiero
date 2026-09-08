// Tipos para el Sistema de Reconciliación E-ZPass

export type EZPassSource = 'gps' | 'screenshot' | 'ezpass_statement' | 'company_invoice';
export type EZPassStatus = 'pending' | 'verified' | 'duplicate' | 'disputed' | 'resolved';
export type DisputeStatus = 'pending' | 'sent' | 'resolved' | 'rejected';

export interface EZPassRecord {
  id: string;
  user_id?: string | null;
  source: EZPassSource;
  location: string;
  amount: number;
  trip_date: string;
  trip_time?: string | null;
  reference_number?: string | null;
  notes?: string;
  status: EZPassStatus;
  duplicate_of_id?: string | null;
  evidence_urls?: string[];
  screenshot_url?: string | null;
  is_personal_expense?: boolean;
  is_company_expense?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EZPassDispute {
  id: string;
  user_id?: string | null;
  record_id: string;
  dispute_number: string;
  dispute_date: string;
  status: DisputeStatus;
  pdf_url?: string | null;
  evidence_urls?: string[];
  response_notes?: string;
  resolved_at?: string | null;
  resolved_amount?: number | null;
  created_at: string;
}

export interface EZPassSummary {
  totalBilled: number;
  duplicatesDetected: number;
  totalRealToPay: number;
  pendingCount: number;
  verifiedCount: number;
  disputedCount: number;
}

export interface DuplicateGroup {
  records: EZPassRecord[];
  reason: string;
}

// Helpers para colores y labels por fuente
export const SOURCE_CONFIG: Record<EZPassSource, { label: string; icon: string; color: string }> = {
  gps: { label: 'GPS', icon: '📍', color: 'text-sky-400' },
  screenshot: { label: 'Screenshot', icon: '📷', color: 'text-purple-400' },
  ezpass_statement: { label: 'E-ZPass', icon: '🧾', color: 'text-emerald-400' },
  company_invoice: { label: 'Compañía', icon: '🏢', color: 'text-amber-400' },
};

export const STATUS_CONFIG: Record<EZPassStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  verified: { label: 'Verificado', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  duplicate: { label: 'Duplicado', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  disputed: { label: 'En Disputa', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  resolved: { label: 'Resuelto', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
};