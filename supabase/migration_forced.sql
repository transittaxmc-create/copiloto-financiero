-- =============================================================
-- MIGRACION: Tablas faltantes para Copiloto Financiero
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- =============================================================

-- 1. TRIPS (viajes de rideshare - DailyEntry / RegisterFlow / Ledger)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  platform_id text not null default 'uber',
  pickup_time timestamptz,
  dropoff_time timestamptz,
  pickup_gps jsonb,
  dropoff_gps jsonb,
  earnings numeric(10,2) default 0,
  extra_cash numeric(10,2) default 0,
  tips numeric(10,2) default 0,
  tolls numeric(10,2) default 0,
  platform_fee numeric(10,2) default 0,
  black_car_phones_fee numeric(10,2) default 2.75,
  gross numeric(10,2) default 0,
  net numeric(10,2) default 0,
  net_payout numeric(10,2) default 0,
  status text default 'pending',
  trip_notes text default '',
  created_at timestamptz default now()
);

-- 2. NOTIFICATIONS (alertas proactivas del Solver)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null default 'info',
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 3. DAILY_BALANCES (balance de apertura/cierre diario)
create table if not exists public.daily_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  date date not null,
  opening_balance numeric(10,2) default 0,
  closing_balance numeric(10,2) default 0,
  total_earnings numeric(10,2) default 0,
  total_tips numeric(10,2) default 0,
  total_fees numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- 4. FIXED_EXPENSES (gastos fijos recurrentes)
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  amount numeric(10,2) not null default 0,
  due_day int not null default 1,
  is_active boolean default true,
  recurrence text default 'monthly' check (recurrence in ('weekly','biweekly','monthly')),
  created_at timestamptz default now()
);

-- 5. SCHEDULES (horario de trabajo proyectado)
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6),
  is_working boolean default false,
  projected_amount numeric(10,2) default 0,
  start_time text,
  end_time text
);

-- 6. EXPENSES (gastos y recibos - componente Expenses)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  amount numeric(10,2) not null default 0,
  merchant text not null,
  category text not null default 'other',
  date date not null default current_date,
  location text,
  notes text,
  is_business boolean default true,
  receipt_url text,
  created_at timestamptz default now()
);

-- 7. BANK_BALANCES (reconciliacion bancaria, unique user_id+date)
create table if not exists public.bank_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  balance_real numeric(10,2) default 0,
  balance_calculado numeric(10,2) default 0,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- =============================================================
-- RLS: habilitado con politicas permisivas para desarrollo
-- (la app usa la anon key sin sesion de login todavia)
-- NOTA: para produccion, reemplazar con politicas por usuario autenticado
-- =============================================================
alter table public.trips enable row level security;
alter table public.notifications enable row level security;
alter table public.daily_balances enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.schedules enable row level security;
alter table public.expenses enable row level security;
alter table public.bank_balances enable row level security;

create policy "dev_all_trips" on public.trips for all using (true) with check (true);
create policy "dev_all_notifications" on public.notifications for all using (true) with check (true);
create policy "dev_all_daily_balances" on public.daily_balances for all using (true) with check (true);
create policy "dev_all_fixed_expenses" on public.fixed_expenses for all using (true) with check (true);
create policy "dev_all_schedules" on public.schedules for all using (true) with check (true);
create policy "dev_all_expenses" on public.expenses for all using (true) with check (true);
create policy "dev_all_bank_balances" on public.bank_balances for all using (true) with check (true);
