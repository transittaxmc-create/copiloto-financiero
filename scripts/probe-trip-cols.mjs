// Probe afinado: prueba cada columna candidata por separado
import { readFileSync } from 'fs';
const env = readFileSync('C:/Users/mcdri/.cline/data/workspaces/chat/copiloto-financiero/.env.local', 'utf8');
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/m)?.[1]?.trim();
const key = env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/m)?.[1]?.trim();
const H = { apikey: key, Authorization: 'Bearer ' + key };
const cols = ['pickup_name', 'dropoff_name', 'pickup_address', 'dropoff_address', 'black_car_phones_fee', 'pickup_gps', 'dropoff_gps'];
(async () => {
  for (const c of cols) {
    const r = await fetch(url + '/rest/v1/trips?select=' + c + '&limit=1', { headers: H });
    console.log(c, '=>', r.status === 200 ? 'EXISTS' : (r.status === 400 ? 'MISSING' : r.status));
  }
  const l = await import('lucide-react');
  for (const i of ['Building2', 'Plane', 'UtensilsCrossed', 'Store', 'Hotel', 'Fuel', 'Cross', 'Home', 'MapPin']) {
    console.log('icon', i, typeof l[i] !== 'undefined' ? 'OK' : 'NO');
  }
})().catch(e => console.log('ERR', e.message));