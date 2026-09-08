// Smoke test E2E: UI producción → Supabase → cleanup
// (R1: evidencia = respuesta de red de la propia UI · R3: gate = GET/DELETE REST)
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_APP = 'https://copiloto-financiero-xi.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const respPromise = page.waitForResponse(
    r => r.url().includes('/rest/v1/trips') && r.request().method() === 'POST',
    { timeout: 45000 }
  );

  await page.goto(URL_APP, { waitUntil: 'networkidle2', timeout: 60000 });

  const btnFound = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some(b => b.textContent.includes('Guardar Trip'))
  );
  if (!btnFound) { console.log(JSON.stringify({ error: 'save button not found' })); process.exit(1); }

  const inputs = await page.$$('input[placeholder="0.00"]');
  if (inputs.length < 4) { console.log(JSON.stringify({ error: 'expected 4 decimal inputs, got ' + inputs.length })); process.exit(1); }
  await inputs[0].type('123.45'); // gross fare
  await inputs[1].type('10.50');  // tips
  await inputs[2].type('6.24');   // tolls
  await inputs[3].type('20.00');  // platform fee

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(b => b.textContent.includes('Guardar Trip')).click();
  });

  const resp = await respPromise;
  const insertStatus = resp.status();
  const inserted = await resp.json();
  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  const id = row && row.id;

  const toastOk = await page.evaluate(() => document.body.innerText.includes('Trip guardado exitosamente'));

  // Verificación REST con la url+apikey capturadas de la propia UI de producción
  const apikey = resp.request().headers()['apikey'];
  const base = new URL(resp.url()).origin;
  const H = { apikey, Authorization: 'Bearer ' + apikey };
  const g1 = await fetch(base + '/rest/v1/trips?id=eq.' + id, { headers: H });
  const after = await g1.json();
  const d = await fetch(base + '/rest/v1/trips?id=eq.' + id, {
    method: 'DELETE', headers: { ...H, Prefer: 'return=representation' }
  });
  const deleted = await d.json();
  const g2 = await fetch(base + '/rest/v1/trips?id=eq.' + id, { headers: H });
  const remaining = (await g2.json()).length;

  await browser.close();

  const checks = {
    ui_loaded_save_button: btnFound,
    insert_http_201: insertStatus === 201,
    toast_success: toastOk,
    row_persists_pending: Array.isArray(after) && after.length === 1 && after[0].status === 'pending',
    row_earnings_123_45: after[0] && Math.round(after[0].earnings * 100) === 12345,
    cleanup_deleted_1: Array.isArray(deleted) && deleted.length === 1,
    cleanup_zero_remaining: remaining === 0
  };
  console.log(JSON.stringify({
    insert_http_status: insertStatus,
    inserted_id: id,
    apikey_masked: apikey ? apikey.slice(0, 8) + '…' : null,
    supabase_project: base,
    checks
  }, null, 2));
  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
})().catch(e => { console.error('SMOKE_ERR', e.message); process.exit(1); });
