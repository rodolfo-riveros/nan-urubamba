import { DEMO_REVIEWS } from '@/data/demoReviews';
import type { Place, Review } from '@/data/types';

const cache = new Map<string, Review[]>();

/** Reseñas de demostración de un lugar (vacío si no tiene) */
export function demoReviewsFor(place: Place | undefined): Review[] {
  if (!place) return [];
  const hit = cache.get(place.id);
  if (hit) return hit;
  const rows = DEMO_REVIEWS[place.id] ?? (place.official ? DEMO_REVIEWS[place.official.code] : undefined) ?? [];
  const list: Review[] = rows.map(([author, country, visitedAt, rating, lang, text, tip], i) => ({
    id: `demo-${place.id}-${i}`,
    placeId: place.id,
    author,
    country,
    visitedAt,
    // creada pocos días después de la visita
    createdAt: `${visitedAt}-${String(10 + i * 7).padStart(2, '0')}T15:00:00Z`,
    rating,
    text,
    tip,
    lang,
    demo: true,
  }));
  cache.set(place.id, list);
  return list;
}

/** Valoración base de demostración: promedio y número de reseñas demo visibles */
export function demoBase(place: Place): { rating: number; ratingCount: number } {
  const list = demoReviewsFor(place);
  if (!list.length) return { rating: place.rating, ratingCount: place.ratingCount };
  const avg = list.reduce((a, r) => a + r.rating, 0) / list.length;
  return { rating: Math.round(avg * 10) / 10, ratingCount: list.length };
}
