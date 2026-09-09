// APO Fase 1 — Scorer estático del seed prompt + gate de entorno.
// Uso: node evals/apo/score-prompt.mjs
// Salida: evals/apo/score.json + resumen en consola. Exit 1 si falla.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const seedPath = join(here, 'seed-prompt.md');
const seed = readFileSync(seedPath, 'utf8');
const lines = seed.split(/\r?\n/);

const checks = [
  { id: 'stack-nextjs', ok: seed.includes('Next.js 14') && seed.includes('Supabase'), why: 'declara el stack real del repo' },
  { id: 'no-python-ghost', ok: !/FastAPI|SQLAlchemy|Python 3/i.test(seed), why: 'no hereda el stack fantasma Python del framework genérico' },
  { id: 'money-numeric', ok: seed.includes('NUMERIC(14,2)') && /nunca float/i.test(seed), why: 'regla de dinero (centavos/NUMERIC, nunca float)' },
  { id: 'zod-validation', ok: seed.includes('Zod'), why: 'validación de payloads con Zod' },
  { id: 'zero-trust', ok: /ZERO-TRUST/i.test(seed), why: 'regla de seguridad no negociable' },
  { id: 'secrets-env', ok: seed.includes('process.env') && /nunca commiteado/i.test(seed), why: 'secretos solo por env' },
  { id: 'anti-fabrication', ok: /ANTI-FABRICACIÓN|ANTI-FABRICACION|no inventes/i.test(seed), why: 'cláusula anti-alucinación' },
  { id: 'uncert-cot', ok: /DINO-UNCERT-COT/i.test(seed), why: 'razonamiento guiado por incertidumbre (ya existía, no duplicar)' },
  { id: 'offline-first', ok: /offline-first/i.test(seed), why: 'arquitectura real de este repo (localStorage → syncManager)' },
  { id: 'lean', ok: lines.length <= 60, why: `seed lean (≤60 líneas; tiene ${lines.length})` },
];

// Gate de entorno: el seed opera sobre un repo que DEBE compilar.
const gate = spawnSync('npm', ['run', 'typecheck'], { cwd: repoRoot, shell: true, encoding: 'utf8' });
const gateOk = gate.status === 0;

const passed = checks.filter(c => c.ok).length;
const score = passed + (gateOk ? 2 : 0); // 12 = máximo
const result = {
  seed: 'evals/apo/seed-prompt.md',
  checks,
  passed,
  totalChecks: checks.length,
  gateTypecheck: gateOk ? 'PASS' : 'FAIL',
  score,
  maxScore: checks.length + 2,
  verdict: gateOk && passed === checks.length ? 'PASS' : 'FAIL',
  generatedAt: new Date().toISOString(),
};

writeFileSync(join(here, 'score.json'), JSON.stringify(result, null, 2) + '\n');
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.id} — ${c.why}`);
console.log(`${gateOk ? 'PASS' : 'FAIL'}  gate:typecheck — tsc --noEmit sobre el repo`);
console.log(`SCORE: ${score}/${result.maxScore} → ${result.verdict}`);
process.exit(result.verdict === 'PASS' ? 0 : 1);
