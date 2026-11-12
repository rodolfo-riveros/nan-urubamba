/**
 * Empaqueta Leaflet (BSD-2-Clause) dentro de la app para que el mapa del APK
 * funcione sin API key y sin depender de un CDN.
 * Uso: npm i --no-save leaflet@1.9.4 && node scripts/embed-leaflet.js
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'node_modules', 'leaflet', 'dist');
const js = fs.readFileSync(path.join(dir, 'leaflet.js'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'leaflet.css'), 'utf8');
const out = `/* eslint-disable */
// Leaflet 1.9.4 — https://leafletjs.com — BSD-2-Clause, © Volodymyr Agafonkin, © CloudMade.
// Generado por scripts/embed-leaflet.js. No editar.
export const LEAFLET_JS = ${JSON.stringify(js)};
export const LEAFLET_CSS = ${JSON.stringify(css)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'lib', 'leafletBundle.ts'), out);
console.log('ok', out.length);
