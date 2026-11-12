import { useMemo } from 'react';
import { getPlace } from '@/data/places';
import { useCommunityReviews } from './community';
import { demoReviewsFor } from './demoData';
import { useApp } from './store';

/** Reseñas de un lugar: comunidad (servidor/teléfono) + demostración si está activada */
export function usePlaceReviews(placeId: string | undefined) {
  const community = useCommunityReviews(placeId);
  const { demoMode } = useApp();
  const reviews = useMemo(() => {
    const demo = demoMode ? demoReviewsFor(placeId ? getPlace(placeId) : undefined) : [];
    return [...community.reviews, ...demo].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [community.reviews, demoMode, placeId]);
  return { ...community, reviews };
}
