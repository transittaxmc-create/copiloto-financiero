// =============================================================
// HOOK: useLocalExpenses - Datos locales con auto-sync
// =============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getLocalExpenses,
  saveLocalExpenses,
  addLocalExpense,
  updateLocalExpense,
  deleteLocalExpense,
  subscribeToExpenses,
  LocalExpense,
} from '@/lib/localStore';
import { syncExpensesWithSupabase } from '@/lib/syncManager';
import { supabase } from '@/lib/supabase';

interface UseLocalExpensesReturn {
  expenses: LocalExpense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<LocalExpense, 'id' | 'sync_status' | 'created_at' | 'updated_at'>) => LocalExpense;
  updateExpense: (id: string, updates: Partial<LocalExpense>) => void;
  deleteExpense: (id: string) => void;
  refreshExpenses: () => void;
  syncPending: () => Promise<{ synced: number; errors: number }>;
  pendingCount: number;
}

export function useLocalExpenses(): UseLocalExpensesReturn {
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar gastos desde localStorage (fuente de verdad de la UI)
  const loadExpenses = useCallback(() => {
    try {
      setExpenses(getLocalExpenses());
      setError(null);
    } catch (err) {
      setError('Error al cargar gastos locales');
      console.error('[useLocalExpenses] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge silencioso: traer de Supabase lo que no exista localmente (best-effort)
  const mergeFromServer = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error || !data) return; // silencioso: la UI ya tiene lo local

      const local = getLocalExpenses();
      const localIds = new Set(local.map(e => e.id));
      const missing = (data as LocalExpense[]).filter(e => !localIds.has(e.id));

      if (missing.length > 0) {
        saveLocalExpenses([...local, ...missing.map(e => ({ ...e, sync_status: 'synced' as const }))]);
      }
    } catch {
      // offline: no importa, syncManager reintenta después
    }
  }, []);

  // Inicializar y suscribirse a cambios
  useEffect(() => {
    loadExpenses();
    mergeFromServer();

    const unsubscribe = subscribeToExpenses(loadExpenses);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'copiloto_expenses') {
        loadExpenses();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadExpenses, mergeFromServer]);

  // Agregar gasto (local primero, sync en segundo plano)
  const addExpense = useCallback(
    (expenseData: Omit<LocalExpense, 'id' | 'sync_status' | 'created_at' | 'updated_at'>) => {
      const newExpense = addLocalExpense(expenseData);
      setExpenses(prev => [newExpense, ...prev]);

      syncExpensesWithSupabase().then(result => {
        if (result.synced > 0) {
          loadExpenses(); // Recargar para obtener IDs del servidor
        }
      });

      return newExpense;
    },
    [loadExpenses]
  );

  // Actualizar gasto
  const updateExpense = useCallback((id: string, updates: Partial<LocalExpense>) => {
    const updated = updateLocalExpense(id, updates);
    if (updated) {
      setExpenses(prev => prev.map(e => (e.id === id ? updated : e)));
    }
  }, []);

  // Eliminar gasto (local siempre; si es ID de servidor, borrar en Supabase best-effort)
  const deleteExpense = useCallback((id: string) => {
    deleteLocalExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));

    if (!id.startsWith('local_')) {
      supabase.from('expenses').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[useLocalExpenses] Error al eliminar en servidor:', error);
      });
    }
  }, []);

  // Sincronizar pendientes manualmente
  const syncPending = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncExpensesWithSupabase();
      loadExpenses();
      return result;
    } catch (err) {
      console.error('[useLocalExpenses] Error en sync:', err);
      return { synced: 0, errors: 0 };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  const pendingCount = expenses.filter(e => e.sync_status === 'local' || e.sync_status === 'error').length;

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: loadExpenses,
    syncPending,
    pendingCount,
  };
}