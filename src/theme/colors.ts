// Sistema "Andina contemporánea" (ver PDF de diseño).
export type Palette = {
  primary: string;
  primaryText: string;
  secondary: string;
  accent: string;
  water: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textSec: string;
  skeleton: string;
  overlay: string;
  primaryTint: string;
  secondaryTint: string;
  accentTint: string;
  danger: string;
};

export const light: Palette = {
  primary: '#B5462B',
  primaryText: '#FFFFFF',
  secondary: '#2F5D50',
  accent: '#E3A33B',
  water: '#3C7FA6',
  bg: '#F7F3EE',
  surface: '#FFFFFF',
  border: '#E6DED4',
  text: '#1E1B18',
  textSec: '#6B635B',
  skeleton: '#E6DED4',
  overlay: 'rgba(20,18,16,0.55)',
  primaryTint: '#F6E3DD',
  secondaryTint: '#DDE8E4',
  accentTint: '#FBF0DC',
  danger: '#C2412D',
};

export const dark: Palette = {
  primary: '#C4553A',
  primaryText: '#FFFFFF',
  secondary: '#5E9C8A',
  accent: '#E3A33B',
  water: '#5B9CC2',
  bg: '#141210',
  surface: '#1F1B18',
  border: '#332D28',
  text: '#F4EFE9',
  textSec: '#B3AAA1',
  skeleton: '#332D28',
  overlay: 'rgba(0,0,0,0.6)',
  primaryTint: '#3A2119',
  secondaryTint: '#1D2E29',
  accentTint: '#3A2E17',
  danger: '#E0644E',
};

// Dificultad — siempre color + texto + icono.
// `text` es la versión oscurecida para contraste 4.5:1 sobre el fondo tintado.
export const difficultyColors = {
  facil: { base: '#2F8F4E', text: '#1F6B38', tint: '#E1F2E6', icon: 'shoe-sneaker' },
  moderada: { base: '#E3A33B', text: '#8A5A0B', tint: '#FBF0DC', icon: 'trending-up' },
  dificil: { base: '#C2412D', text: '#962F1F', tint: '#F8E1DC', icon: 'image-filter-hdr' },
  experto: { base: '#5B2A86', text: '#5B2A86', tint: '#ECE2F4', icon: 'alert-decagram' },
} as const;

export const categoryColors: Record<string, string> = {
  paisajes: '#2F5D50',
  lagunas: '#3C7FA6',
  arqueologia: '#B5462B',
  cataratas: '#2E7D9A',
  miradores: '#C98A1E',
  nevados: '#6E8AA8',
  aventura: '#7A4E2D',
  cultura: '#8E3B6B',
};
