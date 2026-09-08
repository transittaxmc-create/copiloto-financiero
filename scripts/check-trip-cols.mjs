// Ve la estructura de la tabla trips vía OpenAPI de PostgREST
import { readFileSync } from 'fs';
const env = readFileSync('C:/Users/mcdri/.cline/data/workspaces/chat/copiloto-financiero/.env.local', 'utf8');
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/m)?.[1]?.trim();
const key = env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/m)?.[1]?.trim();
(async () => {
  const r = await fetch(url + '/rest/v1/', {
    headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/openapi+json' }
  });
  const spec = await r.json();
  const paths = Object.keys(spec.paths || {});
  const tripsPath = paths.find(p => p.includes('/trips'));
  console.log('status', r.status, '| paths total', paths.length, '| tripsPath', tripsPath);
  const schema = spec.paths?.[tripsPath]?.get?.responses?.['200']?.content?.['application/json']?.schema;
  if (schema) {
    const props = Object.keys(schema.properties || {});
    console.log('TRIPS_COLUMNS', props.join(', '));
  } else {
    console.log('schema no encontrado; raw keys:', JSON.stringify(Object.keys(spec)).slice(0, 300));
  }
})().catch(e => console.log('ERR', e.message));