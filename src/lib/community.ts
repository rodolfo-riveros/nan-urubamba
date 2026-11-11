/**
 * Capa comunitaria + sincronización offline.
 *
 * - Bandeja de salida (outbox) persistida en AsyncStorage: reseñas, sugerencias, reportes y
 *   borrados hechos sin señal se encolan y se envían cuando vuelve la conexión.
 * - Caché de reseñas remotas por lugar y de un índice de valoraciones (avg/count) por lugar.
 * - Caché de lugares aprobados (place_suggestions.status = 'approved') → setCommunityPlaces().
 *
 * Si Supabase no está configurado (isConfigured() === false) todo funciona solo en local:
 * las contribuciones quedan en la bandeja y nunca se lanza un error.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { PROVINCE_CENTER, setCommunityPlaces, TOWNS } from '@/data/places';
import type { Category, Coords, District, Lang, Place, Review } from '@/data/types';
import { getDeviceId, getPhotoFolderId, uuid } from './device';
import { distanceM } from './geo';
import { getSupabase, isConfigured, REVIEW_PHOTOS_BUCKET } from './supabase';

export { isConfigured } from './supabase';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type ReviewInput = {
  placeId: string;
  author: string;
  country: string;
  visitedAt: string; // YYYY-MM
  rating: number; // 1..5
  text: string; // 20..600
  tip?: string; // <= 200
  lang: Lang;
  /** URIs locales (expo-image-picker), máx. 3 */
  photos: string[];
};

export type SuggestionInput = {
  name: string;
  category: Category;
  district: District;
  lat?: number | null;
  lon?: number | null;
  description: string;
  howToGet?: string;
  tips?: string;
  lang: Lang;
  /** URIs locales, máx. 3 */
  photos: string[];
};

export type RatingStat = { avg: number; count: number };
export type OutboxKind = 'review' | 'suggestion' | 'report' | 'deleteReview';

export type OutboxItem = {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  localPhotoUris?: string[];
  /** URLs públicas ya subidas (para no re-subir en reintentos) */
  uploadedPhotos?: string[];
  /** cuántas fotos locales ya se procesaron (subidas u omitidas) */
  photoIndex?: number;
  tries: number;
  nextAt: number;
  createdAt: number;
  lastError?: string;
};

// ---------------------------------------------------------------------------
// Estado en memoria + suscripción (useSyncExternalStore)
// ---------------------------------------------------------------------------

type Sum = { sum: number; count: number };

type State = {
  outbox: OutboxItem[];
  /** reseñas remotas cacheadas por lugar (sin flag mine) */
  reviews: Record<string, Review[]>;
  fetchedAt: Record<string, number>;
  /** índice remoto de valoraciones por lugar */
  ratings: Record<string, Sum>;
  /** mis reseñas (pendientes y enviadas) */
  mine: Review[];
  /** ids ocultos localmente (reportados o borrados por mí) */
  hidden: string[];
  places: Place[];
  online: boolean;
};

let state: State = {
  outbox: [],
  reviews: {},
  fetchedAt: {},
  ratings: {},
  mine: [],
  hidden: [],
  places: [],
  online: true,
};

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const getSnapshot = () => state;
function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
const useStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

const P = 'nan-urubamba/community';
const K = {
  outbox: `${P}/outbox/v1`,
  ratings: `${P}/ratings/v1`,
  mine: `${P}/mine/v1`,
  hidden: `${P}/hidden/v1`,
  places: `${P}/places/v1`,
  reviews: (placeId: string) => `${P}/reviews/v1/${placeId}`,
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}
const saveOutbox = () => writeJSON(K.outbox, state.outbox);
const saveMine = () => writeJSON(K.mine, state.mine);
const saveHidden = () => writeJSON(K.hidden, state.hidden);
const saveRatings = () => writeJSON(K.ratings, state.ratings);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_RE.test(s);
const clip = (s: string | undefined | null, n: number) => (s ?? '').trim().slice(0, n);
const round1 = (n: number) => Math.round(n * 10) / 10;
const toStat = (s: Sum | undefined): RatingStat => (s && s.count > 0 ? { avg: round1(s.sum / s.count), count: s.count } : { avg: 0, count: 0 });

const REVIEW_COLUMNS = 'id, place_id, author, country, visited_at, rating, text, tip, lang, photos, created_at';
const SUGGESTION_COLUMNS = 'id, name, category, district, lat, lon, description, how_to_get, tips, lang, photos, created_at';

type ReviewRow = {
  id: string;
  place_id: string;
  author: string;
  country: string | null;
  visited_at: string | null;
  rating: number;
  text: string;
  tip: string | null;
  lang: string;
  photos: string[] | null;
  created_at: string;
};

type SuggestionRow = {
  id: string;
  name: string;
  category: string;
  district: string;
  lat: number | null;
  lon: number | null;
  description: string;
  how_to_get: string | null;
  tips: string | null;
  lang: string;
  photos: string[] | null;
  created_at: string;
};

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    placeId: r.place_id,
    author: r.author,
    country: r.country ?? '',
    visitedAt: r.visited_at ?? '',
    createdAt: r.created_at,
    rating: r.rating,
    text: r.text,
    tip: r.tip ?? undefined,
    lang: r.lang === 'en' ? 'en' : 'es',
    photos: r.photos ?? [],
  };
}

function sumOf(list: Review[]): Sum {
  return { sum: list.reduce((a, r) => a + r.rating, 0), count: list.length };
}

type ErrLike = { code?: string; message?: string; status?: number; statusCode?: string } | null | undefined;

/** 'duplicate' = ya existe en el servidor (éxito); 'permanent' = nunca va a funcionar; 'transient' = reintentar */
function classify(err: ErrLike): 'duplicate' | 'permanent' | 'transient' {
  const code = err?.code ?? '';
  if (code === '23505') return 'duplicate';
  // 22xxx datos inválidos, 23xxx violación de restricción, 42501 RLS
  if (/^2[23]/.test(code) || code === '42501') return 'permanent';
  return 'transient';
}

class SyncError extends Error {
  constructor(
    message: string,
    public kind: 'duplicate' | 'permanent' | 'transient',
  ) {
    super(message);
  }
}
function check(err: ErrLike) {
  if (!err) return;
  throw new SyncError(err.message ?? String(err.code ?? 'error'), classify(err));
}

// ---------------------------------------------------------------------------
// Fotos locales
// ---------------------------------------------------------------------------

const PHOTO_DIR = 'outbox-photos';

/** Copia la foto elegida a documentos (la caché del picker puede borrarse antes de sincronizar). */
async function persistLocalPhoto(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, PHOTO_DIR);
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const dest = new File(dir, `${uuid()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

function deleteLocalPhoto(uri: string) {
  if (Platform.OS === 'web' || !uri.includes(PHOTO_DIR)) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignorar
  }
}

/** Devuelve null si el archivo ya no existe (se omite la foto). */
async function readBytes(uri: string): Promise<ArrayBuffer | null> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      return await res.arrayBuffer();
    }
    const f = new File(uri);
    if (!f.exists) return null;
    return await f.arrayBuffer();
  } catch {
    return null;
  }
}

/** Sube una foto; devuelve la URL pública, null si la foto debe omitirse, o lanza SyncError transitorio. */
async function uploadPhoto(uri: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) throw new SyncError('not configured', 'transient');
  const bytes = await readBytes(uri);
  if (!bytes || bytes.byteLength === 0) return null;
  const folder = await getPhotoFolderId();
  const path = `${folder}/${uuid()}.jpg`;
  const { error } = await sb.storage.from(REVIEW_PHOTOS_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    const e = error as ErrLike;
    const status = e?.status ?? Number(e?.statusCode ?? 0);
    // 413 demasiado grande, 415 tipo no permitido, 400 inválido → omitir esta foto
    if (status === 400 || status === 413 || status === 415) return null;
    throw new SyncError(error.message, 'transient');
  }
  return sb.storage.from(REVIEW_PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

const BASE_DELAY = 5_000;
const MAX_DELAY = 30 * 60_000;

function updateItem(id: string, patch: Partial<OutboxItem>) {
  setState((s) => ({ outbox: s.outbox.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  saveOutbox();
}
function removeItem(id: string) {
  setState((s) => ({ outbox: s.outbox.filter((i) => i.id !== id) }));
  saveOutbox();
}
function addItem(item: Omit<OutboxItem, 'tries' | 'nextAt' | 'createdAt'>) {
  const full: OutboxItem = { ...item, tries: 0, nextAt: 0, createdAt: Date.now() };
  setState((s) => ({ outbox: [...s.outbox, full] }));
  saveOutbox();
  void flushOutbox();
}

async function uploadPendingPhotos(item: OutboxItem): Promise<string[]> {
  const local = item.localPhotoUris ?? [];
  let uploaded = item.uploadedPhotos ?? [];
  let idx = item.photoIndex ?? 0;
  while (idx < local.length) {
    const url = await uploadPhoto(local[idx]);
    if (url) uploaded = [...uploaded, url];
    idx += 1;
    updateItem(item.id, { uploadedPhotos: uploaded, photoIndex: idx });
  }
  return uploaded.slice(0, 3);
}

async function processItem(item: OutboxItem) {
  const sb = getSupabase();
  if (!sb) throw new SyncError('not configured', 'transient');
  const device = await getDeviceId();

  switch (item.kind) {
    case 'review': {
      const photos = await uploadPendingPhotos(item);
      const { error } = await sb.from('reviews').insert({ ...item.payload, photos, device_id: device });
      if (error && classify(error) !== 'duplicate') check(error);
      onReviewSynced(String(item.payload.id), String(item.payload.place_id), Number(item.payload.rating), photos);
      break;
    }
    case 'suggestion': {
      const photos = await uploadPendingPhotos(item);
      const { error } = await sb.from('place_suggestions').insert({ ...item.payload, photos, device_id: device, status: 'pending' });
      if (error && classify(error) !== 'duplicate') check(error);
      break;
    }
    case 'report': {
      const { error } = await sb.from('reports').insert({ ...item.payload, device_id: device });
      // 23505 = ya reportada por este dispositivo; 23503 = la reseña ya no existe
      if (error && classify(error) !== 'duplicate') check(error);
      break;
    }
    case 'deleteReview': {
      const { error } = await sb.rpc('delete_my_review', { review_id: item.payload.review_id, device });
      check(error);
      break;
    }
  }
  (item.localPhotoUris ?? []).forEach(deleteLocalPhoto);
}

function onReviewSynced(id: string, placeId: string, rating: number, photos: string[]) {
  setState((s) => {
    const cur = s.ratings[placeId] ?? { sum: 0, count: 0 };
    return {
      mine: s.mine.map((r) => (r.id === id ? { ...r, photos } : r)),
      // optimista: el índice remoto ya incluye esta reseña hasta el próximo prefetch
      ratings: { ...s.ratings, [placeId]: { sum: cur.sum + rating, count: cur.count + 1 } },
    };
  });
  saveMine();
  saveRatings();
}

let flushing: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  if (!state.outbox.length || !isConfigured()) return;
  const next = Math.min(...state.outbox.map((i) => i.nextAt));
  retryTimer = setTimeout(() => void flushOutbox(), Math.max(1_000, next - Date.now()));
}

/** Envía todo lo pendiente (si hay conexión y Supabase configurado). Nunca lanza. */
export function flushOutbox(): Promise<void> {
  if (flushing) return flushing;
  if (!isConfigured() || !state.outbox.length) return Promise.resolve();
  flushing = (async () => {
    try {
      const net = await NetInfo.fetch().catch(() => null);
      if (net && (net.isConnected === false || net.isInternetReachable === false)) return;
      const queue = [...state.outbox].sort((a, b) => a.createdAt - b.createdAt);
      for (const item of queue) {
        const current = state.outbox.find((i) => i.id === item.id);
        if (!current || current.nextAt > Date.now()) continue;
        try {
          await processItem(current);
          const cancelled = !state.outbox.some((i) => i.id === current.id);
          removeItem(current.id);
          // el usuario borró la reseña mientras se estaba enviando: borrarla también en el servidor
          if (cancelled && current.kind === 'review') {
            addItem({ id: uuid(), kind: 'deleteReview', payload: { review_id: current.payload.id } });
          }
        } catch (e) {
          const kind = e instanceof SyncError ? e.kind : 'transient';
          if (kind === 'permanent') {
            (current.localPhotoUris ?? []).forEach(deleteLocalPhoto);
            removeItem(current.id);
            continue;
          }
          const tries = current.tries + 1;
          const delay = Math.min(MAX_DELAY, BASE_DELAY * 2 ** Math.min(tries, 12)) * (0.8 + Math.random() * 0.4);
          updateItem(current.id, { tries, nextAt: Date.now() + delay, lastError: e instanceof Error ? e.message : String(e) });
          // si falla la red probablemente fallará todo: cortar y reintentar luego
          break;
        }
      }
    } finally {
      flushing = null;
      scheduleRetry();
    }
  })();
  return flushing;
}

// ---------------------------------------------------------------------------
// Acciones (optimistas)
// ---------------------------------------------------------------------------

/** Encola una reseña y la devuelve de inmediato (mine: true, fotos locales hasta sincronizar). */
export async function submitReview(input: ReviewInput): Promise<Review> {
  const id = uuid();
  const localPhotos = await Promise.all(input.photos.slice(0, 3).map(persistLocalPhoto));
  const text = clip(input.text, 600);
  if (text.length < 20) throw new Error('review text must be at least 20 characters');
  const lang: Lang = input.lang === 'en' ? 'en' : 'es';
  const author = clip(input.author, 60) || (lang === 'es' ? 'Viajero' : 'Traveller');
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const visitedAt = /^\d{4}-(0[1-9]|1[0-2])$/.test(input.visitedAt) ? input.visitedAt : null;
  const tip = clip(input.tip, 200) || null;
  const country = clip(input.country, 60) || null;

  const review: Review = {
    id,
    placeId: input.placeId,
    author,
    country: country ?? '',
    visitedAt: visitedAt ?? '',
    createdAt: new Date().toISOString(),
    rating,
    text,
    tip: tip ?? undefined,
    lang,
    photos: localPhotos,
    mine: true,
  };
  setState((s) => ({ mine: [review, ...s.mine] }));
  saveMine();
  addItem({
    id: uuid(),
    kind: 'review',
    payload: { id, place_id: input.placeId, author, country, visited_at: visitedAt, rating, text, tip, lang },
    localPhotoUris: localPhotos,
  });
  return review;
}

/** Encola la sugerencia de un lugar (queda 'pending' hasta que un admin la apruebe). */
export async function submitSuggestion(input: SuggestionInput): Promise<void> {
  const localPhotos = await Promise.all(input.photos.slice(0, 3).map(persistLocalPhoto));
  const okNum = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n : null);
  addItem({
    id: uuid(),
    kind: 'suggestion',
    payload: {
      name: clip(input.name, 80),
      category: input.category,
      district: input.district,
      lat: okNum(input.lat),
      lon: okNum(input.lon),
      description: clip(input.description, 1500),
      how_to_get: clip(input.howToGet, 1000) || null,
      tips: clip(input.tips, 600) || null,
      lang: input.lang === 'en' ? 'en' : 'es',
    },
    localPhotoUris: localPhotos,
  });
}

/** Reporta una reseña (se oculta para mí al instante; en el servidor se oculta con 3 reportes). */
export async function reportReview(id: string, reason: string): Promise<void> {
  if (!state.hidden.includes(id)) {
    setState((s) => ({ hidden: [...s.hidden, id] }));
    saveHidden();
  }
  if (!isUuid(id) || state.mine.some((r) => r.id === id)) return; // reseña local/semilla o mía
  addItem({ id: uuid(), kind: 'report', payload: { review_id: id, reason: clip(reason, 300) || null } });
}

/** Borra una reseña mía: si aún no se envió, se cancela; si ya se envió, se encola el borrado. */
export async function deleteMyReview(id: string): Promise<void> {
  const pending = state.outbox.find((i) => i.kind === 'review' && i.payload.id === id);
  const mineReview = state.mine.find((r) => r.id === id);
  setState((s) => ({ mine: s.mine.filter((r) => r.id !== id) }));
  saveMine();
  if (pending) {
    (pending.localPhotoUris ?? []).forEach(deleteLocalPhoto);
    removeItem(pending.id);
    return;
  }
  if (!isUuid(id)) return;
  // quitar de cachés e índice
  const placeId = mineReview?.placeId ?? Object.keys(state.reviews).find((p) => state.reviews[p].some((r) => r.id === id));
  if (placeId) {
    const cached = state.reviews[placeId] ?? [];
    const rating = mineReview?.rating ?? cached.find((r) => r.id === id)?.rating;
    const nextList = cached.filter((r) => r.id !== id);
    setState((s) => {
      const cur = s.ratings[placeId];
      const ratings =
        cur && rating != null ? { ...s.ratings, [placeId]: { sum: Math.max(0, cur.sum - rating), count: Math.max(0, cur.count - 1) } } : s.ratings;
      return { reviews: { ...s.reviews, [placeId]: nextList }, ratings };
    });
    writeJSON(K.reviews(placeId), nextList);
    saveRatings();
  }
  if (!state.hidden.includes(id)) {
    setState((s) => ({ hidden: [...s.hidden, id] }));
    saveHidden();
  }
  addItem({ id: uuid(), kind: 'deleteReview', payload: { review_id: id } });
}

// ---------------------------------------------------------------------------
// Reseñas remotas
// ---------------------------------------------------------------------------

function mergedReviews(s: State, placeId: string): Review[] {
  const hidden = new Set(s.hidden);
  const mine = s.mine.filter((r) => r.placeId === placeId);
  const mineIds = new Set(mine.map((r) => r.id));
  const remote = (s.reviews[placeId] ?? []).filter((r) => !mineIds.has(r.id) && !hidden.has(r.id));
  return [...mine.map((r) => ({ ...r, mine: true })), ...remote].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const loadedPlaces = new Set<string>();

/** Reseñas cacheadas (mías + remotas) de un lugar, sin red. */
export async function getCachedReviews(placeId: string): Promise<Review[]> {
  if (!loadedPlaces.has(placeId)) {
    loadedPlaces.add(placeId);
    const cached = await readJSON<Review[]>(K.reviews(placeId), []);
    if (!state.reviews[placeId]) setState((s) => ({ reviews: { ...s.reviews, [placeId]: cached } }));
  }
  return mergedReviews(state, placeId);
}

const PAGE = 100;

/** Descarga las reseñas publicadas de un lugar (más nuevas primero, máx. 100) y las cachea. Nunca lanza. */
export async function fetchReviews(placeId: string): Promise<Review[]> {
  await getCachedReviews(placeId);
  const sb = getSupabase();
  if (!sb) return mergedReviews(state, placeId);
  try {
    const { data, error } = await sb
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .eq('place_id', placeId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (error || !data) return mergedReviews(state, placeId);
    const list = (data as ReviewRow[]).map(rowToReview);
    setState((s) => {
      const patch: Partial<State> = {
        reviews: { ...s.reviews, [placeId]: list },
        fetchedAt: { ...s.fetchedAt, [placeId]: Date.now() },
      };
      // lista completa → el índice de ese lugar puede recalcularse exacto
      if (list.length < PAGE) {
        const hidden = new Set(s.hidden);
        patch.ratings = { ...s.ratings, [placeId]: sumOf(list.filter((r) => !hidden.has(r.id))) };
      }
      return patch;
    });
    writeJSON(K.reviews(placeId), list);
    saveRatings();
  } catch {
    // sin red: se queda la caché
  }
  return mergedReviews(state, placeId);
}

let lastPrefetch = 0;

/** Descarga (place_id, rating) de todas las reseñas publicadas y calcula avg/count por lugar. Nunca lanza. */
export async function prefetchAllReviews(): Promise<Record<string, RatingStat>> {
  const sb = getSupabase();
  if (sb) {
    try {
      const sums: Record<string, Sum> = {};
      const size = 1000;
      let complete = false;
      for (let page = 0; page < 50; page++) {
        const { data, error } = await sb
          .from('reviews')
          .select('id, place_id, rating')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(page * size, page * size + size - 1);
        if (error || !data) break;
        const hidden = new Set(state.hidden);
        for (const r of data as { id: string; place_id: string; rating: number }[]) {
          if (hidden.has(r.id)) continue;
          const cur = (sums[r.place_id] ??= { sum: 0, count: 0 });
          cur.sum += r.rating;
          cur.count += 1;
        }
        if (data.length < size) {
          complete = true;
          break;
        }
      }
      if (complete) {
        lastPrefetch = Date.now();
        setState({ ratings: sums });
        saveRatings();
      }
    } catch {
      // sin red
    }
  }
  return ratingsIndexOf(state);
}

function ratingsIndexOf(s: State): Record<string, RatingStat> {
  const sums: Record<string, Sum> = {};
  for (const [k, v] of Object.entries(s.ratings)) sums[k] = { ...v };
  // reseñas aún no enviadas cuentan de forma optimista
  for (const item of s.outbox) {
    if (item.kind !== 'review') continue;
    const placeId = String(item.payload.place_id);
    const cur = (sums[placeId] ??= { sum: 0, count: 0 });
    cur.sum += Number(item.payload.rating) || 0;
    cur.count += 1;
  }
  const out: Record<string, RatingStat> = {};
  for (const [k, v] of Object.entries(sums)) if (v.count > 0) out[k] = toStat(v);
  return out;
}

/**
 * Combina la valoración base del lugar (Place.rating/ratingCount) con la de la comunidad.
 * Útil para reemplazar ratingFor() del store.
 */
export function combineRating(base: { rating: number; ratingCount: number }, community?: RatingStat): { rating: number; count: number } {
  if (!community || !community.count) return { rating: base.rating, count: base.ratingCount };
  const count = base.ratingCount + community.count;
  return { rating: round1((base.rating * base.ratingCount + community.avg * community.count) / count), count };
}

// ---------------------------------------------------------------------------
// Lugares aprobados por la comunidad
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = ['paisajes', 'lagunas', 'arqueologia', 'cataratas', 'miradores', 'nevados', 'aventura', 'cultura'];
const DISTRICTS: District[] = ['Ollantaytambo', 'Urubamba', 'Chinchero', 'Maras', 'Huayllabamba', 'Yucay', 'Machupicchu'];

function nearestTown(c: Coords): { name: string; coords: Coords } {
  let best = { name: 'Urubamba', coords: TOWNS.Urubamba ?? PROVINCE_CENTER };
  let bestD = Infinity;
  for (const [name, coords] of Object.entries(TOWNS)) {
    const d = distanceM(c, coords);
    if (d < bestD) {
      bestD = d;
      best = { name: name === 'Machupicchu' ? 'Machupicchu Pueblo' : name, coords };
    }
  }
  return best;
}

function rowToPlace(r: SuggestionRow): Place {
  const district: District = (DISTRICTS as string[]).includes(r.district) ? (r.district as District) : 'Urubamba';
  const category: Category = (CATEGORIES as string[]).includes(r.category) ? (r.category as Category) : 'paisajes';
  const hasCoords = typeof r.lat === 'number' && typeof r.lon === 'number';
  const coords: Coords = hasCoords ? { latitude: r.lat as number, longitude: r.lon as number } : (TOWNS[district] ?? PROVINCE_CENTER);
  const origin = nearestTown(coords);
  const same = (s: string) => ({ es: s, en: s });
  const desc = r.description.trim();
  const summary = desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc;
  const how = (r.how_to_get ?? '').trim();
  return {
    id: `comunidad-${r.id}`,
    name: r.name.trim(),
    categories: [category],
    district,
    coords,
    origin,
    difficulty: 'moderada',
    durationHours: 3,
    durationNote: { es: 'Estimado (aporte de la comunidad)', en: 'Estimate (community contribution)' },
    altitude: 0,
    bestSeason: { es: 'Mayo a septiembre (temporada seca)', en: 'May to September (dry season)' },
    summary: same(summary),
    description: same(desc),
    route: [
      {
        mode: 'walk',
        title: { es: `Desde ${origin.name}`, en: `From ${origin.name}` },
        detail: same(how || (r.lang === 'en' ? 'Ask locally for directions.' : 'Pregunta en el pueblo cómo llegar.')),
        time: '—',
      },
    ],
    routeKm: Math.round(distanceM(origin.coords, coords) / 100) / 10,
    cares: ['agua', 'sol'],
    extraCare: r.tips?.trim() ? same(r.tips.trim()) : undefined,
    signal: 'desconocida',
    publicTransport: false,
    rating: 0,
    ratingCount: 0,
    photos: r.photos ?? [],
    source: 'comunidad',
    kind: 'place',
    estimated: true,
  };
}

function applyPlaces(list: Place[]) {
  setCommunityPlaces(list);
  setState({ places: list });
}

/** Descarga los lugares aprobados, los registra con setCommunityPlaces y los cachea. Nunca lanza. */
export async function fetchApprovedPlaces(): Promise<Place[]> {
  const sb = getSupabase();
  if (!sb) return state.places;
  try {
    const { data, error } = await sb
      .from('place_suggestions')
      .select(SUGGESTION_COLUMNS)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(500);
    if (error || !data) return state.places;
    const list = (data as SuggestionRow[]).map(rowToPlace);
    applyPlaces(list);
    writeJSON(K.places, list);
  } catch {
    // sin red
  }
  return state.places;
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

let initPromise: Promise<void> | null = null;

function refreshRemote() {
  void flushOutbox();
  if (!isConfigured()) return;
  if (Date.now() - lastPrefetch > 10 * 60_000) {
    void prefetchAllReviews();
    void fetchApprovedPlaces();
  }
}

/** Llamar una vez al iniciar la app: carga cachés, envía la bandeja y escucha la conectividad. */
export function initCommunity(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const [outbox, ratings, mine, hidden, places] = await Promise.all([
      readJSON<OutboxItem[]>(K.outbox, []),
      readJSON<Record<string, Sum>>(K.ratings, {}),
      readJSON<Review[]>(K.mine, []),
      readJSON<string[]>(K.hidden, []),
      readJSON<Place[]>(K.places, []),
    ]);
    // los reintentos programados de una sesión anterior se pueden intentar ya
    setState({ outbox: outbox.map((i) => ({ ...i, nextAt: 0 })), ratings, mine, hidden });
    if (places.length) applyPlaces(places);
    await getDeviceId();

    NetInfo.addEventListener((net) => {
      const online = net.isConnected !== false && net.isInternetReachable !== false;
      const was = state.online;
      if (online !== was) setState({ online });
      if (online && !was) {
        // volvió la señal: reintentar todo ya
        setState((s) => ({ outbox: s.outbox.map((i) => ({ ...i, nextAt: 0 })) }));
        lastPrefetch = 0;
        refreshRemote();
      }
    });
    AppState.addEventListener('change', (st) => {
      if (st === 'active') refreshRemote();
    });
    refreshRemote();
  })().catch(() => {});
  return initPromise;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Número de contribuciones pendientes de envío. */
export function useOutboxCount(): number {
  return useStore().outbox.length;
}

/** true si NetInfo reporta conexión. */
export function useIsOnline(): boolean {
  return useStore().online;
}

/** Valoración comunitaria por lugar (remota cacheada + pendientes). */
export function useRatingsIndex(): Record<string, RatingStat> {
  const s = useStore();
  return useMemo(() => ratingsIndexOf({ ...state, ratings: s.ratings, outbox: s.outbox }), [s.ratings, s.outbox]);
}

/** Mis reseñas comunitarias (pendientes y enviadas), más nuevas primero. */
export function useMyCommunityReviews(): Review[] {
  const mine = useStore().mine;
  return useMemo(() => mine.map((r) => ({ ...r, mine: true })), [mine]);
}

/** Lugares aprobados de la comunidad (re-renderiza cuando llegan del servidor). */
export function useCommunityPlaces(): Place[] {
  return useStore().places;
}

/** Reseñas comunitarias de un lugar; funciona offline desde la caché. */
export function useCommunityReviews(placeId: string | undefined): {
  reviews: Review[];
  loading: boolean;
  refresh: () => Promise<void>;
  stats: RatingStat;
} {
  const s = useStore();
  const [loading, setLoading] = useState(false);
  const pid = placeId ?? '';

  const refresh = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      await fetchReviews(pid);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    if (!pid) return;
    let alive = true;
    (async () => {
      await getCachedReviews(pid);
      const stale = Date.now() - (state.fetchedAt[pid] ?? 0) > 60_000;
      if (!alive || !stale || !isConfigured()) return;
      setLoading(true);
      try {
        await fetchReviews(pid);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pid]);

  const reviews = useMemo(
    () => (pid ? mergedReviews({ ...state, mine: s.mine, reviews: s.reviews, hidden: s.hidden }, pid) : []),
    [pid, s.mine, s.reviews, s.hidden],
  );
  const index = useMemo(() => ratingsIndexOf({ ...state, ratings: s.ratings, outbox: s.outbox }), [s.ratings, s.outbox]);
  const stats = useMemo<RatingStat>(() => {
    const fromIndex = index[pid];
    if (fromIndex) return fromIndex;
    return toStat(sumOf(reviews));
  }, [index, pid, reviews]);

  return { reviews, loading, refresh, stats };
}
