import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { AppMap } from '@/components/AppMap';
import { Badge, Button, Chip, EmptyState, Header, Icon, Segmented, T } from '@/components/ui';
import { BUSINESSES, FOOD_TYPES, LODGING_TYPES } from '@/data/businesses';
import { IMAGES } from '@/data/images';
import { getPlace, TOWNS } from '@/data/places';
import type { Business } from '@/data/types';
import { distanceM, formatDistance, openDirections, openWhatsApp } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { useApp } from '@/lib/store';
import type { StringKey } from '@/lib/strings';
import { radius, useTheme } from '@/theme';

type Kind = 'lodging' | 'food';
const RADII = [2, 5, 15, 0]; // km; 0 = cualquiera

export default function Nearby() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = id !== 'all' ? getPlace(id) : undefined;
  const { c } = useTheme();
  const { t, L, lang } = useApp();
  const loc = useLocation();
  const [kind, setKind] = useState<Kind>('lodging');
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
              <AppMap
                initialRegion={{ ...center, latitudeDelta: radiusKm ? radiusKm / 45 : 0.3 }}
                region={{ ...center, latitudeDelta: radiusKm ? radiusKm / 45 : 0.3 }}
                userLocation={loc.status === 'granted' ? loc.coords : null}
                markers={[
                  ...(place ? [{ id: 'place', coords: place.coords, color: '#B5462B', title: place.name }] : []),
                  ...list.map(({ b }) => ({
                    id: b.id,
                    coords: b.coords,
                    color: kind === 'lodging' ? '#2F5D50' : '#E3A33B',
                    icon: kind === 'lodging' ? 'bed' : 'silverware-fork-knife',
                    title: b.name,
                  })),
                ]}
              />
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
