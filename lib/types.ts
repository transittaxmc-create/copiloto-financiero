// Tipos compartidos para el proyecto

export interface Trip {
  id: string;
  platform_id: string;
  pickup_time: string;
  dropoff_time: string;
  pickup_gps: { lat: number; lng: number } | null;
  dropoff_gps: { lat: number; lng: number } | null;
  earnings: number;
  extra_cash: number;
  tips: number;
  tolls: number;
  platform_fee: number;
  black_car_phones_fee: number;
  gross: number;
  net: number;
  status: "pending" | "in_ledger" | "reconciled";
  trip_notes: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DailyBalance {
  id: string;
  date: string;
  opening_balance: number;
  closing_balance: number;
  total_earnings: number;
  total_tips: number;
  total_fees: number;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  is_active: boolean;
  recurrence: "weekly" | "biweekly" | "monthly";
  created_at: string;
}

export interface Schedule {
  id: string;
  day_of_week: number;
  is_working: boolean;
  projected_amount: number;
  start_time?: string;
  end_time?: string;
}

export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  location?: string;
  notes?: string;
  is_business: boolean;
  receipt_url?: string;
  created_at: string;
}
