import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryBadge, OfflineBanner, PlaceImage } from '@/components/place';
import { PlaceMarker } from '@/components/PlaceMarker';
import { OfflineAttribution, OfflineTileLayer, useOfflineMode } from '@/components/OfflineTileLayer';
import { Button, Chip, DifficultyBadge, Icon, IconButton, Segmented, T } from '@/components/ui';
import { CATEGORIES } from '@/data/catalog';
import { allPlaces, getPlace, PROVINCE_CENTER } from '@/data/places';
import { useCommunityPlaces } from '@/lib/community';
import { formatDuration, useRouteFrom } from '@/lib/directions';
import { applyFilters } from '@/lib/filter';
import { distanceM, formatDistance, openDirections } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { useApp } from '@/lib/store';
import { radius, useTheme } from '@/theme';

export default function MapScreen() {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang, interests, update, filters, ratingFor } = useApp();
  const loc = useLocation();
  const params = useLocalSearchParams<{ focus?: string }>();
  const map = useRef<MapView>(null);
  const { mapType: offlineMapType, offline } = useOfflineMode();
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
      map.current?.fitToCoordinates([loc.coords, p.coords], { edgePadding: { top: 180, right: 60, bottom: 320, left: 60 }, animated: true });
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
    const id = setTimeout(() => map.current?.animateToRegion({ ...p.coords, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 600), 300);
    return () => clearTimeout(id);
  }, [params.focus]);

  const fitAll = () => {
    const coords = places.map((p) => p.coords);
    if (loc.coords) coords.push(loc.coords);
    if (coords.length)
      map.current?.fitToCoordinates(coords, { edgePadding: { top: 160, right: 60, bottom: 260, left: 60 }, animated: true });
  };

  const goToMe = async () => {
    if (loc.status !== 'granted') {
      const ok = await loc.request();
      if (!ok) return;
    }
    if (loc.coords) map.current?.animateToRegion({ ...loc.coords, latitudeDelta: 0.08, longitudeDelta: 0.08 }, 600);
  };

  const select = (id: string) => {
    setSelectedId(id);
    const p = getPlace(id)!;
    map.current?.animateToRegion(
      { latitude: p.coords.latitude - 0.012, longitude: p.coords.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 },
      500,
    );
  };

  const dist = selected && loc.coords ? distanceM(loc.coords, selected.coords) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <MapView
        ref={map}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...PROVINCE_CENTER, latitudeDelta: 0.45, longitudeDelta: 0.45 }}
        showsUserLocation={loc.status === 'granted'}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        mapType={offline ? offlineMapType : 'terrain'}
        onMapReady={fitAll}
        onPress={(e) => e.nativeEvent.action !== 'marker-press' && setSelectedId(null)}
      >
        <OfflineTileLayer provider={MAP_PROVIDER} />
        {places.map((p) => (
          <PlaceMarker key={p.id} place={p} selected={p.id === selectedId} onPress={() => select(p.id)} />
        ))}
        {route && routePlace ? (
          <Polyline
            coordinates={route.points}
            strokeColor={route.kind === 'google' ? c.water : c.primary}
            strokeWidth={5}
            lineDashPattern={route.kind === 'google' ? undefined : [10, 8]}
          />
        ) : null}
      </MapView>

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
