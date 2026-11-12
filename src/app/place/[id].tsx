import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { ScrollViewInstance } from 'react-native';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BaseMapAttribution, BaseMapLayer, useBaseMapType } from '@/components/BaseMapLayer';
import { OfflineTileLayer, useOfflineMode } from '@/components/OfflineTileLayer';
import { CategoryBadge, OfflineBanner, PlaceImage, QuickFact, RatingSummary, ReviewItem } from '@/components/place';
import { Button, Card, DifficultyBadge, EmptyState, Icon, IconButton, SectionTitle, T, TipBox } from '@/components/ui';
import { CARES, difficultyOf, ROUTE_ICONS } from '@/data/catalog';
import { getPlace, OFFICIAL_SOURCE } from '@/data/places';
import { formatDuration, useRouteFrom } from '@/lib/directions';
import { distanceM, formatDistance, openDirections } from '@/lib/geo';
import { usePlaceReviews } from '@/lib/usePlaceReviews';
import { useLocation } from '@/lib/location';
import { useZoneStatus } from '@/lib/offlineMaps';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { useApp } from '@/lib/store';
import { difficultyColors, radius, useTheme } from '@/theme';

type SectionKey = 'route' | 'cares' | 'history' | 'reviews' | 'nearby';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getPlace(id);
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang, saved, toggleSaved, visited, toggleVisited, ratingFor } = useApp();
  const loc = useLocation();
  const scroll = useRef<ScrollViewInstance>(null);
  const [offsets, setOffsets] = useState<Partial<Record<SectionKey, number>>>({});
  const [expanded, setExpanded] = useState(false);
  const [officialExpanded, setOfficialExpanded] = useState(false);
  const { route, loading: routeLoading } = useRouteFrom(loc.coords, place, lang);
  const { mapType: offlineMapType, offline } = useOfflineMode();
  const baseMapType = useBaseMapType('terrain');
  const zone = useZoneStatus(place?.id ?? '');

  const { reviews } = usePlaceReviews(place?.id);

  if (!place) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
        <EmptyState icon="map-marker-question-outline" title={t('notFound')} action={t('back')} onAction={() => router.back()} />
      </View>
    );
  }

  const { rating, count } = ratingFor(place);
  const isSaved = saved.includes(place.id);
  const isVisited = visited.includes(place.id);
  const dist = loc.coords ? distanceM(loc.coords, place.coords) : null;
  const diff = difficultyOf(place.difficulty);
  const hasHistory = !!place.history || !!place.official;
  const isEvent = place.kind === 'event';
  const tabs: { key: SectionKey; label: string }[] = [
    { key: 'route', label: t('howToGet') },
    { key: 'cares', label: t('cares') },
    ...(hasHistory ? [{ key: 'history' as const, label: t('history') }] : []),
    { key: 'reviews', label: t('reviews') },
    { key: 'nearby', label: t('nearby') },
  ];
  const jump = (k: SectionKey) => scroll.current?.scrollTo({ y: (offsets[k] ?? 0) - 60, animated: true });
  const onLayout = (k: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    const y = e.nativeEvent.layout.y;
    setOffsets((o) => (o[k] === y ? o : { ...o, [k]: y }));
  };

  const share = () =>
    Share.share({
      message: `${place.name} (${place.district}) — ${L(place.summary)}\nhttps://www.google.com/maps/search/?api=1&query=${place.coords.latitude},${place.coords.longitude}`,
    });

  const mid = {
    latitude: (place.origin.coords.latitude + place.coords.latitude) / 2,
    longitude: (place.origin.coords.longitude + place.coords.longitude) / 2,
  };
  const span = Math.max(
    0.02,
    Math.abs(place.origin.coords.latitude - place.coords.latitude) * 1.8,
    Math.abs(place.origin.coords.longitude - place.coords.longitude) * 1.8,
  );

  const routeRegion = route
    ? (() => {
        const lats = route.points.map((p) => p.latitude);
        const lons = route.points.map((p) => p.longitude);
        const minLa = Math.min(...lats);
        const maxLa = Math.max(...lats);
        const minLo = Math.min(...lons);
        const maxLo = Math.max(...lons);
        return {
          latitude: (minLa + maxLa) / 2,
          longitude: (minLo + maxLo) / 2,
          latitudeDelta: Math.max(0.01, (maxLa - minLa) * 1.4),
          longitudeDelta: Math.max(0.01, (maxLo - minLo) * 1.4),
        };
      })()
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scroll} stickyHeaderIndices={[2]} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 0 · Hero */}
        <View>
          <PlaceImage place={place} height={300 + insets.top} rounded={false} />
          <View style={[styles.heroBar, { top: insets.top + 8 }]}>
            <IconButton icon="chevron-left" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View style={{ flex: 1 }} />
            <IconButton icon="share-variant-outline" label={t('share')} onPress={share} />
            <IconButton
              icon={isSaved ? 'bookmark' : 'bookmark-outline'}
              label={isSaved ? t('saved') : t('save')}
              onPress={() => toggleSaved(place.id)}
              color={isSaved ? c.primary : undefined}
            />
          </View>
        </View>

        {/* 1 · Título y datos rápidos */}
        <View style={{ padding: 16, gap: 10 }}>
          <OfflineBanner />
          <View style={styles.row}>
            <CategoryBadge place={place} />
            <T v="meta" color={c.textSec}>
              {place.district} · Urubamba
            </T>
          </View>
          <T v="h1">{place.name}</T>
          <Pressable onPress={() => jump('reviews')} style={styles.row}>
            {count ? (
              <>
                <Icon name="star" size={18} color={c.accent} />
                <T v="bodyStrong">{rating.toFixed(1)}</T>
                <T v="meta" color={c.textSec}>
                  · {t('reviewsN', { n: count })}
                </T>
              </>
            ) : (
              <T v="meta" color={c.textSec}>
                {t('noRatingYet')}
              </T>
            )}
            {dist != null ? (
              <T v="meta" color={c.textSec}>
                · {t('fromYou', { d: formatDistance(dist, lang) })}
              </T>
            ) : null}
          </Pressable>
          <T color={c.textSec}>{L(place.description)}</T>
          <View style={styles.facts}>
            {isEvent ? (
              <QuickFact icon="calendar-star" label={t('event')} value={place.official?.subtype ?? ''} />
            ) : (
            <>
            <QuickFact
              icon={difficultyColors[place.difficulty].icon}
              color={difficultyColors[place.difficulty].base}
              label={t('difficulty')}
              value={L(diff.label)}
              hint={L(diff.hint)}
            />
            <QuickFact icon="clock-outline" label={t('totalTime')} value={`${place.durationHours} h`} hint={L(place.durationNote)} />
            </>
            )}
            {place.altitude ? (
              <QuickFact icon="image-filter-hdr" label={t('altitude')} value={`${place.altitude.toLocaleString(lang === 'es' ? 'es-PE' : 'en-US')} m`} hint={t('masl')} />
            ) : null}
            {place.official?.hours ? (
              <QuickFact icon="clock-time-four-outline" label={t('hours')} value={place.official.hours} />
            ) : (
              <QuickFact icon="calendar-range" label={t('bestSeason')} value={L(place.bestSeason)} />
            )}
            {place.official?.entry ? (
              <QuickFact icon="ticket-outline" label={t('entry')} value={place.official.entry.length > 70 ? place.official.entry.slice(0, 70) + '…' : place.official.entry} />
            ) : null}
          </View>
          <View style={[styles.sourceBox, { backgroundColor: place.source === 'mincetur' ? c.secondaryTint : c.accentTint }]}>
            <Icon
              name={place.source === 'mincetur' ? 'file-certificate-outline' : place.source === 'comunidad' ? 'account-multiple-outline' : 'information-outline'}
              size={18}
              color={place.source === 'mincetur' ? c.secondary : isDark ? c.accent : '#8A5A0B'}
            />
            <T v="small" style={{ flex: 1, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {place.source === 'mincetur'
                ? `${t('officialRecord', { n: place.official!.code })}${place.estimated ? ' · ' + t('estimatedNote') : ''}`
                : place.source === 'comunidad'
                  ? t('communityNote')
                  : t('curatedNote')}
            </T>
          </View>
          <View style={[styles.row, { gap: 10 }]}>
            <Button
              label={isVisited ? t('visited') : t('markVisited')}
              icon={isVisited ? 'check-circle' : 'check-circle-outline'}
              variant={isVisited ? 'secondary' : 'outline'}
              small
              style={{ flex: 1 }}
              onPress={() => toggleVisited(place.id)}
            />
          </View>
        </View>

        {/* 2 · Pestañas fijas */}
        <View style={{ backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {tabs.map((tb) => (
              <Pressable key={tb.key} onPress={() => jump(tb.key)} style={styles.tab}>
                <T v="meta" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {tb.label}
                </T>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 3 · Cómo llegar */}
        <View style={styles.section} onLayout={onLayout('route')}>
          <SectionTitle title={t('howToGet')} />
          {/* Ruta desde la posición actual */}
          <View style={[styles.miniMap, { borderColor: c.border, height: 220 }]}>
            <MapView
              provider={MAP_PROVIDER}
              style={StyleSheet.absoluteFill}
              initialRegion={{ ...mid, latitudeDelta: span, longitudeDelta: span }}
              region={routeRegion ?? undefined}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsUserLocation={loc.status === 'granted'}
              customMapStyle={isDark ? DARK_MAP_STYLE : []}
              mapType={baseMapType === 'none' ? 'none' : offline ? offlineMapType : 'terrain'}
              onPress={() => router.push({ pathname: '/map', params: { focus: place.id } })}
            >
              <BaseMapLayer />
              <OfflineTileLayer provider={MAP_PROVIDER} />
              {route ? null : <Marker coordinate={place.origin.coords} title={place.origin.name} pinColor="#2F5D50" />}
              <Marker coordinate={place.coords} title={place.name} pinColor="#B5462B" />
              {route ? (
                <Polyline
                  coordinates={route.points}
                  strokeColor={route.kind === 'google' ? c.water : c.primary}
                  strokeWidth={4}
                  lineDashPattern={route.kind === 'google' ? undefined : [8, 6]}
                />
              ) : (
                <Polyline coordinates={[place.origin.coords, place.coords]} strokeColor={c.primary} strokeWidth={3} lineDashPattern={[8, 6]} />
              )}
            </MapView>
            <BaseMapAttribution />
          </View>
          <View style={[styles.routeCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Icon name="navigation-variant" size={22} color={c.water} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{t('routeFromYou')}</T>
              {route ? (
                <T v="meta" color={c.textSec}>
                  {formatDistance(route.distanceM, lang)} · {formatDuration(route.durationMin, lang)} ·{' '}
                  {route.kind === 'google'
                    ? t('routeReal')
                    : route.via
                      ? t('routeVia', { x: route.via })
                      : t('routeWalk')}
                  {route.kind === 'estimated' ? ` · ${t('routeEstimated')}` : ''}
                </T>
              ) : (
                <T v="meta" color={c.textSec}>
                  {loc.status !== 'granted' ? t('needLocationRoute') : routeLoading ? '…' : t('needLocationRoute')}
                </T>
              )}
            </View>
            {loc.status !== 'granted' ? (
              <Button small label={t('enableLocation')} onPress={loc.request} />
            ) : (
              <Button small label={t('navigate')} icon="google-maps" onPress={() => openDirections(place.coords, place.name, route?.mode === 'walking' ? 'walking' : 'driving')} />
            )}
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/offline', params: { place: place.id } })}
            style={[styles.routeCard, { backgroundColor: zone.downloaded ? c.secondaryTint : c.surface, borderColor: c.border }]}
          >
            <Icon name={zone.downloaded ? 'map-check-outline' : 'cloud-download-outline'} size={22} color={c.secondary} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{zone.downloaded ? `${t('offlineMaps')} ✓` : t('downloadArea')}</T>
              <T v="meta" color={c.textSec}>
                {zone.downloading ? `${Math.round(zone.progress * 100)} %` : t('offlineMapsHint')}
              </T>
            </View>
            <Icon name="chevron-right" color={c.textSec} />
          </Pressable>
          {route?.steps.length ? (
            <View style={{ gap: 6, marginTop: 10 }}>
              {route.steps.slice(0, 6).map((st, i) => (
                <View key={i} style={[styles.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
                  <T v="small" color={c.water} style={{ width: 18 }}>
                    {i + 1}.
                  </T>
                  <T v="meta" style={{ flex: 1 }}>
                    {st.text} <T v="small" color={c.textSec}>({formatDistance(st.distanceM, lang)})</T>
                  </T>
                </View>
              ))}
            </View>
          ) : null}

          <T v="bodyStrong" style={{ marginTop: 20, marginBottom: 10 }}>
            {place.source === 'mincetur' && place.estimated ? t('officialAccess') : t('howToGet')}
          </T>
          <View style={{ gap: 0 }}>
            {place.route.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[styles.stepNum, { backgroundColor: c.primary }]}>
                    <T v="small" color="#FFF">
                      {i + 1}
                    </T>
                  </View>
                  {i < place.route.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: c.border }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 18, gap: 4 }}>
                  <View style={styles.row}>
                    <Icon name={ROUTE_ICONS[s.mode]} size={18} color={c.secondary} />
                    <T v="bodyStrong" style={{ flex: 1 }}>
                      {L(s.title)}
                    </T>
                  </View>
                  <T v="meta" color={c.textSec}>
                    {L(s.detail)}
                  </T>
                  <View style={[styles.row, { gap: 12 }]}>
                    {s.cost ? (
                      <View style={styles.row}>
                        <Icon name="cash" size={16} color={c.textSec} />
                        <T v="meta">{s.cost}</T>
                      </View>
                    ) : null}
                    <View style={styles.row}>
                      <Icon name="clock-outline" size={16} color={c.textSec} />
                      <T v="meta">{s.time}</T>
                    </View>
                    {s.mode === 'walk' && i === place.route.length - 1 ? <DifficultyBadge value={place.difficulty} size="s" /> : null}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Button
            label={t('openInGoogleMaps')}
            icon="google-maps"
            onPress={() => openDirections(place.coords, place.name)}
            style={{ marginTop: 12 }}
          />
          <T v="small" color={c.textSec} style={{ marginTop: 8, fontFamily: 'PlusJakartaSans_400Regular' }}>
            {t('approxData')}
          </T>
        </View>

        {/* 4 · Cuidados */}
        <View style={styles.section} onLayout={onLayout('cares')}>
          <SectionTitle title={t('cares')} />
          <View style={{ gap: 10 }}>
            {place.cares.map((k) => {
              const care = CARES[k];
              return (
                <View key={k} style={[styles.care, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <View style={[styles.careIcon, { backgroundColor: c.secondaryTint }]}>
                    <Icon name={care.icon} size={20} color={c.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong">{L(care.title)}</T>
                    <T v="meta" color={c.textSec}>
                      {L(care.text)}
                    </T>
                  </View>
                </View>
              );
            })}
            {place.extraCare ? <TipBox label="⚠" text={L(place.extraCare)} /> : null}
            <View style={[styles.care, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.careIcon, { backgroundColor: c.secondaryTint }]}>
                <Icon name={place.signal === 'nula' ? 'signal-off' : place.signal === 'debil' ? 'signal-cellular-1' : 'signal-cellular-3'} size={20} color={c.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="bodyStrong">{t('signal')}</T>
                <T v="meta" color={c.textSec}>
                  {t('signalHint')}
                </T>
              </View>
              <T v="small" color={place.signal === 'buena' ? c.secondary : c.danger}>
                {t(`signal_${place.signal}`)}
              </T>
            </View>
          </View>
        </View>

        {/* 5 · Historia y ficha oficial */}
        {hasHistory ? (
          <View style={styles.section} onLayout={onLayout('history')}>
            <SectionTitle title={t('history')} />
            {place.official ? (
              <Card style={{ padding: 16, gap: 10, marginBottom: place.history ? 12 : 0 }}>
                <View style={[styles.row, { gap: 8 }]}>
                  <Icon name="file-certificate-outline" size={18} color={c.secondary} />
                  <T v="bodyStrong" style={{ flex: 1 }}>
                    {t('officialDesc')}
                  </T>
                </View>
                {place.official.toponymy ? (
                  <T v="meta" color={c.textSec}>
                    <T v="small">{t('toponymy')}: </T>
                    {place.official.toponymy}
                  </T>
                ) : null}
                {lang === 'en' ? (
                  <>
                    <T>{L(place.summary)}</T>
                    <T v="small" color={c.textSec}>
                      {t('officialInSpanish')}
                    </T>
                  </>
                ) : null}
                <T numberOfLines={officialExpanded ? undefined : 6}>{place.official.description}</T>
                <View style={[styles.row, { gap: 16 }]}>
                  <Pressable onPress={() => setOfficialExpanded(!officialExpanded)} hitSlop={8}>
                    <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {officialExpanded ? t('readLess') : t('readMore')}
                    </T>
                  </Pressable>
                  {lang === 'en' ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        Linking.openURL(
                          `https://translate.google.com/?sl=es&tl=en&op=translate&text=${encodeURIComponent(place.official!.description.slice(0, 4500))}`,
                        )
                      }
                    >
                      <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Translate
                      </T>
                    </Pressable>
                  ) : null}
                </View>
                {place.official.reference ? (
                  <T v="meta" color={c.textSec}>
                    <T v="small">{t('reference')}: </T>
                    {place.official.reference}
                  </T>
                ) : null}
                {place.official.state ? (
                  <T v="meta" color={c.textSec}>
                    <T v="small">{t('conservation')}: </T>
                    {place.official.state}
                  </T>
                ) : null}
                {place.official.activities.length ? (
                  <>
                    <T v="small" color={c.textSec}>
                      {t('activities')}
                    </T>
                    <View style={[styles.row, { gap: 6 }]}>
                      {place.official.activities.slice(0, 10).map((a) => (
                        <View key={a} style={[styles.pill, { backgroundColor: c.secondaryTint }]}>
                          <T v="small" color={c.secondary}>
                            {a}
                          </T>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
                {place.photos && place.photos.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {place.photos.slice(1).map((u) => (
                      <Image key={u} source={{ uri: u }} style={styles.galleryImg} resizeMode="cover" />
                    ))}
                  </ScrollView>
                ) : null}
                <Pressable onPress={() => Linking.openURL(place.official!.url)} style={styles.row} hitSlop={8}>
                  <Icon name="open-in-new" size={16} color={c.primary} />
                  <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {t('openRecord')}
                  </T>
                </Pressable>
                <T v="small" color={c.textSec} style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {t('dataCredit', { d: OFFICIAL_SOURCE.date })}
                </T>
              </Card>
            ) : null}
            {place.history ? (
            <Card style={{ padding: 16, gap: 10 }}>
              <View style={[styles.row, { gap: 8 }]}>
                <View style={[styles.pill, { backgroundColor: c.primaryTint }]}>
                  <T v="small" color={c.primary}>
                    {L(place.history.culture)}
                  </T>
                </View>
                <View style={[styles.pill, { backgroundColor: c.accentTint }]}>
                  <T v="small" color={isDark ? c.accent : '#8A5A0B'}>
                    {L(place.history.period)}
                  </T>
                </View>
              </View>
              <T numberOfLines={expanded ? undefined : 4}>{L(place.history.text)}</T>
              <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8}>
                <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {expanded ? t('readLess') : t('readMore')}
                </T>
              </Pressable>
            </Card>
            ) : null}
          </View>
        ) : null}

        {/* 6 · Reseñas */}
        <View style={styles.section} onLayout={onLayout('reviews')}>
          <SectionTitle
            title={t('reviews')}
            action={reviews.length ? t('seeAllReviews', { n: count }) : undefined}
            onAction={() => router.push(`/reviews/${place.id}`)}
          />
          <RatingSummary rating={rating} count={count} reviews={reviews} />
          <View style={{ gap: 12, marginTop: 16 }}>
            {reviews.length ? (
              reviews.slice(0, 2).map((r) => <ReviewItem key={r.id} review={r} />)
            ) : (
              <T color={c.textSec}>{t('noReviews')}</T>
            )}
          </View>
        </View>

        {/* 7 · Cerca */}
        <View style={styles.section} onLayout={onLayout('nearby')}>
          <Pressable
            onPress={() => router.push(`/nearby/${place.id}`)}
            style={[styles.care, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <View style={[styles.careIcon, { backgroundColor: c.primaryTint }]}>
              <Icon name="bed" size={20} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{t('stayNear')}</T>
              <T v="meta" color={c.textSec}>
                {t('stayNearHint')}
              </T>
            </View>
            <Icon name="chevron-right" color={c.textSec} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Acciones fijas */}
      <View style={[styles.bottom, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: insets.bottom + 12 }]}>
        <Button label={t('writeReview')} icon="pencil-outline" style={{ flex: 1 }} onPress={() => router.push(`/review/${place.id}`)} />
        {place.categories.includes('arqueologia') || place.cameraInfo ? (
          <Button label={t('cameraMode')} icon="camera-iris" variant="outline" style={{ flex: 1 }} onPress={() => router.navigate('/camera')} />
        ) : (
          <Button
            label={t('howToGet')}
            icon="navigation-variant-outline"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => openDirections(place.coords, place.name)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tab: { paddingHorizontal: 12, height: 48, justifyContent: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  galleryImg: { width: 150, height: 100, borderRadius: 10 },
  sourceBox: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: radius.input, alignItems: 'flex-start' },
  routeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.input, borderWidth: 1, marginTop: 10 },
  miniMap: { height: 180, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, marginTop: 4 },
  mapLabel: { position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  care: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.input, borderWidth: 1 },
  careIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
});

