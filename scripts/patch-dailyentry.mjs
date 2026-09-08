// Parchea components/DailyEntry.tsx: lógica de visualización GPS 2 líneas + campos de dirección (parte 1)
import { readFileSync, writeFileSync } from 'fs';
const P = 'C:/Users/mcdri/.cline/data/workspaces/chat/copiloto-financiero/components/DailyEntry.tsx';
let c = readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
let logs = [];
function rep(name, from, to, opts = { replaceAll: false }) {
  if (opts.replaceAll) {
    const n = c.split(from).length - 1;
    if (n === 0) { logs.push('FAIL(' + name + ') no match'); return; }
    c = c.split(from).join(to);
    logs.push('OK(' + name + ') x' + n);
  } else {
    if (!c.includes(from)) { logs.push('FAIL(' + name + ') no match'); return; }
    c = c.replace(from, to);
    logs.push('OK(' + name + ')');
  }
}

// A. import lucide: añadir Building2
rep('A-import', "import { Home, MapPin, Coffee,", "import { Building2, Home, MapPin, Coffee,");
// B. import schema
rep('B-schema', "import { supabase } from '@/lib/supabase';\nimport BottomNav", "import { supabase } from '@/lib/supabase';\nimport { tripsHasAddressFields } from '@/lib/schema';\nimport BottomNav");
// C. interface + helpers de clasificación
rep('C-interface', `  lat?: number;
  lng?: number;
}

export default function DailyEntry() {`, `  lat?: number;
  lng?: number;
  type?: 'business' | 'residence';
  houseNumber?: string;
  street?: string;
  state?: string;
  postcode?: string;
  fullAddress?: string | null;
}

// Clasificación negocio vs residencia desde el reverse-geocode de Nominatim
const BUSINESS_TAGS = ['shop', 'amenity', 'tourism', 'leisure', 'office', 'healthcare', 'aeroway', 'railway', 'building', 'craft', 'historic', 'club'];
const BUSINESS_KW = /airport|hospital|restaurant|hotel|motel|mall|market|station|terminal|office|clinic|dental|school|university|college|gym|fitness|store|shop|cafe|bar|diner|pier|marina|parking|garage|warehouse|factory|bank|pharmacy|petrol|gas station|theater|cinema/i;

function classifyLocation(data: any): boolean {
  const tag = String(data?.addresstype || data?.type || '');
  const name = String(data?.name || '');
  if (name && (BUSINESS_TAGS.includes(tag) || BUSINESS_KW.test(name))) return true;
  return false;
}

export default function DailyEntry() {`);
// D. probe useEffect
rep('D-probe', `  }, []);

  const captureLocation = (type: 'pickup' | 'dropoff') => {`, `  }, []);

  // Probe de esquema: habilita las columnas de dirección cuando existen en la DB
  useEffect(() => {
    (async () => {
      try {
        setSchemaOk(await tripsHasAddressFields());
      } catch {
        setSchemaOk(false);
      }
    })();
  }, []);

  const captureLocation = (type: 'pickup' | 'dropoff') => {`);
// E1. geocoding OK → clasificar + dirección completa
rep('E1-geocode', `            const road = data.address?.road || data.address?.neighbourhood || (type === 'pickup' ? 'Punto Recogida' : 'Punto Destino');
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Local';
            setLoc({ name: road, city, time: nowStr, lat, lng });`, `            const addr = data.address || {};
            const road = addr.road || addr.neighbourhood || (type === 'pickup' ? 'Punto Recogida' : 'Punto Destino');
            const city = addr.city || addr.town || addr.village || addr.county || 'Local';
            const houseNumber = String(addr.house_number || '');
            const state = String(addr.state || '');
            const postcode = String(addr.postcode || '');
            const isBiz = classifyLocation(data);
            const fullAddress = [houseNumber, road, city, state, postcode].filter(Boolean).join(', ');
            setLoc({
              name: isBiz ? String(data.name || road) : 'Residencia',
              city,
              time: nowStr,
              lat,
              lng,
              type: isBiz ? 'business' : 'residence',
              houseNumber,
              street: [houseNumber, road].filter(Boolean).join(' '),
              state,
              postcode,
              fullAddress: fullAddress || null,
            });`);
// E2. catch del geocoding
rep('E2-catch', `setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: 'Local', time: nowStr, lat, lng });`, `setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: 'Local', time: nowStr, lat, lng, type: 'residence' });`);
// E3. fallbacks sin-GPS (2 ocurrencias)
rep('E3-fallback', `setLoc({
            name: type === 'pickup' ? 'Residencia' : 'Business',
            city: type === 'pickup' ? 'Lindenhurst' : 'Copiague',
            time: nowStr,
          });`, `setLoc(
            type === 'pickup'
              ? { name: 'Residencia', city: 'Lindenhurst', time: nowStr, type: 'residence' as const, street: 'West Granada Ave', fullAddress: 'West Granada Ave, Lindenhurst, NY 11757' }
              : { name: 'Business', city: 'Copiague', time: nowStr, type: 'business' as const, fullAddress: 'Copiague, NY' }
          );`, { replaceAll: true });
const PART1 = JSON.stringify({ logs, done: 'PART1_OK' });
writeFileSync('C:/Users/mcdri/.cline/data/workspaces/chat/copiloto-financiero/scripts/_daily_part1.json', c);
console.log(logs.join('\n'));
console.log('PART1_DONE');