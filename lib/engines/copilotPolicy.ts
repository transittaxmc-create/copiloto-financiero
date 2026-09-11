import type { CopilotNote, PaymentPlan, Severity } from "./types";

export interface BriefingPolicyInput {
  balance: number;
  isVerifiedToday: boolean;
  emergency: {
    hasDeficit: boolean;
    deficitAmount: number;
    targetPaymentName: string;
    daysRemaining: number;
    suggestedDailyIncrease: number;
  };
  plan: PaymentPlan;
  bills7d: number;
  surplus: { amount: number; isSafe: boolean };
  workingDaysRemaining: number;
  previousBalance?: number | null;
  now?: Date;
}

function hhmm(d: Date): string {
  return d.toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const rank: Record<Severity, number> = {
  urgent: 0,
  action: 1,
  watch: 2,
  ok: 3,
};

/**
 * Reglas deterministas del inbox matutino. Sin LLM en Parte 1.
 * Máx 5 notas, orden por severidad.
 */
export function buildBriefingNotes(input: BriefingPolicyInput): CopilotNote[] {
  const now = input.now ?? new Date();
  const ts = hhmm(now);
  const notes: CopilotNote[] = [];

  if (!input.isVerifiedToday) {
    notes.push({
      id: "verify-balance",
      ts,
      severity: "action",
      title: "Saldo no conciliado hoy",
      body: "Ancla el saldo real del banco para que el plan de pagos sea confiable.",
      action: { id: "focus-reconcile", label: "Conciliar ahora" },
    });
  }

  if (input.emergency.hasDeficit) {
    notes.push({
      id: "emergency-deficit",
      ts,
      severity: "urgent",
      title: `Faltan $${input.emergency.deficitAmount.toFixed(0)}`,
      body: `Para cubrir ${input.emergency.targetPaymentName} en ${input.emergency.daysRemaining} día(s) necesitas +$${input.emergency.suggestedDailyIncrease.toFixed(0)}/día.`,
      action: { id: "view-emergency", label: "Ver plan" },
    });
  }

  for (const item of input.plan.high) {
    if (item.aiStatus === "PAY_NOW") {
      notes.push({
        id: `pay-now-${item.obligationId}`,
        ts,
        severity: "urgent",
        title: `Pagar ${item.name}`,
        body: item.reason,
        action: { id: `mark-${item.obligationId}`, label: "Marcar pagado" },
      });
    } else if (item.aiStatus === "PAY_MIN") {
      notes.push({
        id: `pay-min-${item.obligationId}`,
        ts,
        severity: "watch",
        title: `Mínimo en ${item.name}`,
        body: item.reason,
        action: { id: `mark-${item.obligationId}`, label: "Pagar mínimo" },
      });
    }
  }

  // PAY_MIN en medium también
  for (const item of input.plan.medium) {
    if (item.aiStatus === "PAY_MIN") {
      notes.push({
        id: `pay-min-m-${item.obligationId}`,
        ts,
        severity: "watch",
        title: `Mínimo en ${item.name}`,
        body: item.reason,
      });
    }
  }

  if (input.bills7d > input.balance * 0.6 && input.bills7d > 0) {
    notes.push({
      id: "heavy-week",
      ts,
      severity: "watch",
      title: "Semana cargada de vencimientos",
      body: `Facturas ≤7 días: $${input.bills7d.toFixed(0)} (${Math.round((input.bills7d / Math.max(input.balance, 1)) * 100)}% del saldo).`,
    });
  }

  if (
    input.emergency.hasDeficit &&
    input.workingDaysRemaining <= 0
  ) {
    notes.push({
      id: "no-working-days",
      ts,
      severity: "urgent",
      title: "Sin días ON y hay déficit",
      body: "Activa al menos un día de trabajo en el plan semanal o reduce obligaciones.",
      action: { id: "open-schedule", label: "Ver semana" },
    });
  }

  if (
    input.previousBalance != null &&
    input.previousBalance > 0 &&
    input.balance < input.previousBalance * 0.5
  ) {
    notes.push({
      id: "balance-drop",
      ts,
      severity: "watch",
      title: "Caída fuerte de saldo",
      body: `Pasó de $${input.previousBalance.toFixed(0)} a $${input.balance.toFixed(0)}. Revisa cargos no registrados.`,
      action: { id: "audit-ocr", label: "Auditar extracto" },
    });
  }

  if (input.surplus.isSafe && input.surplus.amount > 0 && !input.emergency.hasDeficit) {
    notes.push({
      id: "surplus-ok",
      ts,
      severity: "ok",
      title: `Excedente $${input.surplus.amount.toFixed(0)} libre de riesgo`,
      body: "Después de obligaciones y colchón de seguridad puedes invertir o ahorrar.",
    });
  }

  if (input.plan.opsFund.amount > 0 && input.isVerifiedToday) {
    notes.push({
      id: "ops-fund",
      ts,
      severity: "ok",
      title: `Fondo operativo $${input.plan.opsFund.amount.toFixed(0)}`,
      body: input.plan.opsFund.reason,
    });
  }

  // Dedup por id, sort, cap 5
  const seen = new Set<string>();
  const unique = notes.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  unique.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return unique.slice(0, 5);
}
