"use server";

import { createServerClient } from "@/lib/supabase";

const TOLERANCIA = 0.05;

interface ReconcileResult {
  success: boolean;
  balance_real: number;
  balance_calculado: number;
  diferencia: number;
  reconciliado: boolean;
  categoria?: string;
  mensaje: string;
}

export async function reconcileBalance(
  balanceReal: number,
  userId: string,
  fecha: string
): Promise<ReconcileResult> {
  const supabase = createServerClient();

  const { data: viajes, error } = await supabase
    .from("trips")
    .select("net_payout")
    .eq("user_id", userId)
    .eq("status", "EN_LEDGER")
    .gte("created_at", `${fecha}T00:00:00`)
    .lt("created_at", `${fecha}T23:59:59`);

  if (error) {
    return {
      success: false,
      balance_real: balanceReal,
      balance_calculado: 0,
      diferencia: 0,
      reconciliado: false,
      mensaje: `Error consultando viajes: ${error.message}`,
    };
  }

  const balanceCalculado = (viajes ?? []).reduce(
    (sum: number, t: { net_payout?: number }) => sum + (t.net_payout ?? 0),
    0
  );

  const diferencia = balanceReal - balanceCalculado;
  const reconciliado = Math.abs(diferencia) <= TOLERANCIA;

  let categoria: string | undefined;
  let mensaje: string;

  if (reconciliado) {
    mensaje = "Balance reconciliado correctamente.";
  } else if (diferencia > 0) {
    categoria = "Ingreso no registrado / Efectivo";
    mensaje = `Diferencia de +$${diferencia.toFixed(2)}: hay dinero en el banco que no está en los viajes registrados.`;
  } else {
    categoria = "Comisión plataforma / Gastos operación";
    mensaje = `Diferencia de -$${Math.abs(diferencia).toFixed(2)}: los viajes registrados superan el balance bancario. Posible comisión no registrada.`;
  }

  const { error: insertError } = await supabase.from("bank_balances").upsert(
    {
      user_id: userId,
      date: fecha,
      balance_real: balanceReal,
      balance_calculado: balanceCalculado,
    },
    { onConflict: "user_id,date" }
  );

  if (insertError) {
    return {
      success: false,
      balance_real: balanceReal,
      balance_calculado: balanceCalculado,
      diferencia,
      reconciliado,
      categoria,
      mensaje: `Error guardando balance: ${insertError.message}`,
    };
  }

  return {
    success: true,
    balance_real: balanceReal,
    balance_calculado: balanceCalculado,
    diferencia,
    reconciliado,
    categoria,
    mensaje,
  };
}
