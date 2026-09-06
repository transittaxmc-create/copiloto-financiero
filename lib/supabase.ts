"use client";

import { Trip } from "@/lib/types";

const MOCK_TRIPS: Trip[] = [
  {
    id: "1",
    platform_id: "uber",
    pickup_time: "2026-09-06T14:30:00",
    dropoff_time: "2026-09-06T15:00:00",
    pickup_gps: { lat: 40.7128, lng: -74.0060 },
    dropoff_gps: { lat: 40.6892, lng: -73.9442 },
    earnings: 24.50,
    extra_cash: 0,
    tips: 5.00,
    tolls: 0,
    platform_fee: 3.20,
    black_car_phones_fee: 2.75,
    gross: 29.50,
    net: 23.55,
    status: "pending",
    trip_notes: "Airport pickup",
    created_at: "2026-09-06T14:30:00"
  },
  {
    id: "2",
    platform_id: "uber",
    pickup_time: "2026-09-06T10:15:00",
    dropoff_time: "2026-09-06T10:45:00",
    pickup_gps: { lat: 40.7580, lng: -73.9855 },
    dropoff_gps: { lat: 40.7614, lng: -73.9776 },
    earnings: 18.75,
    extra_cash: 0,
    tips: 3.50,
    tolls: 6.50,
    platform_fee: 2.45,
    black_car_phones_fee: 2.75,
    gross: 22.25,
    net: 16.55,
    status: "in_ledger",
    trip_notes: "",
    created_at: "2026-09-06T10:15:00"
  },
  {
    id: "3",
    platform_id: "lyft",
    pickup_time: "2026-09-06T09:00:00",
    dropoff_time: "2026-09-06T09:30:00",
    pickup_gps: { lat: 40.7527, lng: -73.9772 },
    dropoff_gps: { lat: 40.7589, lng: -73.9851 },
    earnings: 15.30,
    extra_cash: 0,
    tips: 2.00,
    tolls: 0,
    platform_fee: 2.10,
    black_car_phones_fee: 2.75,
    gross: 17.30,
    net: 12.45,
    status: "pending",
    trip_notes: "",
    created_at: "2026-09-06T09:00:00"
  },
  {
    id: "4",
    platform_id: "lyft",
    pickup_time: "2026-09-05T18:45:00",
    dropoff_time: "2026-09-05T19:15:00",
    pickup_gps: { lat: 40.7589, lng: -73.9851 },
    dropoff_gps: { lat: 40.7484, lng: -73.9857 },
    earnings: 12.80,
    extra_cash: 0,
    tips: 2.50,
    tolls: 0,
    platform_fee: 1.85,
    black_car_phones_fee: 2.75,
    gross: 15.30,
    net: 10.70,
    status: "reconciled",
    trip_notes: "",
    created_at: "2026-09-05T18:45:00"
  },
  {
    id: "5",
    platform_id: "uber",
    pickup_time: "2026-09-05T16:20:00",
    dropoff_time: "2026-09-05T16:40:00",
    pickup_gps: { lat: 40.7127, lng: -74.0059 },
    dropoff_gps: { lat: 40.7061, lng: -74.0089 },
    earnings: 8.90,
    extra_cash: 5.00,
    tips: 2.00,
    tolls: 0,
    platform_fee: 1.20,
    black_car_phones_fee: 2.75,
    gross: 15.90,
    net: 11.95,
    status: "in_ledger",
    trip_notes: "Extra cash tip",
    created_at: "2026-09-05T16:20:00"
  },
];

// Simular el ordenamiento por pickup_time
const sortedTrips = [...MOCK_TRIPS].sort((a, b) => 
  new Date(b.pickup_time).getTime() - new Date(a.pickup_time).getTime()
);

export function useSupabase() {
  const mockSupabase = {
    from: (table: string) => {
      // Para select().order().then()
      const selectResult = {
        order: () => ({
          then: (resolve: (value: { data: unknown; error: null }) => void) => {
            if (table === "trips") {
              resolve({ data: sortedTrips, error: null });
            } else if (table === "schedules") {
              resolve({ data: [{ id: "1", day_of_week: 1, is_working: true, projected_amount: 150 }], error: null });
            } else {
              resolve({ data: null, error: null });
            }
          },
          limit: () => ({
            single: async () => {
              if (table === "daily_balances") return { data: { closing_balance: 2340.50, date: "2026-09-05" }, error: null };
              return { data: null, error: null };
            }
          })
        }),
        eq: (_col: string, _val: unknown) => ({
          data: table === "fixed_expenses" ? [
            { id: "1", name: "Electricidad", amount: 145, due_day: 15, is_active: true },
            { id: "2", name: "Insurance Uber", amount: 89, due_day: 20, is_active: true },
            { id: "3", name: "T-Mobile", amount: 65, due_day: 25, is_active: true },
          ] : [],
          error: null,
        }),
      };
      
      // Para update().eq().then()
      const updateResult = (data: Record<string, unknown>) => ({
        eq: (col: string, val: unknown) => ({
          then: (resolve: (value: { data: unknown; error: null }) => void) => {
            if (table === "trips") {
              const idx = MOCK_TRIPS.findIndex((t) => t.id === val);
              if (idx !== -1) {
                Object.assign(MOCK_TRIPS[idx], data);
              }
            }
            resolve({ data: null, error: null });
          }
        })
      });

      return {
        select: (_cols?: string) => selectResult,
        update: (data: Record<string, unknown>) => updateResult(data),
      };
    },
  };
  return mockSupabase as any;
}

export function createServerClient() {
  return useSupabase();
}
