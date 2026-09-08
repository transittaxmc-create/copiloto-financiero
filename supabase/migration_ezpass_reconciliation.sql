-- =============================================================
-- MIGRACIÓN: Sistema de Reconciliación E-ZPass (Anti-Duplicados)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- =============================================================

-- Tabla principal para registros de E-ZPass de todas las fuentes
create table if not exists public.ezpass_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  
  -- Fuente de origen
  source text not null check (source in ('gps', 'screenshot', 'ezpass_statement', 'company_invoice')),
  
  -- Datos del viaje/cargo
  location text not null default 'Unknown',
  amount numeric(10,2) not null default 0,
  trip_date date not null,
  trip_time text,
  
  -- Referencias y notas
  reference_number text,
  notes text default '',
  
  -- Estado de conciliación
  status text not null default 'pending' check (status in ('pending', 'verified', 'duplicate', 'disputed', 'resolved')),
  
  -- Para duplicados: referencia al registro original
  duplicate_of_id uuid references public.ezpass_records(id) on delete set null,
  
  -- Metadata de evidencia
  evidence_urls text[] default '{}',
  screenshot_url text,
  
  -- Contabilidad
  is_personal_expense boolean default false,
  is_company_expense boolean default true,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla para disputas/generados PDF
create table if not exists public.ezpass_disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  
  -- Registro en disputa
  record_id uuid references public.ezpass_records(id) on delete cascade,
  
  -- Datos de la disputa
  dispute_number text not null,
  dispute_date timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'sent', 'resolved', 'rejected')),
  
  -- Archivos
  pdf_url text,
  evidence_urls text[] default '{}',
  
  -- Respuesta de la compañía
  response_notes text default '',
  resolved_at timestamptz,
  resolved_amount numeric(10,2),
  
  created_at timestamptz default now()
);

-- Índices para búsquedas rápidas
create index if not exists idx_ezpass_records_user_date on public.ezpass_records(user_id, trip_date);
create index if not exists idx_ezpass_records_source on public.ezpass_records(source);
create index if not exists idx_ezpass_records_status on public.ezpass_records(status);
create index if not exists idx_ezpass_records_datetime on public.ezpass_records(trip_date, trip_time);
create index if not exists idx_ezpass_disputes_user on public.ezpass_disputes(user_id);
create index if not exists idx_ezpass_disputes_status on public.ezpass_disputes(status);

-- RLS: habilitado con políticas permisivas para desarrollo
alter table public.ezpass_records enable row level security;
alter table public.ezpass_disputes enable row level security;

create policy "dev_all_ezpass_records" on public.ezpass_records for all using (true) with check (true);
create policy "dev_all_ezpass_disputes" on public.ezpass_disputes for all using (true) with check (true);

-- Función para actualizar updated_at
create or replace function public.update_ezpass_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para actualizar updated_at automáticamente
drop trigger if exists trigger_ezpass_updated_at on public.ezpass_records;
create trigger trigger_ezpass_updated_at
  before update on public.ezpass_records
  for each row
  execute function public.update_ezpass_updated_at();