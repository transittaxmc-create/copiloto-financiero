# Copiloto Financiero · Rideshare

App PWA para conductores de rideshare (Uber/Lyft/Via): captura de trips diarios,
auditoría E-ZPass (OCR), gastos, conciliación con statements y reportes fiscales.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (PostgreSQL) para persistencia
- TomTom API para GPS/geocoding
- OpenAI API para OCR de peajes (E-ZPass) y recibos

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key de Supabase>
TOMTOM_API_KEY=<opcional, GPS/geocoding>
```

> ⚠️ `NEXT_PUBLIC_*` van **tanto en `.env.local` como en Vercel** (Settings → Environment
> Variables). La anon key es pública pero el proyecto URL + key deben ser **del mismo
> proyecto Supabase** — si apuntan a proyectos distintos, cada insert da `401 Invalid API key`.

## Desarrollo local

```bash
npm install
npm run dev     # http://localhost:3000
```

## Deploy

Push a `master`; Vercel auto-despliega producción.
El proyecto de producción usa las variables `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` del entorno de Producción en Vercel.

## Base de datos

La tabla `trips` guarda cada viaje capturado con `status: 'pending'` hasta que el
statement de la plataforma la reconcilía (`app/actions/reconcile.ts`).