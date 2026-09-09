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
Nuevo módulo ACID vive en `supabase/migration_ledger_acid.sql` y NO altera esas tablas: solo añade `tenants`, `tenant_members`, `accounts`, `journals`, `journal_lines`, `bank_statement_lines`, `reconciliation_matches`.
