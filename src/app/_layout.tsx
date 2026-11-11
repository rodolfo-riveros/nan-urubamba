import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCommunity } from '@/lib/community';
import { LocationProvider } from '@/lib/location';
import { AppProvider, useApp } from '@/lib/store';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready } = useApp();
  const { c, isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    ...MaterialCommunityIcons.font,
  });
  const loaded = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Sincronización de aportes de la comunidad (cola sin conexión + caché)
  useEffect(() => {
    initCommunity();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="filters" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="review/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <LocationProvider>
          <Root />
        </LocationProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
