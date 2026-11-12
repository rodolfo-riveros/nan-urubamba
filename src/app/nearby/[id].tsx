import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image , FlatList, StyleSheet, View } from 'react-native';
import { IMAGES } from '@/data/images';
import MapView, { Marker } from 'react-native-maps';
import { BaseMapAttribution, BaseMapLayer, useBaseMapType } from '@/components/BaseMapLayer';
import { OfflineTileLayer, useOfflineMode } from '@/components/OfflineTileLayer';
import { Badge, Button, Chip, EmptyState, Header, Icon, Segmented, T } from '@/components/ui';
import { BUSINESSES, FOOD_TYPES, LODGING_TYPES } from '@/data/businesses';
import { getPlace, TOWNS } from '@/data/places';
import type { Business } from '@/data/types';
import { distanceM, formatDistance, openDirections, openWhatsApp } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { DARK_MAP_STYLE, MAP_PROVIDER } from '@/lib/maps';
import { useApp } from '@/lib/store';
import type { StringKey } from '@/lib/strings';
import { radius, useTheme } from '@/theme';

type Kind = 'lodging' | 'food';
const RADII = [2, 5, 15, 0]; // km; 0 = cualquiera

export default function Nearby() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = id !== 'all' ? getPlace(id) : undefined;
  const { c, isDark } = useTheme();
  const { t, L, lang } = useApp();
  const loc = useLocation();
  const [kind, setKind] = useState<Kind>('lodging');
  const { mapType: offlineMapType, offline } = useOfflineMode();
  const baseMapType = useBaseMapType('standard');
  const [price, setPrice] = useState<number[]>([]);
  const [radiusKm, setRadiusKm] = useState(place ? 5 : 0);

  const center = place?.coords ?? loc.coords ?? TOWNS.Urubamba;
  const title = place ? t('nearOf', { x: place.name }) : loc.coords ? t('nearMe') : t('stayEat');
  const subtitle = place ? t('andSurroundings', { x: place.district }) : 'Urubamba';

  const list = useMemo(() => {
    const types = kind === 'lodging' ? LODGING_TYPES : FOOD_TYPES;
    return BUSINESSES.filter((b) => types.includes(b.type))
      .map((b) => ({ b, d: distanceM(center, b.coords) }))
      .filter(({ b, d }) => (price.length ? price.includes(b.priceLevel) : true) && (radiusKm ? d <= radiusKm * 1000 : true))
      .sort((a, z) => a.d - z.d);
  }, [kind, price, radiusKm, center]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={title} subtitle={subtitle} />
      <FlatList
        data={list}
        keyExtractor={(x) => x.b.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View style={[styles.map, { borderColor: c.border }]}>
              <MapView
                provider={MAP_PROVIDER}
                style={StyleSheet.absoluteFill}
                region={{ ...center, latitudeDelta: radiusKm ? radiusKm / 45 : 0.3, longitudeDelta: radiusKm ? radiusKm / 45 : 0.3 }}
                customMapStyle={isDark ? DARK_MAP_STYLE : []}
                showsUserLocation={loc.status === 'granted'}
                toolbarEnabled={false}
                mapType={baseMapType === 'none' ? 'none' : offline ? offlineMapType : 'standard'}
              >
                <BaseMapLayer />
                <OfflineTileLayer provider={MAP_PROVIDER} />
                {place ? <Marker coordinate={place.coords} title={place.name} pinColor="#B5462B" /> : null}
                {list.map(({ b }) => (
                  <Marker key={b.id} coordinate={b.coords} title={b.name} pinColor={kind === 'lodging' ? '#2F5D50' : '#E3A33B'} />
                ))}
              </MapView>
              <BaseMapAttribution />
            </View>
            <Segmented
              options={[
                { key: 'lodging', label: t('lodging') },
                { key: 'food', label: t('restaurants') },
              ]}
              value={kind}
              onChange={setKind}
            />
            <View style={styles.wrap}>
              {[1, 2, 3].map((p) => (
                <Chip
                  key={p}
                  label={'S/'.repeat(p)}
                  selected={price.includes(p)}
                  onPress={() => setPrice(price.includes(p) ? price.filter((x) => x !== p) : [...price, p])}
                />
              ))}
            </View>
            <View style={styles.wrap}>
              {RADII.map((r) => (
                <Chip
                  key={r}
                  icon={r ? 'map-marker-radius' : undefined}
                  label={r ? t('within', { d: `${r} km` }) : t('anyDistance')}
                  selected={radiusKm === r}
                  onPress={() => setRadiusKm(r)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="store-search-outline" title={t('noBusinesses')} action={t('anyDistance')} onAction={() => setRadiusKm(0)} />
        }
        renderItem={({ item }) => <BusinessCard b={item.b} d={item.d} placeMode={!!place} />}
      />
    </View>
  );

  function BusinessCard({ b, d, placeMode }: { b: Business; d: number; placeMode: boolean }) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, padding: 0, overflow: 'hidden' }]}>
        {IMAGES[`biz-${b.id}`] ? (
          <View>
            <Image source={IMAGES[`biz-${b.id}`]} style={{ width: '100%', height: 140 }} resizeMode="cover" />
            <T v="small" color="#FFF" style={styles.imgCredit}>
              {lang === 'es' ? 'Imagen referencial' : 'Reference image'}
            </T>
          </View>
        ) : null}
        <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge
            label={t(`type_${b.type}` as StringKey).toUpperCase()}
            color={LODGING_TYPES.includes(b.type) ? c.secondary : '#8A5A0B'}
            icon={LODGING_TYPES.includes(b.type) ? 'bed' : 'silverware-fork-knife'}
          />
          {b.demo ? <Badge label={t('demoBadge')} color={c.textSec} /> : null}
        </View>
        <T v="h3">{b.name}</T>
        <T v="meta" color={c.textSec}>
          {'S/ '.repeat(b.priceLevel).trim()} · {placeMode ? t('fromPlace', { d: formatDistance(d, lang) }) : formatDistance(d, lang)} · {b.district}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="star" size={16} color={c.accent} />
          <T v="meta">
            {b.rating.toFixed(1)} · {L(b.highlight)}
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {b.phone ? (
            <Button
              small
              label={t('whatsapp')}
              icon="whatsapp"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => openWhatsApp(b.phone!, t('waMessage'))}
            />
          ) : null}
          <Button
            small
            label={t('howToGet')}
            icon="navigation-variant-outline"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => openDirections(b.coords, b.name)}
          />
        </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  map: { height: 170, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imgCredit: { position: 'absolute', right: 8, bottom: 6, fontSize: 10, lineHeight: 14, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, borderRadius: 6, overflow: 'hidden' },
  card: { padding: 14, borderRadius: radius.card, borderWidth: 1, gap: 6 },
});
