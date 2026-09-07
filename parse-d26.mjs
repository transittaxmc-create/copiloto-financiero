import fs from 'fs';
const fileName = process.argv[2] || 'd26.html';
let txt = fs.readFileSync(fileName, 'latin1');
if (txt.charCodeAt(0) === 0xFF && txt.charCodeAt(1) === 0xFE) {
  txt = Buffer.from(txt, 'binary').toString('utf16le');
}
const title = (txt.match(/<title>([^<]*)<\/title>/) || [])[1];
const chunks = [...new Set([...txt.matchAll(/\/_next\/static\/chunks\/([A-Za-z0-9_./-]*\.js)/g)].map(m => m[1]))];
console.log('TITLE:', title);
console.log('CHUNKS:', chunks.length);
chunks.forEach(c => console.log('  -', c));
fs.writeFileSync('chunks-list.txt', chunks.join('\n'));