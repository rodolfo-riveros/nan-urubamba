import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineAttribution } from '@/components/OfflineTileLayer';
import { Button, Card, Header, Icon, T } from '@/components/ui';
import { PLACES } from '@/data/places';
import type { Place } from '@/data/types';
import {
  MAX_TILES_PER_ZONE,
  PROVINCE_ZONE,
  PROVINCE_ZONE_ID,
  cancelDownload,
  deleteZone,
  downloadPlaceZone,
  downloadProvinceZone,
  estimateBytes,
  formatBytes,
  placeZoneId,
  useOfflineZones,
  useZoneIdStatus,
  zoneForPlace,
  type DownloadResult,
} from '@/lib/offlineMaps';
import { useApp } from '@/lib/store';
import { radius, type as typo, useTheme } from '@/theme';

const S = {
  es: {
    title: 'Mapas sin conexión',
    used: 'Espacio usado',
    zones: (n: number) => (n === 1 ? '1 zona descargada' : `${n} zonas descargadas`),
    explainTitle: 'Descarga antes de salir',
    explain:
      'En muchos senderos no hay señal. El GPS de tu teléfono funciona sin internet, pero el mapa necesita estar guardado. Descarga la zona con wifi antes de ir.',
    province: 'Vista general de la provincia',
    provinceSub: 'Valle Sagrado y alrededores, poco detalle',
    places: 'Zonas por lugar',
    search: 'Buscar lugar…',
    download: 'Descargar zona',
    downloadProvince: 'Descargar provincia',
    downloaded: 'Descargado ✓',
    partial: 'Incompleto — reintentar',
    cancel: 'Cancelar',
    delete: 'Borrar',
    deleteQ: '¿Borrar esta zona?',
    deleteMsg: 'Se liberará el espacio. Podrás descargarla de nuevo cuando tengas conexión.',
    ok: 'Borrar',
    no: 'Cancelar',
    approx: (s: string) => `≈ ${s}`,
    failTitle: 'No se pudo completar',
    failMsg: (n: number) => `${n} partes del mapa no se descargaron. Revisa tu conexión e inténtalo de nuevo.`,
    tooLarge: `La zona es demasiado grande (máx. ${MAX_TILES_PER_ZONE} teselas).`,
    error: 'Error al descargar. Revisa tu conexión.',
    empty: 'No encontramos lugares con ese nombre.',
    here: 'Este lugar',
  },
  en: {
    title: 'Offline maps',
    used: 'Storage used',
    zones: (n: number) => (n === 1 ? '1 area downloaded' : `${n} areas downloaded`),
    explainTitle: 'Download before you go',
    explain:
      'Many trails have no signal. Your phone’s GPS works without internet, but the map must be saved first. Download the area on wifi before heading out.',
    province: 'Province overview',
    provinceSub: 'Sacred Valley and surroundings, low detail',
    places: 'Areas by place',
    search: 'Search place…',
    download: 'Download area',
    downloadProvince: 'Download province',
    downloaded: 'Downloaded ✓',
    partial: 'Incomplete — retry',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteQ: 'Delete this area?',
    deleteMsg: 'Space will be freed. You can download it again when you are online.',
    ok: 'Delete',
    no: 'Cancel',
    approx: (s: string) => `≈ ${s}`,
    failTitle: 'Could not finish',
    failMsg: (n: number) => `${n} map pieces were not downloaded. Check your connection and try again.`,
    tooLarge: `This area is too large (max ${MAX_TILES_PER_ZONE} tiles).`,
    error: 'Download failed. Check your connection.',
    empty: 'No places match that name.',
    here: 'This place',
  },
};
type Dict = (typeof S)['es'];

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function reportResult(r: DownloadResult, s: Dict) {
  if (r.status === 'partial') Alert.alert(s.failTitle, s.failMsg(r.failed));
  else if (r.status === 'too_large') Alert.alert(s.failTitle, s.tooLarge);
  else if (r.status === 'error') Alert.alert(s.failTitle, s.error);
}

export default function OfflineScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { lang } = useApp();
  const s = S[lang] ?? S.es;
  const params = useLocalSearchParams<{ place?: string }>();
  const highlightId = typeof params.place === 'string' ? params.place : undefined;
  const { zones, totalBytes } = useOfflineZones();
  const [query, setQuery] = useState('');

  const highlighted = useMemo(() => (highlightId ? PLACES.find((p) => p.id === highlightId) : undefined), [highlightId]);

  const list = useMemo(() => {
    const q = normalize(query.trim());
    return PLACES.filter((p) => p.id !== highlighted?.id && (!q || normalize(p.name).includes(q) || normalize(p.district).includes(q)));
  }, [query, highlighted]);

  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Card style={styles.storage}>
        <View style={[styles.storageIcon, { backgroundColor: c.secondaryTint }]}>
          <Icon name="harddisk" size={22} color={c.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="meta" color={c.textSec}>
            {s.used}
          </T>
          <T v="bodyStrong">{formatBytes(totalBytes)}</T>
        </View>
        <T v="small" color={c.textSec}>
          {s.zones(zones.length)}
        </T>
      </Card>

      <View style={[styles.explain, { backgroundColor: c.accentTint, borderLeftColor: c.accent }]}>
        <Icon name="crosshairs-gps" size={20} color={c.text} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="bodyStrong">{s.explainTitle}</T>
          <T v="meta">{s.explain}</T>
        </View>
      </View>

      <ProvinceRow s={s} />

      {highlighted ? (
        <View style={{ gap: 8 }}>
          <T v="small" color={c.primary}>
            {s.here.toUpperCase()}
          </T>
          <PlaceRow place={highlighted} s={s} highlighted />
        </View>
      ) : null}

      <T v="h3">{s.places}</T>
      <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Icon name="magnify" size={20} color={c.textSec} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={s.search}
          placeholderTextColor={c.textSec}
          style={[typo.body, { flex: 1, color: c.text, paddingVertical: 10 }]}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={s.search}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={s.title} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PlaceRow place={item} s={s} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <T color={c.textSec} style={{ textAlign: 'center', paddingVertical: 24 }}>
            {s.empty}
          </T>
        }
        ListFooterComponent={<OfflineAttribution onlyWithTiles={false} style={{ marginTop: 16 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
      />
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[styles.bar, { backgroundColor: c.border }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c.secondary, borderRadius: radius.pill }} />
    </View>
  );
}

function confirmDelete(s: Dict, zoneId: string) {
  Alert.alert(s.deleteQ, s.deleteMsg, [
    { text: s.no, style: 'cancel' },
    { text: s.ok, style: 'destructive', onPress: () => deleteZone(zoneId).catch(() => {}) },
  ]);
}

function ZoneActions({
  zoneId,
  bytesLabel,
  downloadLabel,
  onDownload,
  s,
}: {
  zoneId: string;
  bytesLabel: string;
  downloadLabel: string;
  onDownload: () => void;
  s: Dict;
}) {
  const { c } = useTheme();
  const { zones } = useOfflineZones();
  const status = useZoneIdStatus(zoneId);
  const meta = zones.find((z) => z.id === zoneId);

  if (status.downloading) {
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.rowBetween}>
          <T v="small" color={c.textSec}>
            {Math.round(status.progress * 100)}%
          </T>
          <Button small variant="ghost" label={s.cancel} onPress={() => cancelDownload(zoneId)} />
        </View>
        <ProgressBar value={status.progress} />
      </View>
    );
  }
  if (status.downloaded) {
    return (
      <View style={styles.rowBetween}>
        <T v="small" color={c.secondary}>
          {s.downloaded}
          {meta ? `  ·  ${formatBytes(meta.bytes)}` : ''}
        </T>
        <Button small variant="outline" icon="trash-can-outline" label={s.delete} onPress={() => confirmDelete(s, zoneId)} />
      </View>
    );
  }
  return (
    <View style={styles.rowBetween}>
      <T v="small" color={c.textSec}>
        {s.approx(bytesLabel)}
      </T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {meta ? (
          <Button small variant="ghost" icon="trash-can-outline" label={s.delete} onPress={() => confirmDelete(s, zoneId)} />
        ) : null}
        <Button small variant="secondary" icon="download" label={meta ? s.partial : downloadLabel} onPress={onDownload} />
      </View>
    </View>
  );
}

function ProvinceRow({ s }: { s: Dict }) {
  const { c } = useTheme();
  const bytesLabel = useMemo(() => formatBytes(estimateBytes(PROVINCE_ZONE)), []);
  const onDownload = useCallback(() => {
    downloadProvinceZone().done.then((r) => reportResult(r, s));
  }, [s]);
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <View style={[styles.placeIcon, { backgroundColor: c.primaryTint }]}>
          <Icon name="map-outline" size={20} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">{s.province}</T>
          <T v="meta" color={c.textSec}>
            {s.provinceSub}
          </T>
        </View>
      </View>
      <ZoneActions
        zoneId={PROVINCE_ZONE_ID}
        bytesLabel={bytesLabel}
        downloadLabel={s.downloadProvince}
        onDownload={onDownload}
        s={s}
      />
    </Card>
  );
}

function PlaceRow({ place, s, highlighted }: { place: Place; s: Dict; highlighted?: boolean }) {
  const { c } = useTheme();
  const bytesLabel = useMemo(() => formatBytes(estimateBytes(zoneForPlace(place))), [place]);
  const onDownload = useCallback(() => {
    downloadPlaceZone(place).done.then((r) => reportResult(r, s));
  }, [place, s]);
  return (
    <Card style={[styles.card, highlighted && { borderColor: c.primary, borderWidth: 2 }]}>
      <View style={styles.titleRow}>
        <View style={[styles.placeIcon, { backgroundColor: c.secondaryTint }]}>
          <Icon name="map-marker-radius-outline" size={20} color={c.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong" numberOfLines={1}>
            {place.name}
          </T>
          <T v="meta" color={c.textSec} numberOfLines={1}>
            {place.district}
            {place.origin?.name && place.origin.name !== place.district ? ` · ${place.origin.name}` : ''}
          </T>
        </View>
      </View>
      <ZoneActions
        zoneId={placeZoneId(place.id)}
        bytesLabel={bytesLabel}
        downloadLabel={s.download}
        onDownload={onDownload}
        s={s}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  storage: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  storageIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  explain: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.input, borderLeftWidth: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.input,
    borderWidth: 1,
  },
  card: { padding: 14, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bar: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
});
