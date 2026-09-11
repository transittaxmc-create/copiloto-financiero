/**
 * Ledger ACID en Supabase.
 *
 * Cada mutación importante (marcar pagado, conciliar saldo, agregar bill)
 * se escribe en Supabase de forma no-bloqueante. El store local queda como
 * caché rápida; la DB es la fuente de verdad.
 *
 * Convención:
 *   - bank_balances  → único por (user_id, date)
 *   - fixed_expenses → CRUD de obligaciones
 *   - expenses       → gastos diarios
 */

import { supabase } from "@/lib/supabase";
import type { BankSnapshot, ObligationCategory } from "@/lib/engines/types";

// user_id anon mientras no hay auth
const ANON_USER = "00000000-0000-0000-0000-000000000000";

// ────────────────────────────────────────────────────────────────────────────
// Bank balances
// ────────────────────────────────────────────────────────────────────────────

export interface LedgerBankEntry {
  date: string; // YYYY-MM-DD
  balance_real: number;
  balance_calculado: number;
  source: string;
}

export async function pushBankSnapshot(
  snapshot: BankSnapshot,
  calculatedBalance: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("bank_balances").upsert(
      {
        user_id: ANON_USER,
        date: today,
        balance_real: snapshot.amount,
        balance_calculado: calculatedBalance,
        // usamos created_at como timestamp de verificación
      },
      { onConflict: "user_id,date" }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function fetchLatestBankBalance(): Promise<{
  balance_real: number | null;
  date: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from("bank_balances")
      .select("balance_real, date")
      .eq("user_id", ANON_USER)
      .order("date", { ascending: false })
      .limit(1)
      .single();
    if (error || !data) return null;
    return { balance_real: Number(data.balance_real), date: data.date };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Fixed expenses (bills)
// ────────────────────────────────────────────────────────────────────────────

export interface LedgerBill {
  id?: string;
  name: string;
  amount: number;
  due_day: number; // día del mes 1-31
  recurrence: "weekly" | "biweekly" | "monthly";
  is_active: boolean;
  category?: ObligationCategory;
}

export async function fetchBills(): Promise<LedgerBill[]> {
  try {
    const { data, error } = await supabase
      .from("fixed_expenses")
      .select("id, name, amount, due_day, recurrence, is_active, category")
      .eq("user_id", ANON_USER)
      .eq("is_active", true)
      .order("due_day", { ascending: true });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount),
      due_day: r.due_day,
      recurrence: r.recurrence,
      is_active: r.is_active,
      category: r.category as ObligationCategory,
    }));
  } catch {
    return [];
  }
}

export async function addBill(
  bill: Omit<LedgerBill, "id">
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("fixed_expenses")
      .insert({
        user_id: ANON_USER,
        name: bill.name,
        amount: bill.amount,
        due_day: bill.due_day,
        recurrence: bill.recurrence,
        is_active: bill.is_active,
        category: bill.category ?? "other",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateBill(
  id: string,
  patch: Partial<Omit<LedgerBill, "id">>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("fixed_expenses")
      .update(patch)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteBill(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    // soft delete
    const { error } = await supabase
      .from("fixed_expenses")
      .update({ is_active: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Expenses (gastos diarios)
// ────────────────────────────────────────────────────────────────────────────

export async function pushExpense(params: {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("expenses").insert({
      user_id: ANON_USER,
      amount: params.amount,
      merchant: params.merchant,
      category: params.category,
      date: params.date,
      notes: params.notes ?? "",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
