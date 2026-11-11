import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { categoryOf } from '@/data/catalog';
import { COVERS } from '@/data/covers';
import type { Place, Review } from '@/data/types';
import { formatDistance } from '@/lib/geo';
import { useApp } from '@/lib/store';
import { categoryColors, radius, type, useTheme } from '@/theme';
import { Badge, Button, DifficultyBadge, Icon, Stars, T, TipBox } from './ui';

/** Foto del lugar; si no hay foto, un degradado con el icono de la categoría. */
export function PlaceImage({
  place,
  height = 180,
  rounded = true,
  style,
  showCaption = true,
}: {
  place: Place;
  height?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  showCaption?: boolean;
}) {
  const { t } = useApp();
  const cat = place.categories[0];
  const base = categoryColors[cat] ?? '#2F5D50';
  const r = rounded ? radius.card : 0;
  // 1) portada oficial empaquetada (funciona sin internet) 2) foto remota 3) degradado
  const bundled = place.official ? COVERS[place.official.code] : undefined;
  const remote = place.photos?.[0];
  const source = bundled ?? (remote ? { uri: remote } : undefined);
  const photo = !!source;
  return (
    <View style={[{ height, borderRadius: r, overflow: 'hidden', backgroundColor: base }, style]}>
      {source ? (
        <>
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
          {showCaption && place.official ? (
            <Text style={[type.small, styles.credit]}>{t('photoCredit')}</Text>
          ) : null}
        </>
      ) : (
        <LinearGradient
          colors={[base, shade(base, -35), '#1E1B18']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
        >
          <Icon name={categoryOf(cat).icon} size={Math.min(72, height / 2.6)} color="rgba(255,255,255,0.28)" />
          {/* "montañas" decorativas */}
          <View style={[styles.ridge, { borderBottomColor: 'rgba(255,255,255,0.08)', left: -40 }]} />
          <View style={[styles.ridge, { borderBottomColor: 'rgba(0,0,0,0.12)', left: 120, transform: [{ scale: 1.4 }] }]} />
        </LinearGradient>
      )}
      {!photo && showCaption ? (
        <Text style={[type.small, styles.caption]}>
          {t('photo')} · {place.name}
        </Text>
      ) : null}
    </View>
  );
}

function shade(hex: string, pct: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (v * pct) / 100)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function CategoryBadge({ place, solid }: { place: Place; solid?: boolean }) {
  const { L } = useApp();
  const cat = categoryOf(place.categories[0]);
  return <Badge label={L(cat.label).toUpperCase()} color={categoryColors[cat.key]} icon={cat.icon} solid={solid} />;
}

/** Tarjeta grande ("Para ti") */
export function PlaceCard({ place, distance }: { place: Place; distance?: number | null }) {
  const { c } = useTheme();
  const { L, ratingFor, lang, saved, toggleSaved, t } = useApp();
  const { rating, count } = ratingFor(place);
  const isSaved = saved.includes(place.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={place.name}
      onPress={() => router.push(`/place/${place.id}`)}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.92 : 1 }]}
    >
      <View>
        <PlaceImage place={place} height={170} rounded={false} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? t('saved') : t('save')}
          hitSlop={8}
          onPress={() => toggleSaved(place.id)}
          style={[styles.saveBtn, { backgroundColor: c.surface }]}
        >
          <Icon name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? c.primary : c.text} />
        </Pressable>
      </View>
      <View style={{ padding: 14, gap: 6 }}>
        <View style={styles.rowBetween}>
          <CategoryBadge place={place} />
          {count ? (
            <View style={styles.row}>
              <Icon name="star" size={16} color={c.accent} />
              <T v="bodyStrong">{rating.toFixed(1)}</T>
              <T v="meta" color={c.textSec}>
                ({count})
              </T>
            </View>
          ) : (
            <T v="small" color={c.textSec}>
              {t('noRatingYet')}
            </T>
          )}
        </View>
        <T v="h3">{place.name}</T>
        <T v="meta" color={c.textSec} numberOfLines={2}>
          {place.district} · {L(place.summary)}
        </T>
        <View style={[styles.row, { gap: 12, marginTop: 4, flexWrap: 'wrap' }]}>
          {place.kind === 'event' ? (
            <Meta icon="calendar-star" text={t('event')} />
          ) : (
            <>
              <DifficultyBadge value={place.difficulty} />
              <Meta icon="clock-outline" text={`${place.durationHours} h`} />
            </>
          )}
          {distance != null ? (
            <Meta icon="map-marker-distance" text={formatDistance(distance, lang)} />
          ) : (
            <Meta icon="map-marker-path" text={formatDistance(place.routeKm * 1000, lang)} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      <Icon name={icon} size={16} color={c.textSec} />
      <T v="meta" color={c.textSec}>
        {text}
      </T>
    </View>
  );
}

/** Tarjeta horizontal compacta ("Cerca de ti", Guardados) */
export function PlaceRow({
  place,
  distance,
  right,
  width,
}: {
  place: Place;
  distance?: number | null;
  right?: React.ReactNode;
  width?: number;
}) {
  const { c } = useTheme();
  const { lang, ratingFor } = useApp();
  const { rating, count } = ratingFor(place);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={place.name}
      onPress={() => router.push(`/place/${place.id}`)}
      style={({ pressed }) => [
        styles.rowCard,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.92 : 1 },
        width ? { width } : null,
      ]}
    >
      <PlaceImage place={place} height={76} style={{ width: 76, borderRadius: 14 }} showCaption={false} />
      <View style={{ flex: 1, gap: 4 }}>
        <CategoryBadge place={place} />
        <T v="bodyStrong" numberOfLines={1}>
          {place.name}
        </T>
        <T v="meta" color={c.textSec} numberOfLines={1}>
          {distance != null ? `${formatDistance(distance, lang)} · ` : `${place.district} · `}
          {place.kind === 'event' ? place.official?.subtype : `${place.durationHours} h`}
          {count ? ` · ★ ${rating.toFixed(1)}` : ''}
        </T>
      </View>
      {right}
    </Pressable>
  );
}

export function QuickFact({ label, value, hint, icon, color }: { label: string; value: string; hint?: string; icon: string; color?: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.row}>
        <Icon name={icon} size={16} color={color ?? c.textSec} />
        <T v="small" color={c.textSec}>
          {label}
        </T>
      </View>
      <T v="bodyStrong">{value}</T>
      {hint ? (
        <T v="small" color={c.textSec} style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

function monthLabel(ym: string, lang: 'es' | 'en') {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { month: 'long', year: 'numeric' });
}

export function ReviewItem({ review, onDelete, onReport }: { review: Review; onDelete?: () => void; onReport?: () => void }) {
  const { c } = useTheme();
  const { t, lang } = useApp();
  const initials = review.author
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const foreign = review.lang !== lang;
  const translate = () => {
    const text = [review.text, review.tip].filter(Boolean).join('\n\n');
    Linking.openURL(
      `https://translate.google.com/?sl=${review.lang}&tl=${lang}&op=translate&text=${encodeURIComponent(text)}`,
    );
  };
  return (
    <View style={[styles.review, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={[styles.row, { gap: 10 }]}>
        <View style={[styles.avatar, { backgroundColor: review.mine ? c.primary : c.secondaryTint }]}>
          <Text style={[type.small, { color: review.mine ? '#FFF' : c.secondary }]}>{initials || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">
            {review.author}
            {review.mine ? ` · ${t('you')}` : ''}
          </T>
          <T v="meta" color={c.textSec}>
            {review.country} · {t('visitedOn', { d: monthLabel(review.visitedAt, lang) })}
          </T>
        </View>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel={t('delete')}>
            <Icon name="trash-can-outline" size={20} color={c.textSec} />
          </Pressable>
        ) : null}
        {onReport ? (
          <Pressable onPress={onReport} hitSlop={10} accessibilityLabel={t('report')}>
            <Icon name="flag-outline" size={20} color={c.textSec} />
          </Pressable>
        ) : null}
      </View>
      <Stars value={review.rating} />
      <T>{review.text}</T>
      {review.tip ? <TipBox label={t('tipNext')} text={review.tip} /> : null}
      {review.photos?.length ? (
        <View style={[styles.row, { gap: 8 }]}>
          {review.photos.map((u) => (
            <Image key={u} source={{ uri: u }} style={{ width: 72, height: 72, borderRadius: 10 }} />
          ))}
        </View>
      ) : null}
      {foreign ? (
        <Pressable onPress={translate} style={styles.row} hitSlop={8}>
          <Icon name="translate" size={16} color={c.primary} />
          <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            {t('translate')}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Aviso "Sin conexión" — escucha el estado de red */
export function OfflineBanner() {
  const { c } = useTheme();
  const { t } = useApp();
  const [offline, setOffline] = useState(false);
  useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        setOffline(s.isConnected === false || s.isInternetReachable === false);
      }),
    [],
  );
  if (!offline) return null;
  return (
    <View style={[styles.offline, { backgroundColor: c.text }]}>
      <Icon name="wifi-off" size={18} color={c.bg} />
      <T v="meta" color={c.bg} style={{ flex: 1 }}>
        {t('offline')}
      </T>
      <Pressable onPress={() => NetInfo.refresh()} hitSlop={10}>
        <T v="meta" color={c.accent} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
          {t('retry')}
        </T>
      </Pressable>
    </View>
  );
}

export function RatingSummary({ rating, count, reviews }: { rating: number; count: number; reviews: Review[] }) {
  const { c } = useTheme();
  const { t } = useApp();
  // Distribución aproximada: reseñas visibles + resto concentrado alrededor de la media
  const dist = [5, 4, 3, 2, 1].map((s) => {
    const local = reviews.filter((r) => r.rating === s).length;
    const rest = Math.max(0, count - reviews.length);
    const w = Math.max(0, 1 - Math.abs(rating - s) / 1.6);
    return { s, n: local + Math.round(rest * w * 0.6) };
  });
  const max = Math.max(1, ...dist.map((d) => d.n));
  return (
    <View style={[styles.row, { gap: 18, alignItems: 'center' }]}>
      <View style={{ alignItems: 'center' }}>
        <T v="h1">{rating.toFixed(1)}</T>
        <Stars value={rating} size={14} />
        <T v="meta" color={c.textSec}>
          {t('reviewsN', { n: count })}
        </T>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        {dist.map((d) => (
          <View key={d.s} style={[styles.row, { gap: 8 }]}>
            <T v="small" color={c.textSec} style={{ width: 10 }}>
              {d.s}
            </T>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.border }}>
              <View style={{ width: `${(d.n / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LocationPrompt({ onEnable, onDistrict }: { onEnable: () => void; onDistrict?: () => void }) {
  const { c } = useTheme();
  const { t } = useApp();
  return (
    <View style={[styles.locPrompt, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-start' }]}>
        <View style={[styles.avatar, { backgroundColor: c.primaryTint, width: 40, height: 40, borderRadius: 20 }]}>
          <Icon name="crosshairs-gps" size={20} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">{t('noLocationTitle')}</T>
          <T v="meta" color={c.textSec}>
            {t('noLocationText')}
          </T>
        </View>
      </View>
      <View style={[styles.row, { gap: 8 }]}>
        <Button label={t('enableLocation')} onPress={onEnable} small style={{ flex: 1 }} />
        {onDistrict ? <Button label={t('chooseDistrict')} onPress={onDistrict} small variant="outline" style={{ flex: 1 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  saveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.card, borderWidth: 1 },
  fact: { flex: 1, minWidth: '45%', padding: 12, borderRadius: radius.input, borderWidth: 1, gap: 2 },
  review: { padding: 14, borderRadius: radius.card, borderWidth: 1, gap: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  caption: { position: 'absolute', left: 12, bottom: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6 },
  credit: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    color: '#FFF',
    fontSize: 10,
    lineHeight: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ridge: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 140,
    borderRightWidth: 140,
    borderBottomWidth: 90,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  locPrompt: { padding: 14, borderRadius: radius.card, borderWidth: 1, gap: 12 },
});
