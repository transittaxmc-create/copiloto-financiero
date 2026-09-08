// Uso: node scripts/check-chunk.js <URL-deploy>
// Busca en los primeros chunks referenciados si hay URLs de supabase horneadas.
const B = process.argv[2] || 'https://copiloto-financiero-xi.vercel.app';
(async () => {
  const r = await fetch(B + '/', { cache: 'no-store' });
  const html = await r.text();
  console.log('html-len', html.length);
  const re = /(?:src|href)="([^"]*\/_next\/static\/chunks\/[^"]+)"/g;
  const uris = [...new Set([...html.matchAll(re)].map(m => m[1]))];
  console.log('chunks', uris.length);
  let hit = 0;
  for (const c of uris.slice(0, 8)) {
    const body = await (await fetch(B + c, { cache: 'no-store' })).text();
    if (body.includes('supabase.co')) {
      hit++;
      console.log('CHUNK', c.split('/').pop(), JSON.stringify([...new Set(body.match(/[a-z0-9]{20}\.supabase\.co/g) || [])]));
    }
  }
  console.log('chunks-with-supabase', hit);
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });