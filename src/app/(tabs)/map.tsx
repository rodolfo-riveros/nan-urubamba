import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppMap, type AppMapHandle } from '@/components/AppMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryBadge, OfflineBanner, PlaceImage } from '@/components/place';
import { OfflineAttribution } from '@/components/OfflineTileLayer';
import { Button, Chip, DifficultyBadge, Icon, IconButton, Segmented, T } from '@/components/ui';
import { CATEGORIES, categoryOf } from '@/data/catalog';
import { allPlaces, getPlace, PROVINCE_CENTER } from '@/data/places';
import { useCommunityPlaces } from '@/lib/community';
import { formatDuration, useRouteFrom } from '@/lib/directions';
import { applyFilters } from '@/lib/filter';
import { distanceM, formatDistance, openDirections } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { useApp } from '@/lib/store';
import { categoryColors, radius, useTheme } from '@/theme';

export default function MapScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang, interests, update, filters, ratingFor } = useApp();
  const loc = useLocation();
  const params = useLocalSearchParams<{ focus?: string }>();
  const map = useRef<AppMapHandle>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const community = useCommunityPlaces();
  const PLACES = useMemo(() => allPlaces(), [community]); // eslint-disable-line react-hooks/exhaustive-deps
  const places = useMemo(() => applyFilters(PLACES, interests, filters), [PLACES, interests, filters]);
  const selected = selectedId ? getPlace(selectedId) : undefined;
  const [routeFor, setRouteFor] = useState<string | null>(null);
  const routePlace = routeFor && routeFor === selectedId ? selected : undefined;
  const { route } = useRouteFrom(loc.coords, routePlace, lang);
  const showRoute = (id: string) => {
    setRouteFor(id);
    const p = getPlace(id);
    if (p && loc.coords)
      map.current?.fitToCoordinates([loc.coords, p.coords], { top: 180, right: 60, bottom: 320, left: 60 });
  };

  // Abrir el mapa enfocado en un lugar (/map?focus=id)
  const [lastFocus, setLastFocus] = useState<string | undefined>(undefined);
  if (params.focus !== lastFocus) {
    setLastFocus(params.focus);
    if (params.focus && getPlace(params.focus)) setSelectedId(params.focus);
  }
  useEffect(() => {
    const p = params.focus ? getPlace(params.focus) : undefined;
    if (!p) return;
    const id = setTimeout(() => map.current?.animateTo(p.coords, 0.06), 300);
    return () => clearTimeout(id);
  }, [params.focus]);

  const fitAll = () => {
    const coords = places.map((p) => p.coords);
    if (loc.coords) coords.push(loc.coords);
    if (coords.length)
      map.current?.fitToCoordinates(coords, { top: 160, right: 60, bottom: 260, left: 60 });
  };

  const goToMe = async () => {
    if (loc.status !== 'granted') {
      const ok = await loc.request();
      if (!ok) return;
    }
    if (loc.coords) map.current?.animateTo(loc.coords, 0.08);
  };

  const select = (id: string) => {
    setSelectedId(id);
    const p = getPlace(id)!;
    map.current?.animateTo({ latitude: p.coords.latitude - 0.012, longitude: p.coords.longitude }, 0.08);
  };

  const dist = selected && loc.coords ? distanceM(loc.coords, selected.coords) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppMap
        ref={map}
        initialRegion={{ ...PROVINCE_CENTER, latitudeDelta: 0.45 }}
        userLocation={loc.status === 'granted' ? loc.coords : null}
        markers={places.map((p) => ({
          id: p.id,
          coords: p.coords,
          color: categoryColors[p.categories[0]] ?? c.secondary,
          icon: categoryOf(p.categories[0]).icon,
          title: p.name,
          selected: p.id === selectedId,
        }))}
        lines={
          route && routePlace
            ? [{ coords: route.points, color: route.kind === 'google' ? c.water : c.primary, width: 5, dashed: route.kind !== 'google' }]
            : []
        }
        onReady={fitAll}
        onMarkerPress={select}
        onMapPress={() => setSelectedId(null)}
      />

      {/* Barra superior */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <OfflineBanner />
        <View style={styles.rowPad} pointerEvents="box-none">
          <View style={{ flex: 1 }} />
          <View style={{ width: 160 }}>
            <Segmented
              options={[
                { key: 'list', label: t('list') },
                { key: 'map', label: t('map') },
              ]}
              value="map"
              onChange={(k) => k === 'list' && router.navigate('/')}
            />
          </View>
          <IconButton icon="tune-variant" label={t('filters')} onPress={() => router.push('/filters')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={L(cat.label)}
              icon={cat.icon}
              selected={interests.includes(cat.key)}
              onPress={() =>
                update({ interests: interests.includes(cat.key) ? interests.filter((x) => x !== cat.key) : [...interests, cat.key] })
              }
            />
          ))}
        </ScrollView>
      </View>

      <OfflineAttribution style={{ position: 'absolute', left: 8, bottom: selected ? 236 : 8 }} />
      {/* Botones flotantes */}
      <View style={[styles.fabs, { bottom: selected ? 250 : 24 }]}>
        <IconButton icon="cloud-download-outline" label={t('offlineMaps')} onPress={() => router.push(selected ? { pathname: '/offline', params: { place: selected.id } } : '/offline')} />
        <IconButton icon="arrow-expand-all" label="Fit" onPress={fitAll} />
        <IconButton icon="crosshairs-gps" label={t('myLocation')} onPress={goToMe} color={c.primary} />
      </View>

      {/* Tarjeta del lugar seleccionado */}
      {selected ? (
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable style={{ flexDirection: 'row', gap: 12 }} onPress={() => router.push(`/place/${selected.id}`)}>
            <PlaceImage place={selected} height={84} style={{ width: 84, borderRadius: 14 }} showCaption={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <CategoryBadge place={selected} />
              <T v="h3" numberOfLines={1}>
                {selected.name}
              </T>
              <T v="meta" color={c.textSec} numberOfLines={1}>
                {selected.district}
                {dist != null ? ` · ${t('fromYou', { d: formatDistance(dist, lang) })}` : ''}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <DifficultyBadge value={selected.difficulty} size="s" />
                <T v="meta">★ {ratingFor(selected).rating.toFixed(1)}</T>
                <T v="meta" color={c.textSec}>
                  <Icon name="clock-outline" size={14} color={c.textSec} /> {selected.durationHours} h
                </T>
              </View>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label={t('seePlace')} small style={{ flex: 1 }} onPress={() => router.push(`/place/${selected.id}`)} />
            {routePlace && route ? (
              <Button
                label={t('navigate')}
                small
                variant="secondary"
                icon="google-maps"
                style={{ flex: 1 }}
                onPress={() => openDirections(selected.coords, selected.name, route.mode)}
              />
            ) : (
              <Button
                label={t('showRoute')}
                small
                variant="outline"
                icon="navigation-variant-outline"
                style={{ flex: 1 }}
                onPress={() => (loc.coords ? showRoute(selected.id) : loc.request())}
              />
            )}
          </View>
          {routePlace && route ? (
            <T v="meta" color={c.water}>
              {t('routeFromYou')}: {formatDistance(route.distanceM, lang)} · {formatDuration(route.durationMin, lang)}
              {route.kind === 'estimated' ? ` · ${t('routeEstimated')}` : ''}
            </T>
          ) : (
            <T v="small" color={c.textSec} style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
              {L(selected.summary)}
            </T>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  rowPad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  fabs: { position: 'absolute', right: 16, gap: 10 },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    padding: 14,
    gap: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
