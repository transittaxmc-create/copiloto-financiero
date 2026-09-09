// =============================================================
// SINCRONIZACIÓN CON SUPABASE (Background Sync)
// =============================================================

import { supabase } from './supabase';
import {
  getPendingSyncTrips,
  markTripSynced,
  markTripError,
  getPendingSyncExpenses,
  markExpenseSynced,
  markExpenseError,
} from './localStore';

export async function syncTripsWithSupabase(): Promise<{ synced: number; errors: number }> {
  const pending = getPendingSyncTrips();
  let syncedCount = 0;
  let errorCount = 0;

  if (pending.length === 0) {
    console.log('[SyncManager] No hay trips pendientes de sincronización');
    return { synced: 0, errors: 0 };
  }

  console.log(`[SyncManager] Intentando sincronizar ${pending.length} trips...`);

  for (const trip of pending) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          platform_id: trip.platform_id,
          earnings: trip.earnings,
          tips: trip.tips,
          tolls: trip.tolls,
          platform_fee: trip.platform_fee,
          black_car_phones_fee: trip.black_car_phones_fee,
          gross: trip.gross,
          net: trip.net,
          net_payout: trip.net_payout,
          pickup_time: trip.pickup_time,
          dropoff_time: trip.dropoff_time,
          pickup_gps: trip.pickup_gps,
          dropoff_gps: trip.dropoff_gps,
          trip_notes: trip.trip_notes,
          status: trip.status || 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[SyncManager] Error al sincronizar trip:', trip.id, error);
        markTripError(trip.id, error.message);
        errorCount++;
      } else {
        markTripSynced(trip.id, data.id);
        syncedCount++;
        console.log('[SyncManager] Trip sincronizado exitosamente:', data.id);
      }
    } catch (err: any) {
      console.error('[SyncManager] Error inesperado:', err);
      markTripError(trip.id, err.message || 'Error de conexión');
      errorCount++;
    }
  }

  console.log(`[SyncManager] Sincronización completada: ${syncedCount} synced, ${errorCount} errors`);
  return { synced: syncedCount, errors: errorCount };
}

// Auto-sync cada 30 segundos cuando hay conexión
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs: number = 30000) {
  if (syncInterval) clearInterval(syncInterval);
  
  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      await syncAll();
    }
  }, intervalMs);
  
  console.log(`[SyncManager] Auto-sync iniciado cada ${intervalMs}ms`);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SyncManager] Auto-sync detenido');
  }
}

// Sync al recuperar conexión
export function setupOnlineListener() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', async () => {
    console.log('[SyncManager] Conexión recuperada, iniciando sync...');
    await syncAll();
  });
}

// =============================================================
// EXPENSES - Sincronización Offline-First
// =============================================================

export async function syncExpensesWithSupabase(): Promise<{ synced: number; errors: number }> {
  const pending = getPendingSyncExpenses();
  let syncedCount = 0;
  let errorCount = 0;

  if (pending.length === 0) {
    console.log('[SyncManager] No hay gastos pendientes de sincronización');
    return { synced: 0, errors: 0 };
  }

  console.log(`[SyncManager] Intentando sincronizar ${pending.length} gastos...`);

  for (const expense of pending) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          merchant: expense.merchant,
          amount: expense.amount,
          category: expense.category,
          is_business: expense.is_business,
          notes: expense.notes,
          receipt_url: expense.receipt_url,
          date: expense.date,
        })
        .select()
        .single();

      if (error) {
        console.error('[SyncManager] Error al sincronizar gasto:', expense.id, error);
        markExpenseError(expense.id, error.message);
        errorCount++;
      } else {
        markExpenseSynced(expense.id, data.id);
        syncedCount++;
        console.log('[SyncManager] Gasto sincronizado exitosamente:', data.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      console.error('[SyncManager] Error inesperado (gasto):', err);
      markExpenseError(expense.id, message);
      errorCount++;
    }
  }

  console.log(`[SyncManager] Sync gastos completado: ${syncedCount} synced, ${errorCount} errors`);
  return { synced: syncedCount, errors: errorCount };
}

// Sync combinado (trips + expenses)
export async function syncAll(): Promise<{ synced: number; errors: number }> {
  const trips = await syncTripsWithSupabase();
  const expenses = await syncExpensesWithSupabase();
  return { synced: trips.synced + expenses.synced, errors: trips.errors + expenses.errors };
}
