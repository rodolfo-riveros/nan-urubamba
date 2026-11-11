/**
 * Genera src/data/official.json a partir del Inventario Nacional de Recursos Turísticos (MINCETUR).
 * Fuente: https://www.datosabiertos.gob.pe/dataset/inventario-nacional-de-recursos-turísticos
 * Licencia: Open Data Commons Attribution (ODC-BY) — se debe citar a MINCETUR.
 *
 * Uso:
 *   1) Descarga el CSV y las fichas (ver README, sección "Actualizar datos oficiales").
 *   2) node scripts/mincetur-4-build.js <parsed.json>
 */
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Uso: node scripts/mincetur-4-build.js <parsed.json>');
  process.exit(1);
}
const rows = JSON.parse(fs.readFileSync(input, 'utf8'));
const EN = JSON.parse(fs.readFileSync(path.join(__dirname, 'official-en.json'), 'utf8'));

const DISTRICT = {
  OLLANTAYTAMBO: 'Ollantaytambo',
  URUBAMBA: 'Urubamba',
  CHINCHERO: 'Chinchero',
  MARAS: 'Maras',
  HUAYLLABAMBA: 'Huayllabamba',
  YUCAY: 'Yucay',
  MACHUPICCHU: 'Machupicchu',
};

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const titleFix = (s) =>
  clean(s)
    .replace(/\s+\.$/, '')
    .replace(/\.$/, '')
    .replace(/\b(De|Del|La|Las|Los|En|Y|O)\b/g, (w) => w.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());

function firstSentence(text, max = 170) {
  const t = clean(text);
  const m = t.match(/^(.{40,}?[.;])\s/);
  let s = m ? m[1] : t;
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return s;
}

function parseMinutes(s) {
  if (!s) return 0;
  const t = s.toLowerCase().replace(',', '.');
  let m = 0;
  const d = t.match(/(\d+(?:\.\d+)?)\s*d[ií]as?/);
  if (d) m += parseFloat(d[1]) * 8 * 60;
  const hm = t.match(/(\d+):(\d+)\s*(hr|h)/);
  if (hm) m += parseInt(hm[1]) * 60 + parseInt(hm[2]);
  else {
    const h = t.match(/(\d+(?:\.\d+)?)\s*(h\b|hr|hrs|hora|horas)/);
    if (h) m += parseFloat(h[1]) * 60;
    // "min" siempre son minutos; una "m" suelta solo si va después de horas ("1h 32m"), si no son metros
    const mi = t.match(/(\d+)\s*min/) || (h ? t.match(/h\w*\.?\s*(\d+)\s*m\b/) : null);
    if (mi) m += parseInt(mi[1]);
  }
  return m;
}

function parseKm(s) {
  if (!s) return 0;
  const t = s.toLowerCase().replace(',', '.');
  const k = t.match(/(\d+(?:\.\d+)?)\s*km/);
  if (k) return parseFloat(k[1]);
  const me = t.match(/(\d+(?:\.\d+)?)\s*(m\.|mts|metros|m\b)/);
  if (me) return parseFloat(me[1]) / 1000;
  return 0;
}

function modeOf(medio) {
  const m = (medio || '').toLowerCase();
  if (/a pie|caminat/.test(m)) return 'walk';
  if (/tren|estaci[oó]n/.test(m)) return 'train';
  if (/taxi|mototaxi/.test(m)) return 'taxi';
  if (/bus|combi|colectivo|minivan/.test(m)) return 'bus';
  return 'car';
}

const MEDIO_EN = {
  'Automóvil particular': 'Private car',
  'Mini bus turístico': 'Tourist minibus',
  'Bus turístico': 'Tourist bus',
  'Mini bus público': 'Public minibus',
  Combi: 'Shared van',
  Taxi: 'Taxi',
  'A pie': 'On foot',
};
const VIA_EN = {
  Asfaltado: 'paved road',
  Afirmado: 'gravel road',
  'Trocha carrozable': 'dirt road',
  Sendero: 'trail',
  'Camino de Herradura': 'mule track',
};

const ADVENTURE = /trekking|caminata|camping|escalada|canotaje|kayak|ciclismo|montañismo|cabalgata|paseos a caballo|parapente|canopy|rappel|pesca|paseos en lancha|bicicleta/i;

function categoriesOf(r) {
  const st = (r.subtipo || '').toLowerCase();
  const tp = (r.tipo || '').toLowerCase();
  const cat = r.categoria || '';
  const out = [];
  if (/laguna/.test(st)) out.push('lagunas');
  if (/catarata|cascada/.test(st)) out.push('cataratas');
  if (/mirador/.test(st) || /^mirador/i.test(r.name)) out.push('miradores');
  if (/nevado|montaña/.test(st) || /montañas/.test(tp)) out.push('nevados');
  if (/cerro/.test(st)) out.push('miradores', 'paisajes');
  if (cat.startsWith('1.') && !out.length) out.push('paisajes');
  if (/arqueol/.test(tp)) out.push('arqueologia');
  if (/^2\.|^3\.|^4\.|^5\./.test(cat) && !/arqueol/.test(tp)) out.push('cultura');
  if (r.acts.some((a) => ADVENTURE.test(a))) out.push('aventura');
  return [...new Set(out)];
}

const out = [];
for (const r of rows) {
  const isEvent = /^5\./.test(r.categoria) || (/^3\./.test(r.categoria) && !r.ruta.length);
  // Filas con distinto "n" son rutas alternativas: usamos la primera
  const firstN = r.ruta.length ? r.ruta[0].n : 1;
  const ruta = r.ruta
    .filter((x) => x.n === firstN)
    .map((x) => {
      const p = x.parts;
      if (p.length < 5) return null;
      const detalle = clean(p[2]);
      const medio = clean(p[4]);
      const via = p.length >= 7 ? clean(p[5]) : '';
      const dist = clean(p[p.length - 1]);
      return { detalle, medio, via, dist, mode: modeOf(medio + ' ' + detalle) };
    })
    .filter(Boolean)
    // descartamos tramos desde la ciudad del Cusco (la app parte desde los pueblos del valle)
    .filter((x, i, arr) => !(arr.length > 1 && i === 0 && /^cusco|plaza de armas del cusco|paradero.*cusco/i.test(x.detalle)));

  const walkMin = ruta.filter((x) => x.mode === 'walk').reduce((a, x) => a + parseMinutes(x.dist), 0);
  const multiDay = ruta.some((x) => /d[ií]as/.test(x.dist));
  const alt = r.altitud && r.altitud < 6000 ? r.altitud : undefined;

  let difficulty = 'facil';
  if (multiDay) difficulty = 'experto';
  else if (walkMin >= 150) difficulty = 'dificil';
  else if (walkMin >= 40) difficulty = 'moderada';
  if (alt && alt > 3800 && difficulty === 'moderada') difficulty = 'dificil';

  const visit = isEvent ? 3 : /museo|templo|iglesia|tradicionales|ferias/i.test(r.subtipo) ? 1 : 1.5;
  let hours = multiDay ? 24 : Math.round((visit + (walkMin * 2) / 60) * 2) / 2;
  hours = Math.max(1, Math.min(hours, 12));

  const times = (r.epoca || []).filter((x) => /\d{1,2}:\d{2}/.test(x));
  const season = (r.epoca || [])[0] && !/^\d/.test(r.epoca[0]) ? clean(r.epoca[0]) : '';
  const horario = [season, times.length >= 2 ? `${times[0]} – ${times[1]}` : ''].filter(Boolean).join(' · ');

  const acts = [...new Set(r.acts.map(clean))].filter(
    (a) => a && a.length < 60 && !/^(otros|naturaleza|deportes \/ aventura|folclore|paseos|actividades|observación)$/i.test(a),
  );

  const walkKm = ruta.filter((x) => x.mode === 'walk').reduce((a, x) => a + parseKm(x.dist), 0);

  out.push({
    code: r.code,
    name: titleFix(r.name),
    district: DISTRICT[r.district] || r.district,
    categoria: r.categoria,
    tipo: r.tipo,
    subtipo: clean(r.subtipo),
    kind: isEvent ? 'event' : 'place',
    lat: +r.lat.toFixed(6),
    lon: +r.lon.toFixed(6),
    alt,
    jerarquia: r.jerarquia ? parseInt(r.jerarquia) || undefined : undefined,
    toponimia: clean(r.toponimia) || undefined,
    referencia: clean(r.referencia) || undefined,
    summary: { es: firstSentence(r.desc), en: EN[r.code] || '' },
    desc: r.desc.trim(),
    estado: clean(r.estado) || undefined,
    ingreso: clean(r.ingreso) || undefined,
    horario: horario || undefined,
    acts,
    categories: categoriesOf(r),
    difficulty,
    hours,
    routeKm: Math.round(walkKm * 10) / 10,
    ruta: ruta.map((x) => ({
      mode: x.mode,
      title: {
        es: x.detalle,
        en: x.detalle,
      },
      detail: {
        es: [x.medio, x.via ? x.via.toLowerCase() : ''].filter(Boolean).join(' · '),
        en: [MEDIO_EN[x.medio] || x.medio, VIA_EN[x.via] || x.via.toLowerCase()].filter(Boolean).join(' · '),
      },
      time: x.dist,
    })),
    fotos: r.fotos.slice(0, 4).map((c) => `https://consultasenlinea.mincetur.gob.pe/fichaInventario/foto.aspx?cod=${c}`),
    url: r.url,
  });
}

const dest = path.join(__dirname, '..', 'src', 'data', 'official.json');
fs.writeFileSync(
  dest,
  JSON.stringify(
    {
      source: 'MINCETUR — Inventario Nacional de Recursos Turísticos',
      license: 'ODC-BY',
      url: 'https://www.datosabiertos.gob.pe/dataset/inventario-nacional-de-recursos-tur%C3%ADsticos',
      generatedAt: new Date().toISOString().slice(0, 10),
      items: out,
    },
    null,
    1,
  ),
);
const missingEn = out.filter((o) => !o.summary.en).map((o) => o.code);
console.log(`OK: ${out.length} recursos → ${dest}`);
if (missingEn.length) console.log('Sin resumen EN:', missingEn.join(', '));
const counts = {};
out.forEach((o) => o.categories.forEach((c) => (counts[c] = (counts[c] || 0) + 1)));
console.log(counts, 'eventos:', out.filter((o) => o.kind === 'event').length);
