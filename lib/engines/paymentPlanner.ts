import {
  type AiPayStatus,
  type ObligationCategory,
  type ObligationInput,
  type PaymentPlan,
  type PaymentPlanItem,
  SAFE_MARGIN_DEFAULT,
} from "./types";

/** Días hasta due (>=0). Fechas pasadas = 0. */
export function daysUntilDue(iso: string, now = new Date()): number {
  const ms = new Date(`${iso}T12:00:00`).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function criticality(category: ObligationCategory): number {
  switch (category) {
    case "rent":
      return 90;
    case "car":
      return 85;
    case "card":
      return 70;
    case "fuel":
      return 55;
    case "ops":
      return 50;
    default:
      return 30;
  }
}

function urgencyScore(days: number): number {
  if (days <= 0) return 100;
  if (days <= 2) return 85;
  if (days <= 7) return 60;
  if (days <= 14) return 35;
  return 15;
}

function openAmount(o: ObligationInput): number {
  return Math.max(0, o.amount - (o.paidAmount ?? 0));
}

function scoreItem(
  o: ObligationInput & { remaining: number },
  cashStress: number,
  now: Date
): PaymentPlanItem {
  const days = daysUntilDue(o.dueDate, now);
  const urg = urgencyScore(days);
  const crit = criticality(o.category);
  const penalty =
    o.category === "card" && o.minPayment != null && days <= 7 ? 15 : 0;
  const score = urg * 0.45 + crit * 0.25 + cashStress * 0.2 + penalty * 0.1;

  const isHigh =
    score >= 70 ||
    days <= 2 ||
    ((o.category === "rent" || o.category === "car") && days <= 5);
  const isMedium = !isHigh && days <= 14;

  let aiStatus: AiPayStatus;
  let recommendedAmount: number;
  let reason: string;

  if (days <= 2 || (o.category === "rent" && days <= 5)) {
    aiStatus = "PAY_NOW";
    recommendedAmount = o.remaining;
    reason =
      days <= 0
        ? "Vencido hoy o atrasado — prioriza para evitar mora."
        : `Vence en ${days} día(s). Criticidad ${o.category === "rent" ? "vivienda" : "alta"}.`;
  } else if (
    o.category === "card" &&
    o.minPayment != null &&
    o.remaining > 0
  ) {
    // provisional; budget pass puede confirmar PAY_MIN
    aiStatus = "RECOMMENDED";
    recommendedAmount = o.remaining;
    reason = `Vence en ${days} día(s). Tarjeta — considera mínimo si el cash aprieta.`;
  } else if (isHigh || isMedium) {
    aiStatus = "RECOMMENDED";
    recommendedAmount = o.remaining;
    reason =
      days <= 7
        ? `Vence en ${days} día(s). Cabe en el plan de la semana.`
        : `Vence en ${days} día(s). Programa el pago con holgura.`;
  } else {
    aiStatus = "DEFER";
    recommendedAmount = 0;
    reason = "Fuera de la ventana de 14 días — revisa más adelante.";
  }

  return {
    obligationId: o.id,
    name: o.name,
    amount: o.remaining,
    recommendedAmount,
    dueDate: o.dueDate,
    category: o.category,
    tier: isHigh ? "high" : isMedium ? "medium" : "ops_fund",
    aiStatus,
    reason,
    daysUntilDue: days,
    score: Math.round(score * 10) / 10,
  };
}
/**
 * Motor determinista del plan de pagos matutino.
 * No depende de UI ni de Zustand — fácil de testear.
 */
export function buildPaymentPlan(
  balance: number,
  obligations: ObligationInput[],
  opts?: { safeMargin?: number; now?: Date }
): PaymentPlan {
  const safeMargin = opts?.safeMargin ?? SAFE_MARGIN_DEFAULT;
  const now = opts?.now ?? new Date();
  const generatedAt = now.toISOString();

  const open = obligations
    .map((o) => ({ ...o, remaining: openAmount(o) }))
    .filter((o) => o.remaining > 0);

  const due7Total = open
    .filter((o) => daysUntilDue(o.dueDate, now) <= 7)
    .reduce((s, o) => s + o.remaining, 0);
  const cashStress = Math.min(100, (due7Total / Math.max(balance, 1)) * 100);

  const scored = open
    .map((o) => scoreItem(o, cashStress, now))
    .sort((a, b) => b.score - a.score || a.daysUntilDue - b.daysUntilDue);

  const high = scored.filter((i) => i.tier === "high");
  const medium = scored.filter((i) => i.tier === "medium");
  const deferred = scored.filter((i) => i.tier === "ops_fund");

  let budget = Math.max(0, balance - safeMargin);
  const byId = new Map(obligations.map((o) => [o.id, o]));

  const applyBudget = (items: PaymentPlanItem[]) => {
    for (const item of items) {
      if (item.aiStatus === "DEFER") continue;
      const need = item.recommendedAmount;
      if (need <= budget) {
        budget -= need;
        continue;
      }
      const src = byId.get(item.obligationId);
      const minP = src?.minPayment ?? 0;
      if (item.category === "card" && minP > 0 && minP <= budget) {
        item.aiStatus = "PAY_MIN";
        item.recommendedAmount = minP;
        item.reason = `Presupuesto limitado: paga mínimo $${minP.toFixed(0)} y preserva colchón.`;
        budget -= minP;
        continue;
      }
      if (item.aiStatus === "PAY_NOW") {
        item.reason = `${item.reason} ⚠️ Saldo insuficiente tras colchón (faltan $${(need - budget).toFixed(0)}).`;
        continue;
      }
      item.aiStatus = "DEFER";
      item.recommendedAmount = 0;
      item.reason = `Diferir: pagar rompería el colchón de $${safeMargin}.`;
    }
  };

  applyBudget(high);
  applyBudget(medium);

  for (const item of [...high, ...medium]) {
    if (item.category !== "card" || item.aiStatus === "DEFER") continue;
    const src = byId.get(item.obligationId);
    if (!src?.minPayment) continue;
    if (balance < item.amount && item.aiStatus === "RECOMMENDED") {
      item.aiStatus = "PAY_MIN";
      item.recommendedAmount = Math.min(src.minPayment, item.amount);
      item.reason = `Cash tenso: paga el mínimo ($${item.recommendedAmount.toFixed(0)}) y evita mora.`;
    }
  }

  const committed = [...high, ...medium]
    .filter((i) => i.aiStatus !== "DEFER" && i.recommendedAmount > 0)
    .reduce((s, i) => s + i.recommendedAmount, 0);

  const opsAmount = Math.max(0, balance - committed - safeMargin);

  return {
    high,
    medium,
    deferred,
    opsFund: {
      amount: opsAmount,
      reason:
        opsAmount > 0
          ? "Reserva operativa después de obligaciones prioritarias y colchón."
          : "Sin fondo libre: prioriza ingresos o reduce pagos no críticos.",
    },
    generatedAt,
  };
}

