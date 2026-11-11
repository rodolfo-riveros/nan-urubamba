import type { CareKey, Category, Difficulty, District, LText } from './types';

const t = (es: string, en: string): LText => ({ es, en });

export const CATEGORIES: { key: Category; label: LText; icon: string }[] = [
  { key: 'paisajes', label: t('Paisajes', 'Landscapes'), icon: 'image-filter-hdr' },
  { key: 'lagunas', label: t('Lagunas', 'Lakes'), icon: 'waves' },
  { key: 'arqueologia', label: t('Arqueología', 'Archaeology'), icon: 'wall' },
  { key: 'cataratas', label: t('Cataratas', 'Waterfalls'), icon: 'waterfall' },
  { key: 'miradores', label: t('Miradores', 'Viewpoints'), icon: 'binoculars' },
  { key: 'nevados', label: t('Nevados', 'Snow peaks'), icon: 'snowflake' },
  { key: 'aventura', label: t('Aventura', 'Adventure'), icon: 'hiking' },
  { key: 'cultura', label: t('Cultura viva', 'Living culture'), icon: 'drama-masks' },
];

export const categoryOf = (k: Category) => CATEGORIES.find((c) => c.key === k)!;

export const DIFFICULTIES: { key: Difficulty; label: LText; hint: LText }[] = [
  { key: 'facil', label: t('Fácil', 'Easy'), hint: t('Terreno llano', 'Flat terrain') },
  { key: 'moderada', label: t('Moderada', 'Moderate'), hint: t('Subida constante', 'Steady climb') },
  { key: 'dificil', label: t('Difícil', 'Hard'), hint: t('Pendiente fuerte', 'Steep gradient') },
  { key: 'experto', label: t('Experto', 'Expert'), hint: t('Altura y exigencia', 'High & demanding') },
];

export const difficultyOf = (k: Difficulty) => DIFFICULTIES.find((d) => d.key === k)!;

export const DISTRICTS: District[] = [
  'Ollantaytambo',
  'Urubamba',
  'Chinchero',
  'Maras',
  'Huayllabamba',
  'Yucay',
  'Machupicchu',
];

export type DurationBucket = 'lt2' | '2to4' | '4to6' | 'day';
export const DURATIONS: { key: DurationBucket; label: LText; test: (h: number) => boolean }[] = [
  { key: 'lt2', label: t('< 2 h', '< 2 h'), test: (h) => h < 2 },
  { key: '2to4', label: t('2–4 h', '2–4 h'), test: (h) => h >= 2 && h <= 4 },
  { key: '4to6', label: t('4–6 h', '4–6 h'), test: (h) => h > 4 && h <= 6 },
  { key: 'day', label: t('Día entero', 'Full day'), test: (h) => h > 6 },
];

export const CARES: Record<CareKey, { icon: string; title: LText; text: LText }> = {
  altura: {
    icon: 'heart-pulse',
    title: t('Altura y soroche', 'Altitude sickness'),
    text: t('Aclimátate un día antes. Sube despacio y para si te mareas.', 'Acclimatise a day before. Climb slowly and stop if you feel dizzy.'),
  },
  agua: {
    icon: 'water-outline',
    title: t('Lleva agua', 'Bring water'),
    text: t('Mínimo 1,5 L por persona. No hay tiendas en el sitio.', 'At least 1.5 L per person. There are no shops on site.'),
  },
  sol: {
    icon: 'weather-sunny',
    title: t('Protector solar y sombrero', 'Sunscreen and hat'),
    text: t('La radiación UV en altura es muy alta, incluso nublado.', 'UV radiation at altitude is very high, even when cloudy.'),
  },
  capas: {
    icon: 'tshirt-crew',
    title: t('Ropa en capas', 'Dress in layers'),
    text: t('Mañanas frías, mediodía caluroso. Casaca contra viento.', 'Cold mornings, hot midday. Bring a windproof jacket.'),
  },
  patrimonio: {
    icon: 'hand-back-right-off',
    title: t('No toques ni subas a los muros', "Don't touch or climb walls"),
    text: t('Es patrimonio. Camina solo por los senderos marcados.', 'This is heritage. Only walk on marked paths.'),
  },
  guia: {
    icon: 'account-tie',
    title: t('Guía recomendado', 'Guide recommended'),
    text: t('Hay guías locales en las plazas de los pueblos cercanos.', 'Local guides can be found in nearby town squares.'),
  },
  lluvia: {
    icon: 'weather-pouring',
    title: t('Temporada de lluvias', 'Rainy season'),
    text: t('De diciembre a marzo llueve casi a diario. Lleva poncho.', 'From December to March it rains almost daily. Bring a poncho.'),
  },
  sendero: {
    icon: 'ladder',
    title: t('Sendero empinado', 'Steep trail'),
    text: t('Usa calzado con buen agarre. Evita bajar con prisa.', 'Wear shoes with good grip. Do not rush going down.'),
  },
  entrada: {
    icon: 'ticket-outline',
    title: t('Pago de ingreso', 'Entrance fee'),
    text: t('Se paga en la entrada o con el boleto turístico.', 'Pay at the entrance or with the tourist ticket.'),
  },
  efectivo: {
    icon: 'cash',
    title: t('Lleva efectivo y sencillo', 'Bring small cash'),
    text: t('No hay cajeros ni pago con tarjeta en la zona.', 'No ATMs or card payments in the area.'),
  },
  frio: {
    icon: 'snowflake-alert',
    title: t('Frío intenso', 'Intense cold'),
    text: t('Temperaturas bajo cero en las mañanas de invierno.', 'Below-freezing temperatures on winter mornings.'),
  },
  resbaloso: {
    icon: 'alert-outline',
    title: t('Terreno resbaloso', 'Slippery ground'),
    text: t('Rocas mojadas cerca del agua. Pisa con cuidado.', 'Wet rocks near the water. Watch your step.'),
  },
};

export const ROUTE_ICONS: Record<string, string> = {
  bus: 'bus',
  taxi: 'taxi',
  walk: 'walk',
  train: 'train',
  car: 'car',
};
