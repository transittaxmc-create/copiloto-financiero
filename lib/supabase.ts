import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase real - usa EXACTAMENTE las env vars NEXT_PUBLIC_*
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!_client && supabaseUrl && supabaseAnonKey) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// Hook de compatibilidad: los componentes usan useSupabase()
export function useSupabase(): SupabaseClient {
  return getClient() as SupabaseClient;
}

// Compatibilidad con server actions (app/actions/*)
export function createServerClient(): SupabaseClient {
  return getClient() as SupabaseClient;
}

// Export directo para uso general
export const supabase = getClient() as SupabaseClient;
