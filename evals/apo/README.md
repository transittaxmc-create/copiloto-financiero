# Loop APO — Optimización Automática de Prompts (adaptado a ESTE repo)

> Corrige el framework APO genérico que citaba Python/FastAPI/pytest. Verificado contra
> `ARCHITECTURE.md` (Next.js 14 + Supabase) y `package.json` (sin pytest, sin SQLAlchemy).

## Las 5 partes, adaptadas a la realidad

| Parte | Genérico (citado) | Aquí (ejecutable) |
|---|---|---|
| 1. Seed ρ₀ | Python/FastAPI | `seed-prompt.md` (Next.js-first, corregido) |
| 2. Candidatos | Metaprompt OPRO | `generate-candidate.mjs` (OpenAI si hay key; **este repo no tiene `OPENAI_API_KEY`** → hoy corre en modo manual: el metaprompt exacto está en ese script, pégalo en tu LLM y guarda el resultado en `evals/apo/candidates/`) |
| 3. Evaluación | pytest + timeit | `score-prompt.mjs`: checks estáticos del prompt + `npm run typecheck` como gate de entorno. Fase 2 (código generado por caso) usa `cases.json` |
| 4. Selección | UCB bandits | **TopK greedy** — con 1-3 candidatos por iteración, bandits es sobre-ingeniería |
| 5. UnCert-CoT | Configurar | **Ya existe** en el seed (`DINO-UNCERT-COT`) — no duplicar |

## Ciclo de iteración (repetir)

1. `node evals/apo/score-prompt.mjs` → score del seed actual (`score.json`)
2. `node evals/apo/generate-candidate.mjs` → 1 candidato que ataca los checks fallidos
3. Humano revisa el candidato → si aprueba, reemplaza `seed-prompt.md`
4. Rerun score → parar cuando el feedback esté consistentemente vacío o no haya mejora significativa

## Por qué así

- **Gates reales, no inventados**: este repo no tiene pytest; su garantía de calidad es `tsc` + Zod + build. El scorer usa lo que existe.
- **Humano en el loop**: el candidato NUNCA reemplaza el seed automáticamente (mismo criterio que las iteraciones del skill).
- **Lean**: 1 seed + 1 scorer + 1 generador + casos. Sin reglas por caso puntual.
