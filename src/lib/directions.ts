import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { TOWNS } from '@/data/places';
import type { Coords, Place } from '@/data/types';
import { distanceM } from './geo';

/**
 * Rutas desde la posición actual del usuario.
 *  1) Online + EXPO_PUBLIC_GOOGLE_DIRECTIONS_KEY → Google Directions API (ruta real por carretera / a pie).
 *  2) Sin conexión o sin key → ruta estimada: tu posición → pueblo de acceso más cercano → sendero al lugar.
 * Las rutas reales se guardan en el teléfono para reutilizarlas sin señal.
 */

const KEY = process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_KEY ?? '';
const CACHE = 'nan-urubamba/routes/v1/';

export type TravelMode = 'driving' | 'walking';

export type Route = {
  kind: 'google' | 'estimated';
  mode: TravelMode;
  points: Coords[];
  distanceM: number;
  durationMin: number;
  /** Pasos (solo Google) */
  steps: { text: string; distanceM: number }[];
  /** Punto de acceso usado en la ruta estimada */
  via?: string;
  from: Coords;
  fetchedAt: string;
};

/** Decodifica una polyline codificada de Google */
export function decodePolyline(str: string): Coords[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const out: Coords[] = [];
  while (index < str.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Ruta estimada sin conexión: elige el punto de acceso (pueblo u origen del lugar) que minimiza el recorrido total */
export function estimatedRoute(from: Coords, place: Place): Route {
  const candidates = [
    { name: place.origin.name, coords: place.origin.coords },
    ...Object.entries(TOWNS).map(([name, coords]) => ({ name, coords })),
  ];
  const direct = distanceM(from, place.coords);
  // Si ya estás cerca (< 3 km) vas directo a pie
  if (direct < 3000) {
    return {
      kind: 'estimated',
      mode: 'walking',
      points: [from, place.coords],
      distanceM: direct * 1.3,
      durationMin: Math.round(((direct * 1.3) / 1000 / 3.5) * 60),
      steps: [],
      from,
      fetchedAt: new Date().toISOString(),
    };
  }
  let best = candidates[0];
  let bestCost = Infinity;
  for (const c of candidates) {
    // carretera ~40 km/h (factor de sinuosidad 1.4) + caminata ~3.5 km/h
    const road = distanceM(from, c.coords) * 1.4;
    const trail = distanceM(c.coords, place.coords) * 1.3;
    const cost = road / 1000 / 40 + trail / 1000 / 3.5;
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  const road = distanceM(from, best.coords) * 1.4;
  const trail = distanceM(best.coords, place.coords) * 1.3;
  return {
    kind: 'estimated',
    mode: 'driving',
    points: [from, best.coords, place.coords],
    distanceM: road + trail,
    durationMin: Math.round(bestCost * 60),
    steps: [],
    via: best.name,
    from,
    fetchedAt: new Date().toISOString(),
  };
}

async function googleRoute(from: Coords, to: Coords, mode: TravelMode, lang: 'es' | 'en'): Promise<Route | null> {
  if (!KEY) return null;
  const url =
    `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}` +
    `&destination=${to.latitude},${to.longitude}&mode=${mode}&language=${lang}&region=pe&key=${KEY}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    if (json.status !== 'OK' || !json.routes?.length) return null;
    const r = json.routes[0];
    const legs = r.legs ?? [];
    const steps = legs.flatMap((l: { steps: { html_instructions: string; distance: { value: number } }[] }) =>
      l.steps.map((s) => ({ text: stripHtml(s.html_instructions), distanceM: s.distance.value })),
    );
    const points = decodePolyline(r.overview_polyline.points);
    // La carretera suele terminar antes del sitio: completamos el último tramo a pie
    const end = points[points.length - 1];
    if (end && distanceM(end, to) > 80) points.push(to);
    return {
      kind: 'google',
      mode,
      points,
      distanceM: legs.reduce((a: number, l: { distance: { value: number } }) => a + l.distance.value, 0),
      durationMin: Math.round(legs.reduce((a: number, l: { duration: { value: number } }) => a + l.duration.value, 0) / 60),
      steps,
      from,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Obtiene la mejor ruta disponible: Google (y la guarda) → caché → estimada */
export async function getRoute(from: Coords, place: Place, lang: 'es' | 'en'): Promise<Route> {
  const mode: TravelMode = distanceM(from, place.coords) < 3000 ? 'walking' : 'driving';
  const live = await googleRoute(from, place.coords, mode, lang);
  if (live) {
    AsyncStorage.setItem(CACHE + place.id, JSON.stringify(live)).catch(() => {});
    return live;
  }
  try {
    const raw = await AsyncStorage.getItem(CACHE + place.id);
    if (raw) {
      const cached: Route = JSON.parse(raw);
      // Solo sirve si saliste de cerca del mismo punto (< 2 km)
      if (distanceM(cached.from, from) < 2000) return cached;
    }
  } catch {
    // ignorar caché corrupta
  }
  return estimatedRoute(from, place);
}

/** Hook: ruta desde la posición actual al lugar (se recalcula si te mueves > 500 m) */
export function useRouteFrom(from: Coords | null, place: Place | undefined, lang: 'es' | 'en') {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const anchorLat = from ? Math.round(from.latitude * 200) / 200 : null; // ~500 m
  const anchorLon = from ? Math.round(from.longitude * 200) / 200 : null;

  useEffect(() => {
    if (!place || anchorLat == null || anchorLon == null) return;
    let alive = true;
    const origin = { latitude: anchorLat, longitude: anchorLon };
    const start = setTimeout(() => {
      setLoading(true);
      getRoute(origin, place, lang)
        .then((r) => alive && setRoute(r))
        .finally(() => alive && setLoading(false));
    }, 0);
    return () => {
      alive = false;
      clearTimeout(start);
    };
  }, [place, anchorLat, anchorLon, lang]);

  return { route, loading };
}

export function formatDuration(min: number, lang: 'es' | 'en') {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
