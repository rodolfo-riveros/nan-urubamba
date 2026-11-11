import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { difficultyOf } from '@/data/catalog';
import type { Difficulty } from '@/data/types';
import { useApp } from '@/lib/store';
import { difficultyColors, radius, TOUCH, type, useTheme } from '@/theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 22, color, style }: { name: string; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const { c } = useTheme();
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color ?? c.text} style={style} />;
}

type Variant = keyof typeof type;
export function T({
  v = 'body',
  color,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string }) {
  const { c } = useTheme();
  return <Text {...rest} style={[type[v], { color: color ?? c.text }, style]} />;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const { c } = useTheme();
  const bg =
    disabled ? c.border : variant === 'primary' ? c.primary : variant === 'secondary' ? c.secondary : 'transparent';
  const fg =
    disabled ? c.textSec : variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : variant === 'outline' ? c.text : c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && { minHeight: 40, paddingHorizontal: 14 },
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1.5, borderColor: c.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 18 : 20} color={fg} /> : null}
          <Text style={[type.button, small && { fontSize: 15 }, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  color,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const active = color ?? c.secondary;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? active : c.surface,
          borderColor: selected ? active : c.border,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={selected ? '#FFF' : c.text} /> : null}
      <Text style={[type.meta, { color: selected ? '#FFF' : c.text, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>{label}</Text>
      {selected ? <Icon name="check" size={16} color="#FFF" /> : null}
    </Pressable>
  );
}

export function DifficultyBadge({ value, size = 'm' }: { value: Difficulty; size?: 's' | 'm' }) {
  const { L } = useApp();
  const { isDark } = useTheme();
  const d = difficultyColors[value];
  return (
    <View style={[styles.badge, { backgroundColor: isDark ? d.base + '33' : d.tint }, size === 's' && { paddingVertical: 2 }]}>
      <Icon name={d.icon} size={14} color={d.base} />
      <Text style={[type.small, { color: isDark ? '#F4EFE9' : d.text }]}>{L(difficultyOf(value).label)}</Text>
    </View>
  );
}

export function Badge({ label, color, icon, solid }: { label: string; color: string; icon?: string; solid?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: solid ? color : color + '22' }]}>
      {icon ? <Icon name={icon} size={13} color={solid ? '#FFF' : color} /> : null}
      <Text style={[type.small, { color: solid ? '#FFF' : color, letterSpacing: 0.4 }]}>{label}</Text>
    </View>
  );
}

export function Stars({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (n: number) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: onChange ? 6 : 1 }} accessibilityLabel={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline';
        const star = <Icon key={i} name={name} size={size} color={value >= i - 0.5 ? c.accent : c.border} />;
        if (!onChange) return star;
        return (
          <Pressable
            key={i}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${i}`}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(i);
            }}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <T v="h3">{title}</T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <T v="meta" color={c.primary} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
  bg,
  size = 22,
}: {
  icon: string;
  onPress: () => void;
  label: string;
  color?: string;
  bg?: string;
  size?: number;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: bg ?? c.surface, borderColor: bg ? 'transparent' : c.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon name={icon} size={size} color={color ?? c.text} />
    </Pressable>
  );
}

export function Header({ title, subtitle, right }: { title?: string; subtitle?: string; right?: React.ReactNode }) {
  const { c } = useTheme();
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.bg, borderBottomColor: c.border }]}>
      <IconButton icon="chevron-left" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={{ flex: 1 }}>
        {title ? (
          <T v="h3" numberOfLines={1}>
            {title}
          </T>
        ) : null}
        {subtitle ? (
          <T v="meta" color={c.textSec} numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  onAction,
  children,
}: {
  icon: string;
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, gap: 10 }}>
      <View style={[styles.emptyIcon, { backgroundColor: c.primaryTint }]}>
        <Icon name={icon} size={32} color={c.primary} />
      </View>
      <T v="h3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {text ? (
        <T color={c.textSec} style={{ textAlign: 'center' }}>
          {text}
        </T>
      ) : null}
      {children}
      {action ? <Button label={action} onPress={onAction} style={{ alignSelf: 'stretch', marginTop: 8 }} /> : null}
    </View>
  );
}

export function TipBox({ label, text }: { label: string; text: string }) {
  const { c, isDark } = useTheme();
  return (
    <View style={[styles.tip, { backgroundColor: c.accentTint, borderLeftColor: c.accent }]}>
      <Icon name="lightbulb-on-outline" size={18} color={isDark ? c.accent : '#8A5A0B'} />
      <Text style={[type.meta, { color: c.text, flex: 1 }]}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{label} </Text>
        {text}
      </Text>
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: c.border + '88' }]}>
      {options.map((o) => {
        const sel = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            onPress={() => onChange(o.key)}
            style={[styles.segmentItem, sel && { backgroundColor: c.surface }]}
          >
            <Text style={[type.meta, { color: sel ? c.text : c.textSec, fontFamily: 'PlusJakartaSans_700Bold' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: TOUCH + 4,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.badge,
    alignSelf: 'flex-start',
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: {
    width: TOUCH - 4,
    height: TOUCH - 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.input, borderLeftWidth: 4, alignItems: 'flex-start' },
  segment: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  segmentItem: { flex: 1, minHeight: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
});
