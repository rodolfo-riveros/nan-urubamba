import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { DurationBucket } from '@/data/catalog';
import { SEED_REVIEWS } from '@/data/seedReviews';
import { combineRating, useRatingsIndex } from './community';
import type { Category, Difficulty, District, Lang, LText, Place, Review } from '@/data/types';
import { STRINGS, type StringKey } from './strings';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type Filters = {
  difficulties: Difficulty[];
  durations: DurationBucket[];
  districts: District[];
  publicTransport: boolean;
  signal: boolean;
};

export const EMPTY_FILTERS: Filters = {
  difficulties: [],
  durations: [],
  districts: [],
  publicTransport: false,
  signal: false,
};

type Persisted = {
  onboarded: boolean;
  lang: Lang;
  themeMode: ThemeMode;
  interests: Category[];
  saved: string[];
  visited: string[];
  myReviews: Review[];
  userName: string;
  userCountry: string;
  since: string;
};

const DEFAULTS: Persisted = {
  onboarded: false,
  lang: 'es',
  themeMode: 'auto',
  interests: [],
  saved: [],
  visited: [],
  myReviews: [],
  userName: '',
  userCountry: 'Perú',
  since: new Date().toISOString(),
};

const KEY = 'nan-urubamba/state/v1';

type Ctx = Persisted & {
  ready: boolean;
  filters: Filters;
  setFilters: (f: Filters) => void;
  update: (patch: Partial<Persisted>) => void;
  toggleSaved: (id: string) => void;
  toggleVisited: (id: string) => void;
  addReview: (r: Omit<Review, 'id' | 'createdAt' | 'mine'>) => void;
  deleteReview: (id: string) => void;
  reviewsFor: (placeId: string) => Review[];
  ratingFor: (p: Place) => { rating: number; count: number };
  reset: () => Promise<void>;
  t: (k: StringKey, vars?: Record<string, string | number>) => string;
  L: (x: LText | string | undefined) => string;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const loaded = useRef(false);
  const ratingsIndex = useRatingsIndex();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULTS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((patch: Partial<Persisted>) => setState((s) => ({ ...s, ...patch })), []);

  const toggleIn = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const toggleSaved = useCallback((id: string) => setState((s) => ({ ...s, saved: toggleIn(s.saved, id) })), []);
  const toggleVisited = useCallback((id: string) => setState((s) => ({ ...s, visited: toggleIn(s.visited, id) })), []);

  const addReview = useCallback((r: Omit<Review, 'id' | 'createdAt' | 'mine'>) => {
    const review: Review = {
      ...r,
      id: `mine-${Date.now()}`,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setState((s) => ({
      ...s,
      myReviews: [review, ...s.myReviews],
      visited: s.visited.includes(r.placeId) ? s.visited : [...s.visited, r.placeId],
      userName: s.userName || r.author,
      userCountry: r.country || s.userCountry,
    }));
  }, []);

  const deleteReview = useCallback(
    (id: string) => setState((s) => ({ ...s, myReviews: s.myReviews.filter((r) => r.id !== id) })),
    [],
  );

  const reviewsFor = useCallback(
    (placeId: string) =>
      [...state.myReviews, ...SEED_REVIEWS]
        .filter((r) => r.placeId === placeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.myReviews],
  );

  // Valoración = reseñas reales de la comunidad (servidor + pendientes de envío)
  const ratingFor = useCallback((p: Place) => combineRating(p, ratingsIndex[p.id]), [ratingsIndex]);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setFilters(EMPTY_FILTERS);
    setState({ ...DEFAULTS, since: new Date().toISOString() });
  }, []);

  const t = useCallback(
    (k: StringKey, vars?: Record<string, string | number>) => {
      let s: string = STRINGS[k]?.[state.lang] ?? k;
      if (vars) for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, String(v));
      return s;
    },
    [state.lang],
  );

  const L = useCallback(
    (x: LText | string | undefined) => (x == null ? '' : typeof x === 'string' ? x : x[state.lang]),
    [state.lang],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      filters,
      setFilters,
      update,
      toggleSaved,
      toggleVisited,
      addReview,
      deleteReview,
      reviewsFor,
      ratingFor,
      reset,
      t,
      L,
    }),
    [state, ready, filters, update, toggleSaved, toggleVisited, addReview, deleteReview, reviewsFor, ratingFor, reset, t, L],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
