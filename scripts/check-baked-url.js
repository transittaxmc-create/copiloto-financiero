// Decide: el deployment real tiene la URL correcta horneada?
const B = 'https://copiloto-financiero-91mpdsjal-island-city.vercel.app';
(async () => {
  const r = await fetch(B + '/', { cache: 'no-store' });
  const html = await r.text();
  console.log('direct-html-len', html.length);
  console.log('contains-fmnkx', html.includes('fmnkxpifdkrzbpgixiti'));
  console.log('contains-rwgrmj', html.includes('rwgrmjxigljrhaparndi'));
  const any = [...html.matchAll(/[a-z0-9]{20}\.supabase\.co/g)].map(m => m[0]);
  console.log('supabase-urls-en-html', JSON.stringify([...new Set(any)]));
  const chunkRe = /(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g;
  const staticRefs = [...new Set([...html.matchAll(chunkRe)].map(m => m[1]))].slice(0, 6);
  console.log('static-refs', JSON.stringify(staticRefs));
  for (const s of staticRefs) {
    const c = await (await fetch(B + s, { cache: 'no-store' })).text();
    if (c.includes('supabase.co')) {
      console.log('CHUNK', s.split('/').pop(), JSON.stringify([...new Set(c.match(/[a-z0-9]{20}\.supabase\.co/g) || [])]));
    }
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });