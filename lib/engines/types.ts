/** Tipos del motor de briefing matutino (PaymentPlanner + CopilotPolicy). */

export type Severity = "ok" | "watch" | "action" | "urgent";
export type PayTier = "high" | "medium" | "ops_fund";
export type AiPayStatus = "PAY_NOW" | "PAY_MIN" | "RECOMMENDED" | "DEFER";
export type ObligationCategory = "rent" | "car" | "card" | "fuel" | "ops" | "other";
export type BankSource = "manual" | "ocr" | "seed";

export interface BankSnapshot {
  amount: number;
  verifiedAt: string | null;
  source: BankSource;
}

export interface ObligationInput {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO YYYY-MM-DD
  category: ObligationCategory;
  minPayment?: number;
  paidAmount?: number;
}

export interface PaymentPlanItem {
  obligationId: string;
  name: string;
  amount: number;
  recommendedAmount: number;
  dueDate: string;
  category: ObligationCategory;
  tier: PayTier;
  aiStatus: AiPayStatus;
  reason: string;
  daysUntilDue: number;
  score: number;
}

export interface PaymentPlan {
  high: PaymentPlanItem[];
  medium: PaymentPlanItem[];
  deferred: PaymentPlanItem[];
  opsFund: { amount: number; reason: string };
  generatedAt: string;
}

export interface CopilotNote {
  id: string;
  ts: string; // HH:mm
  severity: Severity;
  title: string;
  body: string;
  action?: { id: string; label: string };
}

export const AI_STATUS_LABEL: Record<AiPayStatus, string> = {
  PAY_NOW: "PAGAR AHORA",
  PAY_MIN: "PAGAR AHORA (MÍNIMO)",
  RECOMMENDED: "RECOMENDADO PAGAR",
  DEFER: "DIFERIR",
};

export const SAFE_MARGIN_DEFAULT = 300;
