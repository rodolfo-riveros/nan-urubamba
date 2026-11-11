/**
 * Mapas sin conexión: descarga de teselas (tiles) raster a disco para que el
 * mapa siga funcionando en senderos sin señal.
 *
 * Teselas en: Paths.document/tiles/{z}/{x}/{y}.png
 * Metadatos:  Paths.document/tiles/zones.json
 *
 * El conjunto de teselas de una zona es una función determinista de su bbox y
 * zooms, así que no hace falta guardar la lista de teselas por zona: al borrar
 * una zona se recalcula y solo se eliminan las teselas que ninguna otra zona
 * guardada cubre.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useSyncExternalStore } from 'react';
import type { Coords, Place } from '@/data/types';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export const TILE_URL_TEMPLATE: string =
  process.env.EXPO_PUBLIC_OFFLINE_TILE_URL || 'https://tile.opentopomap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION = '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)';

const USER_AGENT = 'NanUrubamba/1.0';
export const BYTES_PER_TILE = 25 * 1024;
export const MAX_TILES_PER_ZONE = 4000;
// 2 descargas simultáneas para respetar la política de uso del servidor de teselas
const CONCURRENCY = 2;
const PLACE_PADDING_KM = 1.5;
const PLACE_MIN_ZOOM = 11;
const PLACE_MAX_ZOOM = 16;
/** Si una zona de lugar excede el límite, se baja el zoom máximo hasta este valor. */
const PLACE_MAX_ZOOM_FLOOR = 13;

export const PROVINCE_ZONE_ID = 'province';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type BBox = { south: number; west: number; north: number; east: number };

export type Zone = BBox & {
  name?: string;
  minZoom: number;
  maxZoom: number;
};

export type ZoneMeta = {
  id: string;
  name: string;
  bbox: BBox;
  minZoom: number;
  maxZoom: number;
  /** Teselas que cubre la zona */
  tiles: number;
  /** Bytes en disco de las teselas de la zona (incluye las compartidas con otras zonas) */
  bytes: number;
  /** ISO date de la última descarga */
  date: string;
  /** false si algunas teselas fallaron; volver a descargar completa las faltantes */
  complete: boolean;
  missing: number;
};

export type DownloadProgress = {
  /** Teselas procesadas (descargadas + ya existentes + fallidas) */
  done: number;
  total: number;
  /** 0..1 */
  progress: number;
  failed: number;
};

export type DownloadStatus = 'done' | 'partial' | 'cancelled' | 'too_large' | 'error';

export type DownloadResult = {
  status: DownloadStatus;
  downloaded: number;
  skipped: number;
  failed: number;
  total: number;
  error?: string;
};

export type DownloadHandle = {
  cancel: () => void;
  /** Se resuelve siempre (nunca rechaza) */
  done: Promise<DownloadResult>;
};

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

function safeTilesDir(): Directory | null {
  try {
    return new Directory(Paths.document, 'tiles');
  } catch {
    return null; // web u otra plataforma sin sistema de archivos
  }
}

const TILES_DIR = safeTilesDir();

function stripTrailingSlash(s: string) {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function uriToPath(uri: string) {
  const noScheme = uri.replace(/^file:\/\//, '');
  try {
    return decodeURIComponent(noScheme);
  } catch {
    return noScheme;
  }
}

/**
 * Plantilla de ruta para <LocalTile pathTemplate>. react-native-maps lee la
 * tesela con FileInputStream (Android) y NSFileManager fileExistsAtPath (iOS),
 * así que necesita una ruta de sistema de archivos SIN el esquema file://.
 */
export const TILES_PATH_TEMPLATE: string = TILES_DIR
  ? `${stripTrailingSlash(uriToPath(TILES_DIR.uri))}/{z}/{x}/{y}.png`
  : '';

/**
 * Misma plantilla como URL file:// (para <UrlTile>, usado como alternativa en
 * iOS + Google Maps, donde LocalTile no tiene implementación nativa).
 */
export const TILES_URL_TEMPLATE: string = TILES_DIR ? `${stripTrailingSlash(TILES_DIR.uri)}/{z}/{x}/{y}.png` : '';

// ---------------------------------------------------------------------------
// Geometría (fórmula slippy map de OSM)
// ---------------------------------------------------------------------------

export function lonToTileX(lon: number, z: number): number {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  return Math.min(n - 1, Math.max(0, x));
}

export function latToTileY(lat: number, z: number): number {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return Math.min(n - 1, Math.max(0, y));
}

export function lonLatToTile(lon: number, lat: number, z: number): { x: number; y: number } {
  return { x: lonToTileX(lon, z), y: latToTileY(lat, z) };
}

type TileRange = { z: number; minX: number; maxX: number; minY: number; maxY: number };

function tileRanges(zone: Zone): TileRange[] {
  const out: TileRange[] = [];
  for (let z = zone.minZoom; z <= zone.maxZoom; z++) {
    out.push({
      z,
      minX: lonToTileX(zone.west, z),
      maxX: lonToTileX(zone.east, z),
      minY: latToTileY(zone.north, z), // y crece hacia el sur
      maxY: latToTileY(zone.south, z),
    });
  }
  return out;
}

export function estimateTiles(zone: Zone): number {
  return tileRanges(zone).reduce((acc, r) => acc + (r.maxX - r.minX + 1) * (r.maxY - r.minY + 1), 0);
}

export function estimateBytes(zone: Zone): number {
  return estimateTiles(zone) * BYTES_PER_TILE;
}

function* iterateTiles(zone: Zone): Generator<{ z: number; x: number; y: number }> {
  for (const r of tileRanges(zone)) {
    for (let x = r.minX; x <= r.maxX; x++) {
      for (let y = r.minY; y <= r.maxY; y++) yield { z: r.z, x, y };
    }
  }
}

function zoneCoversTile(zone: Zone, z: number, x: number, y: number) {
  if (z < zone.minZoom || z > zone.maxZoom) return false;
  return (
    x >= lonToTileX(zone.west, z) &&
    x <= lonToTileX(zone.east, z) &&
    y >= latToTileY(zone.north, z) &&
    y <= latToTileY(zone.south, z)
  );
}

function metaToZone(m: ZoneMeta): Zone {
  return { ...m.bbox, name: m.name, minZoom: m.minZoom, maxZoom: m.maxZoom };
}

// ---------------------------------------------------------------------------
// Zonas predefinidas
// ---------------------------------------------------------------------------

export const PROVINCE_ZONE: Zone = {
  name: 'Provincia de Urubamba',
  south: -13.45,
  north: -13.1,
  west: -72.6,
  east: -71.98,
  minZoom: 9,
  maxZoom: 12,
};

export const placeZoneId = (placeId: string) => `place:${placeId}`;

function bboxAround(points: Coords[], padKm: number): BBox {
  let south = Infinity;
  let north = -Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const p of points) {
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
  }
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  const dLat = padKm / 111.32;
  const dLon = padKm / (111.32 * Math.max(0.01, Math.cos(midLat)));
  return { south: south - dLat, north: north + dLat, west: west - dLon, east: east + dLon };
}

/**
 * Zona que cubre el lugar y su punto de partida (+1.5 km), zooms 11..16.
 * Si el recorrido es tan largo que excede MAX_TILES_PER_ZONE, se reduce el
 * zoom máximo (mín. 13) para que entre en el límite.
 */
export function zoneForPlace(place: Pick<Place, 'name' | 'coords' | 'origin'>): Zone {
  const points = [place.coords];
  if (place.origin?.coords) points.push(place.origin.coords);
  const zone: Zone = {
    ...bboxAround(points, PLACE_PADDING_KM),
    name: place.name,
    minZoom: PLACE_MIN_ZOOM,
    maxZoom: PLACE_MAX_ZOOM,
  };
  while (zone.maxZoom > PLACE_MAX_ZOOM_FLOOR && estimateTiles(zone) > MAX_TILES_PER_ZONE) zone.maxZoom--;
  return zone;
}

// ---------------------------------------------------------------------------
// Estado en memoria + suscripciones (para hooks)
// ---------------------------------------------------------------------------

type ActiveDownload = { zoneId: string; progress: number; done: number; total: number };

type State = {
  loaded: boolean;
  zones: ZoneMeta[];
  totalBytes: number;
  active: Record<string, ActiveDownload>;
};

let state: State = { loaded: false, zones: [], totalBytes: 0, active: {} };
const listeners = new Set<() => void>();
const handles = new Map<string, DownloadHandle>();
/** Zonas con descarga en curso (sus teselas no deben borrarse aunque aún no estén guardadas). */
const activeZones = new Map<string, Zone>();
const activeZonesExcept = (id: string) => [...activeZones].filter(([k]) => k !== id).map(([, z]) => z);

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const getSnapshot = () => state;

// ---------------------------------------------------------------------------
// Persistencia de metadatos
// ---------------------------------------------------------------------------

function ensureDir(dir: Directory) {
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
}

function zonesFile(): File | null {
  return TILES_DIR ? new File(TILES_DIR, 'zones.json') : null;
}

let loading: Promise<ZoneMeta[]> | null = null;

async function loadZones(): Promise<ZoneMeta[]> {
  if (state.loaded) return state.zones;
  if (!loading) {
    loading = (async () => {
      let zones: ZoneMeta[] = [];
      try {
        const f = zonesFile();
        if (f?.exists) {
          const parsed = JSON.parse(await f.text());
          if (Array.isArray(parsed)) zones = parsed as ZoneMeta[];
        }
      } catch {
        zones = [];
      }
      setState({ loaded: true, zones, totalBytes: computeTotalBytes(zones) });
      return zones;
    })();
  }
  return loading;
}

async function saveZones(zones: ZoneMeta[]) {
  setState({ zones, totalBytes: computeTotalBytes(zones) });
  if (!TILES_DIR) return;
  ensureDir(TILES_DIR);
  const f = new File(TILES_DIR, 'zones.json');
  await f.write(JSON.stringify(zones));
}

function computeTotalBytes(zones: ZoneMeta[]): number {
  if (zones.length === 0) return 0;
  try {
    if (TILES_DIR?.exists) {
      const s = TILES_DIR.size;
      if (typeof s === 'number' && s > 0) return s;
    }
  } catch {
    // ignora y usa la suma
  }
  return zones.reduce((acc, z) => acc + (z.bytes || 0), 0);
}

// ---------------------------------------------------------------------------
// API pública de zonas
// ---------------------------------------------------------------------------

export async function listZones(): Promise<ZoneMeta[]> {
  return loadZones();
}

export async function isZoneDownloaded(id: string): Promise<boolean> {
  const zones = await loadZones();
  return zones.some((z) => z.id === id && z.complete);
}

/** Bytes usados por las teselas en disco. */
export async function totalBytes(): Promise<number> {
  const zones = await loadZones();
  return computeTotalBytes(zones);
}

/** Borra la zona y las teselas que ninguna otra zona guardada usa. */
export async function deleteZone(id: string): Promise<void> {
  handles.get(id)?.cancel();
  const zones = await loadZones();
  const target = zones.find((z) => z.id === id);
  const rest = zones.filter((z) => z.id !== id);
  if (!target || !TILES_DIR) {
    await saveZones(rest);
    return;
  }
  const otherDownloadsActive = [...handles.keys()].some((k) => k !== id);
  if (rest.length === 0 && !otherDownloadsActive) {
    // Sin zonas restantes: borrar todo el árbol de teselas (incluye huérfanas).
    try {
      if (TILES_DIR.exists) TILES_DIR.delete();
    } catch {
      // ignore
    }
    await saveZones([]);
    return;
  }
  const others = rest.map(metaToZone);
  deleteTilesNotIn(metaToZone(target), [...others, ...activeZonesExcept(id)]);
  await saveZones(rest);
}

function deleteTilesNotIn(zone: Zone, keep: Zone[]) {
  if (!TILES_DIR) return;
  for (const { z, x, y } of iterateTiles(zone)) {
    if (keep.some((k) => zoneCoversTile(k, z, x, y))) continue;
    try {
      const f = new File(TILES_DIR, String(z), String(x), `${y}.png`);
      if (f.exists) f.delete();
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Descarga
// ---------------------------------------------------------------------------

function tileUrl(z: number, x: number, y: number) {
  return TILE_URL_TEMPLATE.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

/**
 * Descarga las teselas faltantes de una zona (concurrencia 4, omite las que ya
 * existen). Devuelve un handle con cancel() y una promesa `done`.
 */
export function downloadZone(
  zoneId: string,
  zone: Zone,
  onProgress?: (p: DownloadProgress) => void,
): DownloadHandle {
  const existing = handles.get(zoneId);
  if (existing) return existing;

  const total = estimateTiles(zone);
  if (total > MAX_TILES_PER_ZONE) {
    return {
      cancel: () => {},
      done: Promise.resolve({ status: 'too_large', downloaded: 0, skipped: 0, failed: 0, total }),
    };
  }
  if (!TILES_DIR) {
    return {
      cancel: () => {},
      done: Promise.resolve({ status: 'error', downloaded: 0, skipped: 0, failed: 0, total, error: 'no_filesystem' }),
    };
  }
  const root = TILES_DIR;

  let cancelled = false;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    try {
      controller?.abort();
    } catch {
      // ignore
    }
  };

  const run = async (): Promise<DownloadResult> => {
    await loadZones();
    const tiles = Array.from(iterateTiles(zone));
    const createdDirs = new Set<string>();
    let doneCount = 0;
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    let bytes = 0;
    let lastEmit = 0;

    const emit = (force = false) => {
      const now = Date.now();
      if (!force && now - lastEmit < 200) return;
      lastEmit = now;
      const p: DownloadProgress = { done: doneCount, total, progress: total ? doneCount / total : 1, failed };
      onProgress?.(p);
      setState({ active: { ...state.active, [zoneId]: { zoneId, progress: p.progress, done: doneCount, total } } });
    };
    emit(true);

    const fetchTile = async (z: number, x: number, y: number): Promise<boolean> => {
      const dirKey = `${z}/${x}`;
      const dir = new Directory(root, String(z), String(x));
      if (!createdDirs.has(dirKey)) {
        ensureDir(dir);
        createdDirs.add(dirKey);
      }
      const dest = new File(dir, `${y}.png`);
      if (dest.exists) {
        skipped++;
        bytes += dest.size || 0;
        return true;
      }
      // Descarga a un temporal y renombra: así nunca queda una tesela a medias.
      const tmpName = `${y}.png.part`;
      for (let attempt = 0; attempt < 2 && !cancelled; attempt++) {
        const tmp = new File(dir, tmpName);
        try {
          if (tmp.exists) tmp.delete();
          await File.downloadFileAsync(tileUrl(z, x, y), tmp, {
            headers: { 'User-Agent': USER_AGENT },
            idempotent: true,
            ...(controller ? { signal: controller.signal } : {}),
          });
          tmp.rename(`${y}.png`);
          const saved = new File(dir, `${y}.png`);
          bytes += saved.size || 0;
          downloaded++;
          return true;
        } catch {
          try {
            const leftover = new File(dir, tmpName);
            if (leftover.exists) leftover.delete();
          } catch {
            // ignore
          }
        }
      }
      return false;
    };

    let next = 0;
    const worker = async () => {
      while (!cancelled) {
        const i = next++;
        if (i >= tiles.length) return;
        const { z, x, y } = tiles[i];
        let ok = false;
        try {
          ok = await fetchTile(z, x, y);
        } catch {
          ok = false;
        }
        if (!ok && !cancelled) failed++;
        doneCount++;
        emit();
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tiles.length || 1) }, worker));
    emit(true);

    const zonesNow = await loadZones();
    const others = zonesNow.filter((z) => z.id !== zoneId);

    if (cancelled) {
      // Si la zona no estaba guardada, limpiar lo que se bajó en esta sesión.
      const wasSaved = zonesNow.some((z) => z.id === zoneId);
      if (!wasSaved) deleteTilesNotIn(zone, [...others.map(metaToZone), ...activeZonesExcept(zoneId)]);
      return { status: 'cancelled', downloaded, skipped, failed, total };
    }

    const meta: ZoneMeta = {
      id: zoneId,
      name: zone.name ?? zoneId,
      bbox: { south: zone.south, west: zone.west, north: zone.north, east: zone.east },
      minZoom: zone.minZoom,
      maxZoom: zone.maxZoom,
      tiles: total,
      bytes,
      date: new Date().toISOString(),
      complete: failed === 0,
      missing: failed,
    };
    await saveZones([...others, meta]);
    return { status: failed === 0 ? 'done' : 'partial', downloaded, skipped, failed, total };
  };

  const done = run()
    .catch(
      (e: unknown): DownloadResult => ({
        status: 'error',
        downloaded: 0,
        skipped: 0,
        failed: 0,
        total,
        error: e instanceof Error ? e.message : String(e),
      }),
    )
    .finally(() => {
      handles.delete(zoneId);
      activeZones.delete(zoneId);
      const rest = { ...state.active };
      delete rest[zoneId];
      setState({ active: rest });
    });

  const handle: DownloadHandle = { cancel, done };
  handles.set(zoneId, handle);
  activeZones.set(zoneId, zone);
  return handle;
}

export function cancelDownload(zoneId: string) {
  handles.get(zoneId)?.cancel();
}

export function downloadPlaceZone(
  place: Pick<Place, 'id' | 'name' | 'coords' | 'origin'>,
  onProgress?: (p: DownloadProgress) => void,
): DownloadHandle {
  return downloadZone(placeZoneId(place.id), zoneForPlace(place), onProgress);
}

export function downloadProvinceZone(onProgress?: (p: DownloadProgress) => void): DownloadHandle {
  return downloadZone(PROVINCE_ZONE_ID, PROVINCE_ZONE, onProgress);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Estado global de mapas sin conexión (zonas guardadas, descargas activas, bytes). */
export function useOfflineZones() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (!s.loaded) loadZones().catch(() => {});
  }, [s.loaded]);
  return s;
}

export type ZoneStatus = { downloaded: boolean; downloading: boolean; progress: number };

/** Estado de descarga de la zona de un lugar (por id de lugar). */
export function useZoneStatus(placeId: string): ZoneStatus {
  return useZoneIdStatus(placeZoneId(placeId));
}

/** Igual que useZoneStatus pero con id de zona arbitrario (ej. PROVINCE_ZONE_ID). */
export function useZoneIdStatus(zoneId: string): ZoneStatus {
  const s = useOfflineZones();
  const active = s.active[zoneId];
  const meta = s.zones.find((z) => z.id === zoneId);
  return {
    downloaded: !!meta?.complete,
    downloading: !!active,
    progress: active ? active.progress : meta?.complete ? 1 : 0,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(0, Math.round(n / 1024))} KB`;
  const mb = n / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
