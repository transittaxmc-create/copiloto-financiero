# Reglas del Proyecto Financiero (Instrucciones Permanentes)

> Fuente: bloque 4 de la colección aprobada por el usuario (2026-09-09).
> Proyecto: `copiloto-financiero` (Next.js 14 + Supabase PostgreSQL).

- Regla #1: Mantén las sesiones cortas. Después de completar y probar una función, haz commit en Git y limpia el chat (/clear).
- Regla #2: Siempre utiliza tipos estrictos (TypeScript strict + Zod en Next.js; Type Hints + Pydantic v2 si es Python/FastAPI) para la validación de payloads financieros.
- Regla #3: Para consultas de base de datos de alta frecuencia, usa SQL directo / SQLAlchemy Core en lugar del ORM tradicional para maximizar la velocidad. En Supabase: vistas + índices en `(tenant_id, fecha)` y `numeric(14,2)` para dinero (nunca float).
- Regla #4: Toda modificación a esquemas o modelos de transacciones debe actualizar automáticamente la documentación técnica (`docs/` + este archivo).
- Regla #5: Nunca incluyas credenciales, llaves secretas o variables de entorno hardcodeadas en el código. Solo `process.env.*` / `.env.local` (nunca commiteado).

## Estado actual del schema (no romper)

Tablas existentes en `supabase/`: `trips`, `expenses`, `notifications`, `daily_balances`, `fixed_expenses`, `schedules`, `bank_balances`, `ezpass_records`, `ezpass_disputes`.
Nuevo módulo ACID: **PENDIENTE** — `supabase/migration_ledger_acid.sql` fue referenciado pero **NO existe en el repo** (verificado 2026-09-08). Debe crearse antes de usar `tenants`, `tenant_members`, `accounts`, `journals`, `journal_lines`, `bank_statement_lines`, `reconciliation_matches`. NO inventar queries contra esas tablas hasta que la migración exista.

---

# Master System Prompt — Reglas Operativas (adopción 2026-09-08)

> Complementan las 5 reglas de arriba; en conflicto, manda este archivo.

## Conflictos abiertos (NO cambiar sin confirmación del usuario)
| Área | Actual (producción) | Objetivo (Master Prompt) |
|---|---|---|
| Fondo de tema | Dark Slate `#0F172A` | Cyber Dark `#0B132B` + neón pickup `#10B981` / dropoff `#06B6D4` |
| Alto tarjeta GPS | `h-[60px]` | `h-[68px]` + `overflow-hidden` + `shrink-0` |
| Backend | API routes Next.js + Supabase | FastAPI + SQLAlchemy Core (solo si usuario confirma reescritura) |
| Multi-tenant | RLS por auth.uid() | header `X-Tenant-ID` (cubierto por `migration_ledger_acid.sql`) |

> REGLA DE MIGRACIÓN DE TEMA: nunca página por página; una sola pasada global + un solo commit.

## Estructura de datos GPS (invariante)
**L1** título (negocio o "Residencia") · **L2** dirección exacta · **L3** ciudad/condado · **L4** timestamp (`Vie, 11 sep • 7:36 AM`).
Vista compacta = **L1 + L4** (2 líneas). L2/L3 viven SIEMPRE en BD/JSON y se muestran en el modal de registro completo.

## Mapa de iconos (getCategoryIcon) — 24 categorías
`airport` ✈️ · `hospital/clinic` 🏥 · `hotel/lodging` 🏨 · `education` 🏫 · `commercial_office` 🏢 · `retail_shopping` 🛒 · `restaurant` 🍽️ · `transit_station` 🚉 · `gas_station` ⛽ · `pharmacy` 💊 · `salon_spa` ✂️ · `cafe_bakery` ☕ · `nightlife_bar` 🍺 · `bank_finance` 🏦 · `postal_courier` 📦 · `automotive_service` 🛠️ · `gym_sports` 🏋️ · `stadium` 🏟️ · `entertainment_cinema` 🎬 · `park_recreation` 🌳 · `government_public` 🏛️ · `place_of_worship` ⛪ · `public_business` 📍 · `residence` 🏠

> Regla: Nominatim comercial → icono de categoría; residencial (`house`/`apartment`/`residential`) → 🏠 Residencia.

## Errores de GPS
`accuracy > 50m` o error de geolocalización → tarjeta fija **"⚠️ Ubicación no confirmada"** + bloquear cierre del viaje + acciones: `[Reintentar GPS] [Ajustar pin en mapa] [Confirmar manualmente]`.

## Navegación
Navbar flotante tipo cápsula SOLO móvil (`md:hidden`); sidebar en ≥768px. Safe area: `pb-[calc(0.5rem+env(safe-area-inset-bottom))]` (ya aplicado, commit `0ac7f11`).

## Ledger de doble entrada (PENDIENTE)
La migración `supabase/migration_ledger_acid.sql` **no existe aún en el repo**. Cuando se cree, al guardar trip se insertarán automáticamente en `journal_lines`: **DÉBITO** `Gross Fare + Tips` · **CRÉDITO** `Net Payout` · **CRÉDITO** `Platform Fee + Tolls`.

## Protocolo del agente (UnCert-CoT)
- Greedy en tareas rutinarias (CRUD, UI estática, textos).
- Razonamiento extenso solo en: conciliación financiera, detección de duplicados, consistencia ACID del ledger.
- Antes de reportar éxito: `tsc --noEmit` + build + verificación HTTP con marcador de contenido.
