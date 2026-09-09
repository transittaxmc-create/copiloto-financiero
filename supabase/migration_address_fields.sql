-- =============================================================
-- Migración: columnas de dirección legible en trips
-- (pickup_name, dropoff_name, pickup_address, dropoff_address)
-- Usadas por DailyEntry para mostrar negocio/residencia.
-- =============================================================

alter table public.trips add column if not exists pickup_name text;
alter table public.trips add column if not exists dropoff_name text;
alter table public.trips add column if not exists pickup_address text;
alter table public.trips add column if not exists dropoff_address text;