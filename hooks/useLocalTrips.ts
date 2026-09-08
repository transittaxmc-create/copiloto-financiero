// =============================================================
// HOOK: useLocalTrips - Datos locales con auto-sync
// =============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getLocalTrips, 
  addLocalTrip, 
  updateLocalTrip, 
  deleteLocalTrip,
  subscribeToTrips,
  LocalTrip 
} from '@/lib/localStore';
import { syncTripsWithSupabase } from '@/lib/syncManager';

interface UseLocalTripsReturn {
  trips: LocalTrip[];
  loading: boolean;
  error: string | null;
  addTrip: (trip: Omit<LocalTrip, 'id' | 'sync_status' | 'created_at' | 'updated_at'>) => LocalTrip;
  updateTrip: (id: string, updates: Partial<LocalTrip>) => void;
  deleteTrip: (id: string) => void;
  refreshTrips: () => void;
  syncPending: () => Promise<{ synced: number; errors: number }>;
  pendingCount: number;
}

export function useLocalTrips(): UseLocalTripsReturn {
  const [trips, setTrips] = useState<LocalTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar trips desde localStorage
  const loadTrips = useCallback(() => {
    try {
      const localTrips = getLocalTrips();
      setTrips(localTrips);
      setError(null);
    } catch (err) {
      setError('Error al cargar viajes locales');
      console.error('[useLocalTrips] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar y suscribirse a cambios
  useEffect(() => {
    loadTrips();
    
    // Suscribirse a cambios de localStorage
    const unsubscribe = subscribeToTrips(loadTrips);
    
    // Escuchar cambios de otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'copiloto_trips') {
        loadTrips();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTrips]);

  // Agregar trip
  const addTrip = useCallback((tripData: Omit<LocalTrip, 'id' | 'sync_status' | 'created_at' | 'updated_at'>) => {
    const newTrip = addLocalTrip(tripData);
    setTrips(prev => [newTrip, ...prev]);
    
    // Intentar sync en segundo plano
    syncTripsWithSupabase().then(result => {
      if (result.synced > 0) {
        loadTrips(); // Recargar para obtener IDs del servidor
      }
    });
    
    return newTrip;
  }, [loadTrips]);

  // Actualizar trip
  const updateTrip = useCallback((id: string, updates: Partial<LocalTrip>) => {
    const updated = updateLocalTrip(id, updates);
    if (updated) {
      setTrips(prev => prev.map(t => t.id === id ? updated : t));
    }
  }, []);

  // Eliminar trip
  const deleteTrip = useCallback((id: string) => {
    deleteLocalTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sincronizar pendientes manualmente
  const syncPending = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncTripsWithSupabase();
      loadTrips();
      return result;
    } catch (err) {
      console.error('[useLocalTrips] Error en sync:', err);
      return { synced: 0, errors: 0 };
    } finally {
      setLoading(false);
    }
  }, [loadTrips]);

  const pendingCount = trips.filter(t => t.sync_status === 'local' || t.sync_status === 'error').length;

  return {
    trips,
    loading,
    error,
    addTrip,
    updateTrip,
    deleteTrip,
    refreshTrips: loadTrips,
    syncPending,
    pendingCount,
  };
}
