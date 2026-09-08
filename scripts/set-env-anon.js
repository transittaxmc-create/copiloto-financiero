// Ops: fija NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel vía API (sin prompts interactivos)
// Lee el token del CLI local (NO lo imprime) y el valor desde .key.tmp
const fs = require('fs');
const path = require('path');

const TOKEN_PATHS = [
  process.env.LOCALAPPDATA + '\\com.vercel.cli\\auth.json',
  process.env.APPDATA + '\\com.vercel.cli\\auth.json',
  process.env.USERPROFILE + '\\.vercel\\auth.json',
  process.env.LOCALAPPDATA + '\\vercel\\auth.json'
];
const tp = TOKEN_PATHS.find(p => fs.existsSync(p));
if (!tp) { console.log('NO_TOKEN_FILE'); process.exit(1); }
const token = JSON.parse(fs.readFileSync(tp, 'utf8')).token;
if (!token) { console.log('NO_TOKEN'); process.exit(1); }
console.log('token-file: ' + tp.split('\\').pop() + ' (oculto)');

const key = fs.readFileSync(path.join(__dirname, '.key.tmp'), 'utf8').split(/\r?\n/).filter(Boolean)[0];
if (!key) { console.log('NO_VALUE'); process.exit(1); }

const PROJECT_ID = 'prj_z3xF2oWSNMrSi0hBiOwEA5kvomY0';
const body = [{
  key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  value: key,
  type: 'encrypted',
  target: ['production', 'preview', 'development']
}];

fetch('https://api.vercel.com/v10/projects/' + PROJECT_ID + '/env?upsert=true', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(async r => {
  const j = await r.json().catch(() => ({}));
  console.log('API_STATUS=' + r.status);
  if (j.error) console.log('API_ERROR=' + JSON.stringify(j.error));
  if (j.created) console.log('created: ' + j.created.map(e => e.key + ' [' + e.target.join(',') + ']').join(' | '));
  process.exit(r.ok ? 0 : 1);
}).catch(e => { console.log('ERR ' + e.message); process.exit(1); });
