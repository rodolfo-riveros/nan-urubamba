import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nan-urubamba/device-id/v1';

/** UUID v4 (usa crypto.randomUUID si existe; si no, Math.random). */
export function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {
      // continúa con el fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let cached: string | null = null;
let pending: Promise<string> | null = null;

/** Identificador anónimo y estable del dispositivo (se genera una vez y se guarda). */
export function getDeviceId(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = (async () => {
      let id: string | null = null;
      try {
        id = await AsyncStorage.getItem(KEY);
      } catch {
        id = null;
      }
      if (!id) {
        id = uuid();
        await AsyncStorage.setItem(KEY, id).catch(() => {});
      }
      cached = id;
      return id;
    })();
  }
  return pending;
}

const FOLDER_KEY = 'nan-urubamba/photo-folder-id/v1';
let folder: Promise<string> | null = null;

/**
 * Id público y estable usado como carpeta de las fotos en Storage ('<carpeta>/<uuid>.jpg').
 * Es distinto de device_id porque las URLs de fotos son públicas y device_id autoriza borrar reseñas.
 */
export function getPhotoFolderId(): Promise<string> {
  if (!folder) {
    folder = (async () => {
      let id: string | null = null;
      try {
        id = await AsyncStorage.getItem(FOLDER_KEY);
      } catch {
        id = null;
      }
      if (!id) {
        id = uuid();
        await AsyncStorage.setItem(FOLDER_KEY, id).catch(() => {});
      }
      return id;
    })();
  }
  return folder;
}

/** Versión síncrona: null hasta que getDeviceId() haya resuelto al menos una vez. */
export function getDeviceIdSync(): string | null {
  return cached;
}
