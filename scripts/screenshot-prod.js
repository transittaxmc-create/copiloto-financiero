// Captura de pantalla de producción — evidencia visual del deploy
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT_DIR = 'C:\\Users\\mcdri\\.cline\\data\\workspaces\\chat\\artifacts\\copiloto-prod';
fs.mkdirSync(OUT_DIR, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--no-first-run']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('https://copiloto-financiero-xi.vercel.app', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000)); // hidratación + reloj
  await page.screenshot({ path: path.join(OUT_DIR, 'home.png'), fullPage: true });
  const title = await page.title();
  await browser.close();
  console.log('SCREENSHOT_OK title="' + title + '"');
})().catch(e => { console.error('SCREENSHOT_ERR', e.message); process.exit(1); });
