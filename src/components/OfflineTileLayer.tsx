import { useNetInfo } from '@react-native-community/netinfo';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LocalTile, PROVIDER_GOOGLE, UrlTile, type MapType, type Provider } from 'react-native-maps';
import {
  TILE_ATTRIBUTION,
  TILES_PATH_TEMPLATE,
  TILES_URL_TEMPLATE,
  useOfflineZones,
} from '@/lib/offlineMaps';
import { MAP_PROVIDER } from '@/lib/maps';
import { useTheme } from '@/theme';

/**
 * Capa de teselas descargadas. Va DENTRO de <MapView>. Se dibuja debajo de los
 * marcadores, así que el mapa sigue siendo útil sin conexión.
 *
 * - Android (Google) e iOS (Apple Maps): <LocalTile> con ruta de archivo.
 * - iOS + Google Maps: react-native-maps no tiene LocalTile nativo para Google
 *   en iOS, así que se usa <UrlTile> con URL file:// (mejor esfuerzo).
 */
export function OfflineTileLayer({
  provider = MAP_PROVIDER,
  onlyWhenOffline = false,
  zIndex = -1,
}: {
  /** Debe coincidir con el `provider` del MapView */
  provider?: Provider;
  /** Si true, solo se dibuja cuando no hay internet (por defecto siempre, en las zonas descargadas) */
  onlyWhenOffline?: boolean;
  zIndex?: number;
}) {
  const { zones } = useOfflineZones();
  const { offline } = useOfflineMode();
  if (!TILES_PATH_TEMPLATE || zones.length === 0) return null;
  if (onlyWhenOffline && !offline) return null;

  if (Platform.OS === 'ios' && provider === PROVIDER_GOOGLE) {
    return <UrlTile urlTemplate={TILES_URL_TEMPLATE} tileSize={256} zIndex={zIndex} maximumZ={16} />;
  }
  return <LocalTile pathTemplate={TILES_PATH_TEMPLATE} tileSize={256} zIndex={zIndex} />;
}

/**
 * Estado de conexión.
 * - offline: no hay internet (sin red o red sin salida a internet).
 * - hasTiles: hay al menos una zona descargada.
 * - mapType: 'none' cuando estamos offline y hay teselas (el mapa base de
 *   Google no carga sin conexión; así se ven limpias las teselas guardadas),
 *   si no 'standard'.
 */
export function useOfflineMode(): { offline: boolean; hasTiles: boolean; mapType: MapType } {
  const net = useNetInfo();
  const { zones } = useOfflineZones();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  const hasTiles = zones.length > 0;
  return { offline, hasTiles, mapType: offline && hasTiles ? 'none' : 'standard' };
}

/** Crédito obligatorio de OpenTopoMap / OpenStreetMap (CC-BY-SA). */
export function OfflineAttribution({ style, onlyWithTiles = true }: { style?: StyleProp<ViewStyle>; onlyWithTiles?: boolean }) {
  const { c, isDark } = useTheme();
  const { zones } = useOfflineZones();
  if (onlyWithTiles && zones.length === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.attr, { backgroundColor: isDark ? 'rgba(20,18,16,0.7)' : 'rgba(255,255,255,0.75)' }, style]}
    >
      <Text style={[styles.attrText, { color: c.textSec }]} numberOfLines={1}>
        {TILE_ATTRIBUTION}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  attr: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  attrText: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' },
});
