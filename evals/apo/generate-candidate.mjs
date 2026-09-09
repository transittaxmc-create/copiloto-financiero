// APO Parte 2 — Genera 1 candidato de seed prompt atacando los checks fallidos.
// Requiere OPENAI_API_KEY en .env.local (solo nombres de vars, nunca el valor, se loguea).
// Uso: node evals/apo/generate-candidate.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

// 1. Key de .env.local (si no hay, exit 2 — NO se simula generación).
const envPath = join(repoRoot, '.env.local');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const key = env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) {
  console.error('SIN OPENAI_API_KEY en .env.local — no puedo generar candidatos automáticamente.');
  console.error('Alternativa manual: usa el metaprompt de evals/apo/README.md con tu LLM y guarda el resultado en evals/apo/candidates/.');
  process.exit(2);
}

// 2. Estado actual: seed + último score (si existe) para atacar solo lo fallido.
const seed = readFileSync(join(here, 'seed-prompt.md'), 'utf8');
const scorePath = join(here, 'score.json');
const failed = existsSync(scorePath)
  ? JSON.parse(readFileSync(scorePath, 'utf8')).checks.filter(c => !c.ok)
  : [];

const metaprompt = `Eres un optimizador de system prompts (estilo OPRO). Mejora el seed prompt de abajo
manteniéndolo LEAN (<=60 líneas) y SIN inventar capacidades que el repo no tiene.
Stack real y no negociable: Next.js 14 + TypeScript + Zod + Supabase + Vercel; dinero en NUMERIC(14,2)/centavos, nunca float.
${failed.length ? `Corrige SOLO estos checks fallidos: ${failed.map(f => `${f.id} (${f.why})`).join('; ')}.` : 'El seed ya pasa todos los checks: propón una mejora de claridad sin agregar reglas nuevas.'}
Responde ÚNICAMENTE con el nuevo contenido del prompt, sin explicaciones ni bloques de código.

SEED ACTUAL:
${seed}`;

// 3. Llamada a OpenAI.
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [{ role: 'user', content: metaprompt }],
  }),
});
if (!res.ok) {
  console.error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const candidate = (await res.json()).choices[0].message.content.trim();

// 4. Guardar como candidato (NUNCA reemplaza el seed automáticamente — revisa humano).
import { mkdirSync } from 'node:fs';
const candsDir = join(here, 'candidates');
mkdirSync(candsDir, { recursive: true });
const n = readdirSync(candsDir).filter(f => f.endsWith('.md')).length + 1;
const out = join(candsDir, `candidate-${n}.md`);
writeFileSync(out, candidate + '\n');
console.log(`Candidato guardado: evals/apo/candidates/candidate-${n}.md`);
console.log('Siguiente paso (humano): revisa, y si aprueba, reemplaza seed-prompt.md y corre score-prompt.mjs.');
