import { Linking, Platform } from 'react-native';
import type { Coords } from '@/data/types';

const R = 6371000; // radio terrestre (m)
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Distancia en metros (haversine) */
export function distanceM(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rumbo inicial de a hacia b, en grados 0–360 (0 = norte) */
export function bearingDeg(a: Coords, b: Coords): number {
  const φ1 = rad(a.latitude);
  const φ2 = rad(b.latitude);
  const Δλ = rad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Diferencia angular con signo en (-180, 180]. Positivo = el objetivo está a la derecha. */
export function angleDiff(from: number, to: number): number {
  let d = ((to - from + 540) % 360) - 180;
  if (d === -180) d = 180;
  return d;
}

/** Promedio circular de rumbos (para suavizar la brújula) */
export function circularMean(degs: number[]): number {
  if (!degs.length) return 0;
  let s = 0;
  let c = 0;
  for (const d of degs) {
    s += Math.sin(rad(d));
    c += Math.cos(rad(d));
  }
  return (deg(Math.atan2(s, c)) + 360) % 360;
}

export function formatDistance(m: number, lang: 'es' | 'en' = 'es'): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  const km = m / 1000;
  const v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return `${lang === 'es' ? v.replace('.', ',') : v} km`;
}

/** Abre Google Maps con indicaciones hasta el destino (app nativa si está instalada). */
export function openDirections(dest: Coords, label?: string, mode: 'driving' | 'walking' | 'transit' = 'driving') {
  const d = `${dest.latitude},${dest.longitude}`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=${mode}`;
  if (Platform.OS === 'android') {
    const nav = `google.navigation:q=${d}&mode=${mode === 'walking' ? 'w' : 'd'}`;
    return Linking.openURL(nav).catch(() => Linking.openURL(web));
  }
  if (Platform.OS === 'ios') {
    const app = `comgooglemaps://?daddr=${d}&directionsmode=${mode}${label ? `&q=${encodeURIComponent(label)}` : ''}`;
    return Linking.canOpenURL(app)
      .then((ok) => Linking.openURL(ok ? app : web))
      .catch(() => Linking.openURL(web));
  }
  return Linking.openURL(web);
}

export function openWhatsApp(phone: string, text: string) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return Linking.openURL(url);
}
