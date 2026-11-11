export type Lang = 'es' | 'en';
export type LText = { es: string; en: string };

export type Category =
  | 'paisajes'
  | 'lagunas'
  | 'arqueologia'
  | 'cataratas'
  | 'miradores'
  | 'nevados'
  | 'aventura'
  | 'cultura';
export type Difficulty = 'facil' | 'moderada' | 'dificil' | 'experto';
export type District =
  | 'Ollantaytambo'
  | 'Urubamba'
  | 'Chinchero'
  | 'Maras'
  | 'Huayllabamba'
  | 'Yucay'
  | 'Machupicchu';

export type Coords = { latitude: number; longitude: number };

export type RouteMode = 'bus' | 'taxi' | 'walk' | 'train' | 'car';

export type RouteStep = {
  mode: RouteMode;
  title: LText;
  detail: LText;
  cost?: string; // en soles, referencial
  time: string; // ej. "30 min"
};

export type CareKey =
  | 'altura'
  | 'agua'
  | 'sol'
  | 'capas'
  | 'patrimonio'
  | 'guia'
  | 'lluvia'
  | 'sendero'
  | 'entrada'
  | 'efectivo'
  | 'frio'
  | 'resbaloso';

export type Signal = 'buena' | 'debil' | 'nula' | 'desconocida';

export type Place = {
  id: string;
  name: string;
  /** La primera es la categoría principal */
  categories: Category[];
  district: District;
  coords: Coords;
  /** Punto de partida de la ruta (pueblo / plaza) */
  origin: { name: string; coords: Coords };
  difficulty: Difficulty;
  durationHours: number;
  durationNote: LText;
  altitude: number;
  bestSeason: LText;
  summary: LText;
  description: LText;
  history?: { culture: LText; period: LText; text: LText };
  /** Texto que se muestra en modo cámara al reconocer el sitio */
  cameraInfo?: LText;
  route: RouteStep[];
  routeKm: number;
  cares: CareKey[];
  extraCare?: LText;
  signal: Signal;
  publicTransport: boolean;
  /** Valoración base (antes de reseñas locales) */
  rating: number;
  ratingCount: number;
  photos?: string[];

  /** 'mincetur' = Inventario Nacional de Recursos Turísticos; 'curado' = agregado por el equipo; 'comunidad' = aporte aprobado */
  source: 'mincetur' | 'curado' | 'comunidad';
  kind: 'place' | 'event';
  /** Dificultad y duración estimadas a partir de la ruta oficial (no medidas en campo) */
  estimated?: boolean;
  official?: {
    code: string;
    url: string;
    subtype: string;
    description: string;
    toponymy?: string;
    reference?: string;
    state?: string;
    entry?: string;
    hours?: string;
    activities: string[];
  };
};

export type Review = {
  id: string;
  placeId: string;
  author: string;
  country: string;
  visitedAt: string; // YYYY-MM
  createdAt: string; // ISO
  rating: number; // 1..5
  text: string;
  tip?: string;
  lang: Lang;
  photos?: string[];
  mine?: boolean;
};

export type BusinessType = 'hostal' | 'casa' | 'ecolodge' | 'hotel' | 'restaurante' | 'cafe' | 'picanteria';

export type Business = {
  id: string;
  type: BusinessType;
  name: string;
  district: District;
  coords: Coords;
  priceLevel: 1 | 2 | 3;
  rating: number;
  highlight: LText;
  phone?: string; // formato internacional sin "+", ej. 51984000000
  /** true = registro de ejemplo; reemplazar por datos reales */
  demo?: boolean;
};
