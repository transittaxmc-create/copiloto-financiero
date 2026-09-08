// =============================================================
// SISTEMA DE ALMACENAMIENTO LOCAL OFFLINE-FIRST
// Fuente de verdad principal para la UI
// =============================================================

export interface LocalTrip {
  id: string;
  platform_id: string;
  earnings: number;
  tips: number;
  tolls: number;
  platform_fee: number;
  black_car_phones_fee: number;
  gross: number;
  net: number;
  net_payout: number;
  pickup_time: string | null;
  dropoff_time: string | null;
  pickup_gps: any;
  dropoff_gps: any;
  trip_notes: string;
  status: string;
  sync_status: 'local' | 'synced' | 'error';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'copiloto_trips';

// =============================================================
// TRIPS - Almacenamiento local
// =============================================================

export function getLocalTrips(): LocalTrip[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalTrips(trips: LocalTrip[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Error guardando trips en localStorage:', e);
  }
}

export function addLocalTrip(trip: Omit<LocalTrip, 'id' | 'sync_status' | 'created_at' | 'updated_at'>): LocalTrip {
  const trips = getLocalTrips();
  const now = new Date().toISOString();
  const newTrip: LocalTrip = {
    ...trip,
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sync_status: 'local',
    created_at: now,
    updated_at: now,
  };
  trips.unshift(newTrip);
  saveLocalTrips(trips);
  console.log('[LocalStore] Trip guardado localmente:', newTrip.id);
  return newTrip;
}

export function updateLocalTrip(id: string, updates: Partial<LocalTrip>): LocalTrip | null {
  const trips = getLocalTrips();
  const index = trips.findIndex(t => t.id === id);
  if (index === -1) return null;
  trips[index] = { ...trips[index], ...updates, updated_at: new Date().toISOString() };
  saveLocalTrips(trips);
  return trips[index];
}

export function deleteLocalTrip(id: string): boolean {
  const trips = getLocalTrips();
  const filtered = trips.filter(t => t.id !== id);
  if (filtered.length === trips.length) return false;
  saveLocalTrips(filtered);
  return true;
}

export function markTripSynced(localId: string, serverId: string): void {
  const trips = getLocalTrips();
  const index = trips.findIndex(t => t.id === localId);
  if (index !== -1) {
    trips[index].sync_status = 'synced';
    trips[index].id = serverId;
    trips[index].updated_at = new Date().toISOString();
    saveLocalTrips(trips);
  }
}

export function markTripError(id: string, error: string): void {
  const trips = getLocalTrips();
  const index = trips.findIndex(t => t.id === id);
  if (index !== -1) {
    trips[index].sync_status = 'error';
    trips[index].sync_error = error;
    trips[index].updated_at = new Date().toISOString();
    saveLocalTrips(trips);
  }
}

export function getPendingSyncTrips(): LocalTrip[] {
  return getLocalTrips().filter(t => t.sync_status === 'local' || t.sync_status === 'error');
}

// =============================================================
// SUBSCRIPTION - Para actualizar UI cuando cambia localStorage
// =============================================================

type Listener = () => void;
const tripListeners: Set<Listener> = new Set();

export function subscribeToTrips(listener: Listener): () => void {
  tripListeners.add(listener);
  return () => tripListeners.delete(listener);
}

export function notifyTripsChanged(): void {
  tripListeners.forEach(l => l());
}
