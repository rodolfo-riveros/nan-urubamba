import { useColorScheme } from 'react-native';
import { useApp } from '@/lib/store';
import { dark, light, type Palette } from './colors';

export function useTheme(): { c: Palette; isDark: boolean } {
  const system = useColorScheme();
  const { themeMode } = useApp();
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && system === 'dark');
  return { c: isDark ? dark : light, isDark };
}

export * from './colors';
export * from './typography';
