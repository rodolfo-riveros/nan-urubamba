import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { useApp } from '@/lib/store';
import { fonts, useTheme } from '@/theme';

export default function TabsLayout() {
  const { c } = useTheme();
  const { t, onboarded } = useApp();
  const insets = useSafeAreaInsets();

  if (!onboarded) return <Redirect href="/onboarding" />;

  const icon = (name: string, outline: string) =>
    function TabIcon({ focused, color }: { focused: boolean; color: import('react-native').ColorValue }) {
      return <Icon name={focused ? name : outline} color={String(color)} size={24} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSec,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabExplore'), tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen name="map" options={{ title: t('tabMap'), tabBarIcon: icon('map', 'map-outline') }} />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('tabCamera'),
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                marginTop: -18,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: c.surface,
                opacity: focused ? 0.9 : 1,
              }}
            >
              <Icon name="camera-iris" color="#FFF" size={26} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="saved" options={{ title: t('tabSaved'), tabBarIcon: icon('bookmark', 'bookmark-outline') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabProfile'), tabBarIcon: icon('account-circle', 'account-circle-outline') }}
      />
    </Tabs>
  );
}
