import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Icon, T } from '@/components/ui';
import { DIFFICULTIES, DISTRICTS, DURATIONS } from '@/data/catalog';
import { PLACES } from '@/data/places';
import { applyFilters } from '@/lib/filter';
import { EMPTY_FILTERS, useApp, type Filters } from '@/lib/store';
import { difficultyColors, useTheme } from '@/theme';

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function FiltersScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, filters, setFilters, interests } = useApp();
  const [f, setF] = useState<Filters>(filters);
  const count = useMemo(() => applyFilters(PLACES, interests, f).length, [f, interests]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top > 30 ? 12 : insets.top + 12 }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('close')}>
          <Icon name="close" size={26} />
        </Pressable>
        <T v="h3" style={{ flex: 1, textAlign: 'center' }}>
          {t('filters')}
        </T>
        <Pressable onPress={() => setF(EMPTY_FILTERS)} hitSlop={12}>
          <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            {t('clear')}
          </T>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <View style={{ gap: 12 }}>
          <T v="h3">{t('difficulty')}</T>
          <View style={styles.wrap}>
            {DIFFICULTIES.map((d) => (
              <Chip
                key={d.key}
                label={L(d.label)}
                icon={difficultyColors[d.key].icon}
                color={difficultyColors[d.key].base}
                selected={f.difficulties.includes(d.key)}
                onPress={() => setF({ ...f, difficulties: toggle(f.difficulties, d.key) })}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <T v="h3">{t('totalDuration')}</T>
          <View style={styles.wrap}>
            {DURATIONS.map((d) => (
              <Chip
                key={d.key}
                label={L(d.label)}
                selected={f.durations.includes(d.key)}
                onPress={() => setF({ ...f, durations: toggle(f.durations, d.key) })}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <T v="h3">{t('district')}</T>
          <View style={styles.wrap}>
            {DISTRICTS.map((d) => (
              <Chip key={d} label={d} selected={f.districts.includes(d)} onPress={() => setF({ ...f, districts: toggle(f.districts, d) })} />
            ))}
          </View>
        </View>

        <View style={[styles.switchRow, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Icon name="bus" color={c.secondary} />
          <T v="bodyStrong" style={{ flex: 1 }}>
            {t('publicTransport')}
          </T>
          <Switch
            value={f.publicTransport}
            onValueChange={(v) => setF({ ...f, publicTransport: v })}
            trackColor={{ true: c.secondary, false: c.border }}
            thumbColor="#FFF"
          />
        </View>
        <View style={[styles.switchRow, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Icon name="signal-cellular-2" color={c.secondary} />
          <T v="bodyStrong" style={{ flex: 1 }}>
            {t('hasSignal')}
          </T>
          <Switch
            value={f.signal}
            onValueChange={(v) => setF({ ...f, signal: v })}
            trackColor={{ true: c.secondary, false: c.border }}
            thumbColor="#FFF"
          />
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button
          label={t('seeNPlaces', { n: count })}
          onPress={() => {
            setFilters(f);
            router.back();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
});
