/**
 * Descarga imágenes de Wikimedia Commons (licencias libres), las redimensiona a 960x640
 * y genera src/data/images.ts + src/data/imageCredits.json (atribución obligatoria CC BY / BY-SA).
 * Uso: npm i --no-save sharp && node scripts/commons-images.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'images');
const UA = 'NanUrubambaApp/1.0 (https://github.com/rodolfo-riveros/nan-urubamba)';

const IMAGES = {
  // Lugares curados sin foto oficial
  'place-pumahuanca': 'File:Nevado Pumahuanca 04.jpg',
  'place-ipsaycocha': 'File:Peru - Lares Trek 030 - coming upon another gorgeous alpine lake (7586170744).jpg',
  'place-chicon': 'File:Nevado Chicón.jpg',
  'place-urquillos': 'File:Valle de la comunidad de Urquillos.jpg',
  // Hospedajes y restaurantes (imágenes referenciales)
  'biz-b1': 'File:Hostel Room Inside at UAiU.jpg',
  'biz-b2': 'File:Peru - Cusco Trekking 007 - looking out over the valley (7094766229).jpg',
  'biz-b3': 'File:Dawn at Ecolodge La Estancia, Isla del Sol, Bolivia.jpg',
  'biz-b4': 'File:Trucha frita.jpg',
  'biz-b5': 'File:Cafe pasado 14062011.jpg',
  'biz-b6': 'File:Chicha morada (olla).JPG',
  'biz-b7': 'File:Casona Yucay.jpg',
  'biz-b8': 'File:Homey Hostel bunk.jpg',
  'biz-b9': 'File:Pachamanca in Peru.jpg',
  'biz-b10': 'File:Cuy al horno en La Chomba, Cusco.jpg',
  'biz-b11': 'File:Chinchero District Peru- tied cattle at edge of town.jpg',
  'biz-b12': 'File:Rocoto relleno.jpg',
  'biz-b13': 'File:Maras, Perú, 2015-07-30, DD 26.JPG',
  'biz-b14': 'File:Lomo saltado El Fogon Huaraz 19122009.JPG',
  'biz-b15': 'File:Yucay su plaza.jpg',
  'biz-b16': 'File:Plaza de Armas de Urquillos, Huayllabamba, Urubamba, Cusco, 2026 01.jpg',
  'biz-b17': 'File:Aguas Calientes, Cuzco, Perú, 2015-07-30, DD 70.JPG',
  'biz-b18': 'File:Lomo-saltado-perudelights.jpg',
};

const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const credits = {};
  for (const [key, title] of Object.entries(IMAGES)) {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json`;
    const j = await (await fetch(api, { headers: { 'User-Agent': UA } })).json();
    const page = Object.values(j.query.pages)[0];
    const ii = page.imageinfo?.[0];
    if (!ii) {
      console.log('NO ENCONTRADA', key, title);
      continue;
    }
    const m = ii.extmetadata || {};
    const dest = path.join(OUT, `${key}.jpg`);
    if (!fs.existsSync(dest)) {
      const buf = Buffer.from(await (await fetch(ii.thumburl || ii.url, { headers: { 'User-Agent': UA } })).arrayBuffer());
      await sharp(buf).rotate().resize({ width: 960, height: 640, fit: 'cover', position: 'attention' }).jpeg({ quality: 70, mozjpeg: true }).toFile(dest);
      await sleep(600);
    }
    credits[key] = {
      title: title.replace(/^File:/, ''),
      author: strip(m.Artist?.value) || 'Desconocido',
      license: strip(m.LicenseShortName?.value),
      url: ii.descriptionurl,
    };
    console.log('ok', key, '|', credits[key].license, '|', credits[key].author);
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'imageCredits.json'), JSON.stringify(credits, null, 1));
  const lines = Object.keys(credits)
    .map((k) => `  '${k}': require('../../assets/images/${k}.jpg'),`)
    .join('\n');
  fs.writeFileSync(
    path.join(ROOT, 'src', 'data', 'images.ts'),
    `// Generado por scripts/commons-images.js — imágenes de Wikimedia Commons (ver imageCredits.json)\nexport const IMAGES: Record<string, number> = {\n${lines}\n};\n`,
  );
})();
