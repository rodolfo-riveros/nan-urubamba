import { PLACES } from '@/data/places';
import type { Coords, Place } from '@/data/types';
import { angleDiff, bearingDeg, distanceM } from './geo';

/** Sitios que se pueden reconocer con la cámara */
export const CAMERA_SITES = PLACES.filter((p) => p.categories.includes('arqueologia') || p.cameraInfo);

export const SEARCH_RADIUS_M = 3000;
export const NEAR_RADIUS_M = 8000;

export type Candidate = { place: Place; distance: number; bearing: number; diff: number | null; score: number };

/**
 * Calcula qué sitio está "enfrente" del usuario combinando:
 *  - distancia GPS al sitio
 *  - diferencia entre la orientación del teléfono (brújula) y el rumbo hacia el sitio
 * Si el usuario está dentro del sitio (< ~150 m + precisión) la orientación no importa.
 */
export function rankCandidates(from: Coords, heading: number | null, accuracy = 30): Candidate[] {
  const inside = 150 + Math.min(accuracy, 100);
  return CAMERA_SITES.map((place) => {
    const distance = distanceM(from, place.coords);
    const bearing = bearingDeg(from, place.coords);
    const diff = heading == null ? null : Math.abs(angleDiff(heading, bearing));
    let score: number;
    if (distance <= inside) {
      score = 0.97 - (distance / inside) * 0.07;
    } else if (distance > SEARCH_RADIUS_M) {
      score = 0;
    } else {
      // Tolerancia angular mayor si el sitio está cerca (ocupa más del campo visual)
      const tol = distance < 600 ? 45 : distance < 1500 ? 32 : 22;
      const ang = diff == null ? 0.5 : Math.max(0, 1 - diff / tol);
      const dist = Math.max(0, 1 - distance / SEARCH_RADIUS_M);
      score = ang === 0 ? 0 : ang * 0.6 + dist * 0.4;
    }
    return { place, distance, bearing, diff, score };
  }).sort((a, b) => b.score - a.score || a.distance - b.distance);
}

export function nearestSites(from: Coords, n = 3) {
  return CAMERA_SITES.map((place) => ({ place, distance: distanceM(from, place.coords) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

export const MATCH_THRESHOLD = 0.55;

export function confidencePct(score: number) {
  return Math.min(98, Math.round(55 + score * 43));
}

/** Lee coordenadas GPS del EXIF de una foto (si existen) */
export function coordsFromExif(exif: Record<string, unknown> | null | undefined): { coords: Coords; heading: number | null } | null {
  if (!exif) return null;
  const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN);
  let lat = num(exif.GPSLatitude);
  let lon = num(exif.GPSLongitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    const gps = exif['{GPS}'] as Record<string, unknown> | undefined;
    if (gps) {
      lat = num(gps.Latitude);
      lon = num(gps.Longitude);
      if (gps.LatitudeRef === 'S') lat = -Math.abs(lat);
      if (gps.LongitudeRef === 'W') lon = -Math.abs(lon);
    }
  } else {
    if (exif.GPSLatitudeRef === 'S') lat = -Math.abs(lat);
    if (exif.GPSLongitudeRef === 'W') lon = -Math.abs(lon);
  }
  if (Number.isNaN(lat) || Number.isNaN(lon) || (lat === 0 && lon === 0)) return null;
  const dir = num(exif.GPSImgDirection ?? (exif['{GPS}'] as Record<string, unknown> | undefined)?.ImgDirection);
  return { coords: { latitude: lat, longitude: lon }, heading: Number.isNaN(dir) ? null : dir };
}
