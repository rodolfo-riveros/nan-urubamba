import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReviewItem } from '@/components/place';
import { Button, Chip, EmptyState, Header } from '@/components/ui';
import { getPlace } from '@/data/places';
import { deleteMyReview, reportReview, useCommunityReviews } from '@/lib/community';
import { useApp } from '@/lib/store';
import { useTheme } from '@/theme';

type Sort = 'recent' | 'top' | 'photos';

export default function Reviews() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getPlace(id);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, ratingFor } = useApp();
  const [sort, setSort] = useState<Sort>('recent');
  const { reviews: community, loading, refresh } = useCommunityReviews(place?.id);

  const list = useMemo(() => {
    if (!place) return [];
    const all = community;
    if (sort === 'top') return [...all].sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    if (sort === 'photos') return all.filter((r) => r.photos?.length);
    return all;
  }, [place, community, sort]);

  if (!place) return <EmptyState icon="map-marker-question-outline" title={t('notFound')} />;
  const { rating, count } = ratingFor(place);

  const confirmDelete = (rid: string) =>
    Alert.alert(t('deleteReviewQ'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteMyReview(rid) },
    ]);
  const confirmReport = (rid: string) =>
    Alert.alert(t('reportQ'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('report'), style: 'destructive', onPress: () => reportReview(rid, 'inappropriate').then(() => Alert.alert(t('reported'))) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={t('reviews')} subtitle={`${place.name} · ★ ${rating.toFixed(1)} · ${count}`} />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <Chip label={t('mostRecent')} selected={sort === 'recent'} onPress={() => setSort('recent')} />
            <Chip label={t('topRated')} selected={sort === 'top'} onPress={() => setSort('top')} />
            <Chip label={t('withPhotos')} icon="image-outline" selected={sort === 'photos'} onPress={() => setSort('photos')} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="comment-text-outline" title={t('noReviews')} />}
        renderItem={({ item }) => (
          <ReviewItem
            review={item}
            onDelete={item.mine ? () => confirmDelete(item.id) : undefined}
            onReport={item.mine ? undefined : () => confirmReport(item.id)}
          />
        )}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Button label={t('writeReview')} icon="pencil-outline" onPress={() => router.push(`/review/${place.id}`)} />
      </View>
    </View>
  );
}
