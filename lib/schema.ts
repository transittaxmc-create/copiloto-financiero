import { supabase } from './supabase';

// Probe de esquema: ¿la tabla trips tiene las columnas de dirección completa?
// (pickup_name, dropoff_name, pickup_address, dropoff_address)
// Devuelve true solo cuando PostgREST las resuelve (sin error 400).
let cached: boolean | null = null;
export async function tripsHasAddressFields(): Promise<boolean> {
  if (cached === null) {
    const { error } = await supabase.from('trips').select('pickup_name').limit(1);
    cached = !error;
  }
  return cached;
}