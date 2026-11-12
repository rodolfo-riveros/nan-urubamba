import { useNetInfo } from '@react-native-community/netinfo';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { UrlTile, type MapType } from 'react-native-maps';
import { useTheme } from '@/theme';

/**
 * Mapa base libre (sin API key) para el prototipo.
 * Android sin key de Google → se dibuja este mapa (CARTO Voyager, datos © OpenStreetMap).
 * Cada tesela vista se guarda en el teléfono: las zonas que ya recorriste siguen
 * viéndose sin internet (offlineMode usa solo la caché).
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { hasGoogleMapsKey?: boolean };
// En Expo Go el mapa de Google ya funciona (Expo Go trae su propia key): no hace falta el mapa libre.
const IN_EXPO_GO = isRunningInExpoGo();
// EXPO_PUBLIC_FORCE_LEAFLET=1 fuerza el mapa Leaflet (para probarlo en Expo Go)
export const USE_FREE_BASEMAP =
  process.env.EXPO_PUBLIC_FORCE_LEAFLET === '1' || (Platform.OS === 'android' && !IN_EXPO_GO && !extra.hasGoogleMapsKey);

const LIGHT = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const DARK = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

function cachePath(dark: boolean) {
  try {
    return `${Paths.document.uri}basemap-${dark ? 'dark' : 'light'}`;
  } catch {
    return undefined;
  }
}

export function BaseMapLayer() {
  const { isDark } = useTheme();
  const net = useNetInfo();
  if (!USE_FREE_BASEMAP) return null;
  const offline = net.isConnected === false || net.isInternetReachable === false;
  return (
    <UrlTile
      urlTemplate={isDark ? DARK : LIGHT}
      tileSize={256}
      maximumZ={19}
      zIndex={-2}
      tileCachePath={cachePath(isDark)}
      tileCacheMaxAge={60 * 60 * 24 * 30}
      offlineMode={offline}
    />
  );
}

/** Tipo de mapa a usar: 'none' cuando el mapa base es el libre */
export function useBaseMapType(preferred: MapType = 'terrain'): MapType {
  return USE_FREE_BASEMAP ? 'none' : preferred;
}

export function BaseMapAttribution({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c, isDark } = useTheme();
  if (!USE_FREE_BASEMAP) return null;
  return (
    <View pointerEvents="none" style={[styles.attr, { backgroundColor: isDark ? 'rgba(20,18,16,0.7)' : 'rgba(255,255,255,0.8)' }, style]}>
      <Text style={[styles.text, { color: c.textSec }]}>© Esri</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  attr: { position: 'absolute', right: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  text: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' },
});
