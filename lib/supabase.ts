import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase real - usa EXACTAMENTE las env vars NEXT_PUBLIC_*
// NOTA build (2026-09-07): tocar este módulo fuerza re-compilación en Vercel
// y re-hornea NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (el cache de Next reusa el
// output compilado si el archivo no cambia; cambiar solo envs no basta).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = supabaseUrl || "https://placeholder.supabase.co";
    const key = supabaseAnonKey || "placeholder-key";
    _client = createClient(url, key);
  }
  return _client;
}

// Hook de compatibilidad: los componentes usan useSupabase()
export function useSupabase(): SupabaseClient {
  return getClient();
}

// Compatibilidad con server actions (app/actions/*)
export function createServerClient(): SupabaseClient {
  return getClient();
}

// Export directo para uso general
export const supabase = getClient();
