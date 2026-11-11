import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Coords } from '@/data/types';

type PermStatus = 'undetermined' | 'granted' | 'denied';

type Ctx = {
  status: PermStatus;
  coords: Coords | null;
  accuracy: number | null;
  /** Pide permiso (si hace falta) y empieza a seguir la posición */
  request: () => Promise<boolean>;
};

const LocationContext = createContext<Ctx | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PermStatus>('undetermined');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const sub = useRef<Location.LocationSubscription | null>(null);

  const startWatching = useCallback(async () => {
    if (sub.current) return;
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        setAccuracy(last.coords.accuracy ?? null);
      }
      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (loc) => {
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setAccuracy(loc.coords.accuracy ?? null);
        },
      );
    } catch {
      // GPS apagado o no disponible: mantenemos el último valor conocido
    }
  }, []);

  const check = useCallback(async () => {
    try {
      const p = await Location.getForegroundPermissionsAsync();
      const s: PermStatus = p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
      setStatus(s);
      if (p.granted) startWatching();
    } catch {
      setStatus('undetermined');
    }
  }, [startWatching]);

  useEffect(() => {
    // Primera comprobación fuera del cuerpo síncrono del efecto
    const first = setTimeout(check, 0);
    // Re-evalúa al volver de Ajustes del sistema
    const s = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => {
      clearTimeout(first);
      s.remove();
      sub.current?.remove();
      sub.current = null;
    };
  }, [check]);

  const request = useCallback(async () => {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setStatus(p.granted ? 'granted' : 'denied');
      if (p.granted) {
        await Location.enableNetworkProviderAsync().catch(() => {});
        startWatching();
      }
      return p.granted;
    } catch {
      setStatus('denied');
      return false;
    }
  }, [startWatching]);

  return (
    <LocationContext.Provider value={{ status, coords, accuracy, request }}>{children}</LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation debe usarse dentro de LocationProvider');
  return ctx;
}
