import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import type { ScrollViewInstance } from 'react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPrompt, OfflineBanner, PlaceCard, PlaceRow } from '@/components/place';
import { Button, Chip, EmptyState, Icon, IconButton, SectionTitle, Segmented, T } from '@/components/ui';
import { CATEGORIES, difficultyOf, DISTRICTS, DURATIONS } from '@/data/catalog';
import { allPlaces, OFFICIAL_SOURCE } from '@/data/places';
import type { Category } from '@/data/types';
import { useCommunityPlaces } from '@/lib/community';
import { activeFilterCount, applyFilters, sortByDistance, suggestRelaxations } from '@/lib/filter';
import { distanceM } from '@/lib/geo';
import { useLocation } from '@/lib/location';
import { EMPTY_FILTERS, useApp } from '@/lib/store';
import { radius, useTheme } from '@/theme';

export default function Explore() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang, update, interests, filters, setFilters, userName, ratingFor } = useApp();
  const loc = useLocation();
  const scroll = useRef<ScrollViewInstance>(null);

  const toggleCat = (k: Category) =>
    update({ interests: interests.includes(k) ? interests.filter((x) => x !== k) : [...interests, k] });

  const community = useCommunityPlaces();
  const PLACES = useMemo(() => allPlaces(), [community]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => applyFilters(PLACES, interests, filters), [PLACES, interests, filters]);
  // Con GPS: todo ordenado por cercanía a tu posición actual
  const sorted = useMemo(
    () =>
      (loc.coords
        ? sortByDistance(results, loc.coords)
        : [...results].sort((a, b) => Number(!!a.estimated) - Number(!!b.estimated) || b.ratingCount - a.ratingCount)
      )
        // Lugares primero; fiestas y tradiciones al final
        .sort((a, b) => Number(a.kind === 'event') - Number(b.kind === 'event')),
    [results, loc.coords],
  );
  const near = useMemo(
    () => (loc.coords ? sortByDistance(results.filter((p) => p.kind === 'place'), loc.coords).slice(0, 6) : []),
    [results, loc.coords],
  );
  const nFilters = activeFilterCount(filters);
  const relax = useMemo(
    () => (results.length ? [] : suggestRelaxations(PLACES, interests, filters)),
    [PLACES, results, interests, filters],
  );
  const districtCounts = useMemo(
    () => DISTRICTS.map((d) => ({ d, n: PLACES.filter((p) => p.district === d).length })).filter((x) => x.n > 0),
    [PLACES],
  );
  // Imperdibles: los mejor valorados por la comunidad; si aún no hay reseñas, los lugares con ficha verificada
  const popular = useMemo(
    () =>
      PLACES.filter((p) => p.kind === 'place')
        .map((p) => ({ p, r: ratingFor(p) }))
        .sort((a, b) => b.r.count * b.r.rating - a.r.count * a.r.rating || Number(!!a.p.estimated) - Number(!!b.p.estimated))
        .slice(0, 4)
        .map((x) => x.p),
    [PLACES, ratingFor],
  );

  const dist = (p: (typeof PLACES)[number]) => (loc.coords ? distanceM(loc.coords, p.coords) : null);

  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...filters.difficulties.map((d) => ({
      key: d,
      label: L(difficultyOf(d).label),
      remove: () => setFilters({ ...filters, difficulties: filters.difficulties.filter((x) => x !== d) }),
    })),
    ...filters.durations.map((d) => ({
      key: d,
      label: L(DURATIONS.find((x) => x.key === d)!.label),
      remove: () => setFilters({ ...filters, durations: filters.durations.filter((x) => x !== d) }),
    })),
    ...filters.districts.map((d) => ({
      key: d,
      label: d,
      remove: () => setFilters({ ...filters, districts: filters.districts.filter((x) => x !== d) }),
    })),
    ...(filters.publicTransport
      ? [{ key: 'pt', label: t('publicTransport'), remove: () => setFilters({ ...filters, publicTransport: false }) }]
      : []),
    ...(filters.signal ? [{ key: 'sig', label: t('hasSignal'), remove: () => setFilters({ ...filters, signal: false }) }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top }}>
        <OfflineBanner />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Encabezado */}
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <T v="meta" color={c.textSec}>
              {t('greeting')}
            </T>
            <T v="h1">{t('whereToday')}</T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ES/EN"
            onPress={() => update({ lang: lang === 'es' ? 'en' : 'es' })}
            style={[styles.langBtn, { borderColor: c.border, backgroundColor: c.surface }]}
          >
            <T v="small" color={lang === 'es' ? c.primary : c.textSec}>
              ES
            </T>
            <T v="small" color={c.textSec}>
              /
            </T>
            <T v="small" color={lang === 'en' ? c.primary : c.textSec}>
              EN
            </T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tabProfile')}
            onPress={() => router.push('/profile')}
            style={[styles.avatar, { backgroundColor: c.secondary }]}
          >
            <T v="bodyStrong" color="#FFF">
              {(userName || 'V').charAt(0).toUpperCase()}
            </T>
          </Pressable>
        </View>

        {/* Categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={L(cat.label)}
              icon={cat.icon}
              selected={interests.includes(cat.key)}
              onPress={() => toggleCat(cat.key)}
            />
          ))}
        </ScrollView>

        {/* Conteo, filtros y vista */}
        <View style={[styles.rowPad, { marginTop: 4 }]}>
          <T v="meta" color={c.textSec} style={{ flex: 1 }}>
            {t('placesCount', { n: results.length })}
          </T>
          <View style={{ width: 150 }}>
            <Segmented
              options={[
                { key: 'list', label: t('list') },
                { key: 'map', label: t('map') },
              ]}
              value="list"
              onChange={(k) => k === 'map' && router.push('/map')}
            />
          </View>
          <View>
            <IconButton icon="tune-variant" label={t('filters')} onPress={() => router.push('/filters')} />
            {nFilters ? (
              <View style={[styles.dot, { backgroundColor: c.primary }]}>
                <T v="small" color="#FFF" style={{ fontSize: 11, lineHeight: 14 }}>
                  {nFilters}
                </T>
              </View>
            ) : null}
          </View>
        </View>

        {activeChips.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 4 }]}>
            {activeChips.map((ch) => (
              <Pressable
                key={ch.key}
                onPress={ch.remove}
                accessibilityLabel={t('removeX', { x: ch.label })}
                style={[styles.activeChip, { backgroundColor: c.primaryTint, borderColor: c.primary }]}
              >
                <T v="small" color={c.primary}>
                  {ch.label}
                </T>
                <Icon name="close" size={14} color={c.primary} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Ubicación */}
        <View style={styles.section}>
          {loc.status !== 'granted' || !loc.coords ? (
            loc.status !== 'granted' ? (
              <LocationPrompt onEnable={loc.request} onDistrict={() => scroll.current?.scrollTo({ y: 520, animated: true })} />
            ) : null
          ) : near.length ? (
            <>
              <SectionTitle title={t('closestToYou')} action={t('map')} onAction={() => router.push('/map')} />
              <T v="meta" color={c.textSec} style={{ marginTop: -8, marginBottom: 10 }}>
                {t('closestHint')}
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                {near.map((p) => (
                  <PlaceRow key={p.id} place={p} distance={dist(p)} width={280} />
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>

        {/* Resultados */}
        <View style={styles.section}>
          {results.length ? (
            <>
              <SectionTitle title={t('forYou')} />
              <View style={{ gap: 16 }}>
                {sorted.map((p) => (
                  <PlaceCard key={p.id} place={p} distance={dist(p)} />
                ))}
              </View>
            </>
          ) : (
            <EmptyState icon="map-search-outline" title={t('noResultsTitle')} text={t('noResultsText')}>
              <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 8 }}>
                {relax.map((r) => (
                  <Pressable
                    key={r.key}
                    onPress={() => setFilters(r.filters)}
                    style={[styles.relax, { borderColor: c.border, backgroundColor: c.surface }]}
                  >
                    <T v="bodyStrong" style={{ flex: 1 }}>
                      {r.label.kind === 'district'
                        ? t('removeX', { x: r.label.value! })
                        : r.label.kind === 'duration'
                          ? t('anyDuration')
                          : t('anyDifficulty')}
                    </T>
                    <T v="meta" color={c.textSec}>
                      {r.count === 1 ? t('onePlace') : t('nPlaces', { n: r.count })}
                    </T>
                    <Icon name="chevron-right" color={c.textSec} />
                  </Pressable>
                ))}
                <Button
                  label={t('clearAllFilters')}
                  onPress={() => {
                    setFilters(EMPTY_FILTERS);
                    update({ interests: [] });
                  }}
                  style={{ marginTop: 8 }}
                />
              </View>
            </EmptyState>
          )}
        </View>

        {/* Distritos */}
        <View style={styles.section}>
          <SectionTitle title={t('byDistrict')} />
          <View style={styles.districts}>
            {districtCounts.map(({ d, n }) => {
              const sel = filters.districts.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setFilters({ ...EMPTY_FILTERS, districts: sel ? [] : [d] });
                    scroll.current?.scrollTo({ y: 0, animated: true });
                  }}
                  style={[
                    styles.district,
                    { backgroundColor: sel ? c.secondary : c.surface, borderColor: sel ? c.secondary : c.border },
                  ]}
                >
                  <T v="bodyStrong" color={sel ? '#FFF' : c.text} numberOfLines={1} style={{ flex: 1 }}>
                    {d}
                  </T>
                  <T v="meta" color={sel ? '#FFF' : c.textSec}>
                    {n}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Popular */}
        <View style={styles.section}>
          <SectionTitle title={t('popular')} />
          <View style={{ gap: 10 }}>
            {popular.map((p) => (
              <PlaceRow key={p.id} place={p} distance={dist(p)} />
            ))}
          </View>
        </View>

        {/* Aportes de la comunidad */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push('/suggest')}
            style={[styles.stay, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }]}
            accessibilityRole="button"
          >
            <Icon name="map-marker-plus-outline" color={c.primary} size={28} />
            <View style={{ flex: 1 }}>
              <T v="h3">{t('suggestPlace')}</T>
              <T v="meta" color={c.textSec}>
                {t('suggestPlaceHint')}
              </T>
            </View>
            <Icon name="chevron-right" color={c.textSec} />
          </Pressable>
        </View>

        {/* Hoteles y restaurantes */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push('/nearby/all')}
            style={[styles.stay, { backgroundColor: c.secondary }]}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Icon name="bed" color="#FFF" size={26} />
              <Icon name="silverware-fork-knife" color="#FFF" size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h3" color="#FFF">
                {t('stayEat')}
              </T>
              <T v="meta" color="rgba(255,255,255,0.85)">
                {t('stayEatHint')}
              </T>
            </View>
            <Icon name="chevron-right" color="#FFF" />
          </Pressable>
        </View>
        <T v="small" color={c.textSec} style={{ marginTop: 16, paddingHorizontal: 16, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' }}>
          {t('dataCredit', { d: OFFICIAL_SOURCE.date })}
        </T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  langBtn: { flexDirection: 'row', gap: 2, paddingHorizontal: 10, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  rowPad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  dot: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 32, borderRadius: radius.pill, borderWidth: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  relax: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.input, borderWidth: 1 },
  districts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  district: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.input, borderWidth: 1 },
  stay: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.card },
});
