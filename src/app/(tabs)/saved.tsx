import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner, PlaceRow, ReviewItem } from '@/components/place';
import { DifficultyBadge, EmptyState, Icon, Segmented, T } from '@/components/ui';
import { getPlace } from '@/data/places';
import { distanceM } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { deleteMyReview, useMyCommunityReviews } from '@/lib/community';
import { useApp } from '@/lib/store';
import { useTheme } from '@/theme';

export default function Saved() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, saved, toggleSaved } = useApp();
  const myReviews = useMyCommunityReviews();
  const loc = useLocation();
  const [tab, setTab] = useState<'places' | 'reviews'>('places');
  const places = saved.map(getPlace).filter((p) => !!p);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <OfflineBanner />
      <View style={{ padding: 16, gap: 14 }}>
        <T v="h1">{t('tabSaved')}</T>
        <Segmented
          options={[
            { key: 'places', label: `${t('places')} · ${places.length}` },
            { key: 'reviews', label: `${t('myReviews')} · ${myReviews.length}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}>
        {tab === 'places' ? (
          places.length ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.secondaryTint, alignItems: 'center' }}>
                <Icon name="cloud-check-outline" color={c.secondary} />
                <T v="meta" style={{ flex: 1 }}>
                  {t('offlineReady')}
                </T>
              </View>
              {places.map((p) => (
                <PlaceRow
                  key={p.id}
                  place={p}
                  distance={loc.coords ? distanceM(loc.coords, p.coords) : null}
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <Pressable hitSlop={10} onPress={() => toggleSaved(p.id)} accessibilityLabel={t('saved')}>
                        <Icon name="bookmark" color={c.primary} />
                      </Pressable>
                      <DifficultyBadge value={p.difficulty} size="s" />
                    </View>
                  }
                />
              ))}
            </>
          ) : (
            <EmptyState icon="bookmark-outline" title={t('noSaved')} text={t('noSavedHint')} action={t('goExplore')} onAction={() => router.navigate('/')} />
          )
        ) : myReviews.length ? (
          myReviews.map((r) => (
            <View key={r.id} style={{ gap: 6 }}>
              <Pressable onPress={() => router.push(`/place/${r.placeId}`)}>
                <T v="bodyStrong" color={c.primary}>
                  {getPlace(r.placeId)?.name}
                </T>
              </Pressable>
              <ReviewItem
                review={r}
                onDelete={() =>
                  Alert.alert(t('deleteReviewQ'), undefined, [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: () => deleteMyReview(r.id) },
                  ])
                }
              />
            </View>
          ))
        ) : (
          <EmptyState icon="comment-text-outline" title={t('noMyReviews')} text={t('noMyReviewsHint')} action={t('goExplore')} onAction={() => router.navigate('/')} />
        )}
      </ScrollView>
    </View>
  );
}
