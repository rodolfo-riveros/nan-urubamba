import type { Business, BusinessType } from './types';

/**
 * Hospedajes y restaurantes.
 * ⚠️ Estos registros son DE EJEMPLO (demo: true): reemplázalos por negocios
 * reales con su WhatsApp y coordenadas antes de publicar la app.
 */
export const BUSINESSES: Business[] = [
  // Ollantaytambo
  { id: 'b1', type: 'hostal', name: 'Hostal Patacancha', district: 'Ollantaytambo', coords: { latitude: -13.2566, longitude: -72.2628 }, priceLevel: 2, rating: 4.7, highlight: { es: 'Desayuno incluido', en: 'Breakfast included' }, demo: true },
  { id: 'b2', type: 'casa', name: 'Casa de huéspedes Willoq', district: 'Ollantaytambo', coords: { latitude: -13.2105, longitude: -72.2265 }, priceLevel: 1, rating: 4.5, highlight: { es: 'Con familia local', en: 'With a local family' }, demo: true },
  { id: 'b3', type: 'ecolodge', name: 'Ecolodge Mirador del Valle', district: 'Ollantaytambo', coords: { latitude: -13.2405, longitude: -72.249 }, priceLevel: 3, rating: 4.9, highlight: { es: 'Vista al valle', en: 'Valley view' }, demo: true },
  { id: 'b4', type: 'restaurante', name: 'Restaurante Qollqa', district: 'Ollantaytambo', coords: { latitude: -13.2586, longitude: -72.2637 }, priceLevel: 2, rating: 4.6, highlight: { es: 'Trucha y cocina andina', en: 'Trout and Andean food' }, demo: true },
  { id: 'b5', type: 'cafe', name: 'Café del Puente Inca', district: 'Ollantaytambo', coords: { latitude: -13.2602, longitude: -72.2655 }, priceLevel: 1, rating: 4.4, highlight: { es: 'Café de la selva cusqueña', en: 'Cusco jungle coffee' }, demo: true },
  { id: 'b6', type: 'picanteria', name: 'Picantería Socma', district: 'Ollantaytambo', coords: { latitude: -13.231, longitude: -72.2965 }, priceLevel: 1, rating: 4.3, highlight: { es: 'Chicharrón y chicha', en: 'Chicharrón and chicha' }, demo: true },
  // Urubamba
  { id: 'b7', type: 'hotel', name: 'Hotel Valle Urubamba', district: 'Urubamba', coords: { latitude: -13.3065, longitude: -72.1185 }, priceLevel: 3, rating: 4.6, highlight: { es: 'Jardines y piscina', en: 'Gardens and pool' }, demo: true },
  { id: 'b8', type: 'hostal', name: 'Hostal Chicón', district: 'Urubamba', coords: { latitude: -13.3025, longitude: -72.1148 }, priceLevel: 1, rating: 4.4, highlight: { es: 'A 2 cuadras de la plaza', en: '2 blocks from the square' }, demo: true },
  { id: 'b9', type: 'restaurante', name: 'Restaurante Pumahuanca', district: 'Urubamba', coords: { latitude: -13.3051, longitude: -72.1172 }, priceLevel: 2, rating: 4.5, highlight: { es: 'Menú con productos locales', en: 'Local produce menu' }, demo: true },
  { id: 'b10', type: 'picanteria', name: 'Picantería La Urubambina', district: 'Urubamba', coords: { latitude: -13.3089, longitude: -72.1201 }, priceLevel: 1, rating: 4.7, highlight: { es: 'Cuy al horno los domingos', en: 'Roast cuy on Sundays' }, demo: true },
  // Chinchero
  { id: 'b11', type: 'casa', name: 'Casa tejedora Piuray', district: 'Chinchero', coords: { latitude: -13.401, longitude: -72.036 }, priceLevel: 1, rating: 4.8, highlight: { es: 'Talleres de tejido', en: 'Weaving workshops' }, demo: true },
  { id: 'b12', type: 'restaurante', name: 'Restaurante Montserrat', district: 'Chinchero', coords: { latitude: -13.3925, longitude: -72.0475 }, priceLevel: 2, rating: 4.4, highlight: { es: 'Sopas andinas', en: 'Andean soups' }, demo: true },
  // Maras
  { id: 'b13', type: 'hostal', name: 'Hostal Salineras', district: 'Maras', coords: { latitude: -13.3361, longitude: -72.1565 }, priceLevel: 1, rating: 4.3, highlight: { es: 'Casona colonial', en: 'Colonial house' }, demo: true },
  { id: 'b14', type: 'restaurante', name: 'Restaurante Moray', district: 'Maras', coords: { latitude: -13.3345, longitude: -72.158 }, priceLevel: 2, rating: 4.5, highlight: { es: 'Terraza con vista', en: 'Terrace with a view' }, demo: true },
  // Yucay / Huayllabamba
  { id: 'b15', type: 'hotel', name: 'Hotel Plaza Yucay', district: 'Yucay', coords: { latitude: -13.3198, longitude: -72.0826 }, priceLevel: 3, rating: 4.6, highlight: { es: 'Frente a la plaza', en: 'Facing the square' }, demo: true },
  { id: 'b16', type: 'casa', name: 'Casa de campo Urquillos', district: 'Huayllabamba', coords: { latitude: -13.338, longitude: -72.056 }, priceLevel: 2, rating: 4.7, highlight: { es: 'Huerto orgánico', en: 'Organic garden' }, demo: true },
  // Machupicchu
  { id: 'b17', type: 'hostal', name: 'Hostal Mandor', district: 'Machupicchu', coords: { latitude: -13.1549, longitude: -72.5245 }, priceLevel: 2, rating: 4.2, highlight: { es: 'Junto al río', en: 'By the river' }, demo: true },
  { id: 'b18', type: 'restaurante', name: 'Restaurante Putucusi', district: 'Machupicchu', coords: { latitude: -13.1541, longitude: -72.5249 }, priceLevel: 2, rating: 4.3, highlight: { es: 'Comida novoandina', en: 'Novo-Andean food' }, demo: true },
];

export const LODGING_TYPES: BusinessType[] = ['hostal', 'casa', 'ecolodge', 'hotel'];
export const FOOD_TYPES: BusinessType[] = ['restaurante', 'cafe', 'picanteria'];
