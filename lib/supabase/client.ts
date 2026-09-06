"use client";

// Mock Supabase client para desarrollo
// Reemplazar con el cliente real de @supabase/supabase-js cuando esté configurado
export function useSupabase() {
  // Mock de supabase - en producción usar:
  // import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
  // createClientComponentClient()

  const mockSupabase = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        order: (column: string, options?: { ascending: boolean }) => ({
          limit: (n: number) => ({
            single: async () => {
              // Mock data para demo
              if (table === "daily_balances") {
                return { data: { closing_balance: 2340.50, date: "2026-09-05" }, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
        eq: (column: string, value: unknown) => ({
          data: table === "fixed_expenses" ? [
            { id: "1", name: "Electricidad", amount: 145, due_day: 15, is_active: true },
            { id: "2", name: "Insurance Uber", amount: 89, due_day: 20, is_active: true },
            { id: "3", name: "T-Mobile", amount: 65, due_day: 25, is_active: true },
          ] : [],
          error: null,
        }),
      }),
    }),
  };

  return mockSupabase as any;
}

export type SupabaseClient = ReturnType<typeof useSupabase>;