import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para el backend comunitario (reseñas, fotos, sugerencias).
 * Configuración por variables de entorno (.env):
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 * Si faltan, la app funciona solo en local (isConfigured() === false, getSupabase() === null).
 */
const URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const REVIEW_PHOTOS_BUCKET = 'review-photos';

export function isConfigured(): boolean {
  return /^https?:\/\//.test(URL) && ANON_KEY.length > 20;
}

let client: SupabaseClient | null = null;

/** Devuelve el cliente (creado en forma perezosa) o null si no hay configuración. */
export function getSupabase(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (!client) {
    try {
      client = createClient(URL, ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          persistSession: false, // uso anónimo: sin sesión de usuario
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    } catch {
      client = null;
    }
  }
  return client;
}
