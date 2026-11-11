import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

function hasIosKey() {
  const plugins = (Constants.expoConfig?.plugins ?? []) as unknown[];
  for (const p of plugins) {
    if (Array.isArray(p) && p[0] === 'react-native-maps') {
      return !!(p[1] as { iosGoogleMapsApiKey?: string })?.iosGoogleMapsApiKey;
    }
  }
  return false;
}

/**
 * Android usa siempre Google Maps.
 * iOS usa Google Maps en builds propios con API key; en Expo Go cae a Apple Maps.
 */
export const MAP_PROVIDER =
  Platform.OS === 'android'
    ? PROVIDER_GOOGLE
    : Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && hasIosKey()
      ? PROVIDER_GOOGLE
      : PROVIDER_DEFAULT;

// Estilo oscuro para Google Maps
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1f1b18' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b3aaa1' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141210' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#332d28' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1d3442' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#24201c' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#221e1a' }] },
];
