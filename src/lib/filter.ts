import { DURATIONS } from '@/data/catalog';
import type { Category, Coords, Place } from '@/data/types';
import { distanceM } from './geo';
import { EMPTY_FILTERS, type Filters } from './store';

export function matches(p: Place, cats: Category[], f: Filters): boolean {
  if (cats.length && !p.categories.some((c) => cats.includes(c))) return false;
  if (f.difficulties.length && !f.difficulties.includes(p.difficulty)) return false;
  if (f.durations.length && !DURATIONS.some((d) => f.durations.includes(d.key) && d.test(p.durationHours))) return false;
  if (f.districts.length && !f.districts.includes(p.district)) return false;
  if (f.publicTransport && !p.publicTransport) return false;
  if (f.signal && p.signal === 'nula') return false;
  return true;
}

export function applyFilters(places: Place[], cats: Category[], f: Filters) {
  return places.filter((p) => matches(p, cats, f));
}

export function activeFilterCount(f: Filters) {
  return (
    f.difficulties.length + f.durations.length + f.districts.length + (f.publicTransport ? 1 : 0) + (f.signal ? 1 : 0)
  );
}

export type Relaxation = { key: string; label: { kind: 'district' | 'duration' | 'difficulty' | 'all'; value?: string }; filters: Filters; cats: Category[]; count: number };

/** Sugerencias para el estado vacío: qué pasa si quitas un filtro */
export function suggestRelaxations(places: Place[], cats: Category[], f: Filters): Relaxation[] {
  const out: Relaxation[] = [];
  for (const d of f.districts) {
    const nf = { ...f, districts: f.districts.filter((x) => x !== d) };
    const n = applyFilters(places, cats, nf).length;
    if (n) out.push({ key: `d-${d}`, label: { kind: 'district', value: d }, filters: nf, cats, count: n });
  }
  if (f.durations.length) {
    const nf = { ...f, durations: [] };
    const n = applyFilters(places, cats, nf).length;
    if (n) out.push({ key: 'dur', label: { kind: 'duration' }, filters: nf, cats, count: n });
  }
  if (f.difficulties.length) {
    const nf = { ...f, difficulties: [] };
    const n = applyFilters(places, cats, nf).length;
    if (n) out.push({ key: 'dif', label: { kind: 'difficulty' }, filters: nf, cats, count: n });
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 3);
}

export function sortByDistance(places: Place[], from: Coords | null) {
  if (!from) return places;
  return [...places].sort((a, b) => distanceM(from, a.coords) - distanceM(from, b.coords));
}

export { EMPTY_FILTERS };
