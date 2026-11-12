import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, Icon, Segmented, T } from '@/components/ui';
import { CATEGORIES } from '@/data/catalog';
import CREDITS from '@/data/imageCredits.json';
import { OFFICIAL_SOURCE } from '@/data/places';
import { useMyCommunityReviews, useOutboxCount } from '@/lib/community';
import { useLocation } from '@/lib/location';
import { useApp, type ThemeMode } from '@/lib/store';
import { fonts, radius, useTheme } from '@/theme';

export default function Profile() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const { t, L, lang, update, themeMode, visited, saved, userName, userCountry, since, interests } = app;
  const myReviews = useMyCommunityReviews();
  const pending = useOutboxCount();
  const loc = useLocation();
  const [cam] = useCameraPermissions();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [country, setCountry] = useState(userCountry);
  const [showAbout, setShowAbout] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const sinceLabel = new Date(since).toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { month: 'short', year: 'numeric' });

  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.bg, fontFamily: fonts.regular }];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Usuario */}
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={[styles.avatar, { backgroundColor: c.secondary }]}>
            <T v="h2" color="#FFF">
              {(userName || 'V').charAt(0).toUpperCase()}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            {editing ? (
              <View style={{ gap: 8 }}>
                <TextInput value={name} onChangeText={setName} placeholder={t('yourName')} placeholderTextColor={c.textSec} style={input} />
                <TextInput value={country} onChangeText={setCountry} placeholder={t('yourCountry')} placeholderTextColor={c.textSec} style={input} />
              </View>
            ) : (
              <>
                <T v="h3">{userName || t('yourName')}</T>
                <T v="meta" color={c.textSec}>
                  {t('travellerSince', { c: userCountry, d: sinceLabel })}
                </T>
              </>
            )}
          </View>
          <Pressable
            hitSlop={10}
            onPress={() => {
              if (editing) update({ userName: name.trim(), userCountry: country.trim() });
              setEditing(!editing);
            }}
          >
            <T v="meta" color={c.primary} style={{ fontFamily: fonts.bold }}>
              {editing ? t('done') : t('edit')}
            </T>
          </Pressable>
        </View>
        <View style={styles.stats}>
          <Stat n={visited.length} label={t('visitedN')} />
          <Stat n={myReviews.length} label={t('myReviews')} onPress={() => router.navigate('/saved')} />
          <Stat n={saved.length} label={t('savedN')} onPress={() => router.navigate('/saved')} />
        </View>
      </View>

      {pending ? (
        <View style={[styles.card, { backgroundColor: c.accentTint, borderColor: c.accent, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <Icon name="cloud-upload-outline" color={c.text} />
          <T v="meta" style={{ flex: 1 }}>
            {t('pendingUploads', { n: pending })}
          </T>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, gap: 0, padding: 0 }]}>
        <Row icon="map-marker-plus-outline" label={t('suggestPlace')} sub={t('suggestPlaceHint')} onPress={() => router.push('/suggest')} />
        <Row icon="cloud-download-outline" label={t('offlineMaps')} sub={t('offlineMapsHint')} onPress={() => router.push('/offline')} last />
      </View>
      <T v="small" color={c.textSec} style={{ textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' }}>
        {t('localOnly')}
      </T>

      <T v="small" color={c.textSec} style={{ letterSpacing: 1 }}>
        {t('settings')}
      </T>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, gap: 0, padding: 0 }]}>
        <Row icon="translate" label={t('language')}>
          <View style={{ width: 150 }}>
            <Segmented
              options={[
                { key: 'es', label: 'ES' },
                { key: 'en', label: 'EN' },
              ]}
              value={lang}
              onChange={(l) => update({ lang: l })}
            />
          </View>
        </Row>
        <Row icon="theme-light-dark" label={t('appearance')} vertical>
          <Segmented<ThemeMode>
            options={[
              { key: 'light', label: t('light') },
              { key: 'dark', label: t('darkM') },
              { key: 'auto', label: t('auto') },
            ]}
            value={themeMode}
            onChange={(m) => update({ themeMode: m })}
          />
        </Row>
        <Row icon="heart-outline" label={t('interests')} vertical>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={L(cat.label)}
                icon={cat.icon}
                selected={interests.includes(cat.key)}
                onPress={() =>
                  update({ interests: interests.includes(cat.key) ? interests.filter((x) => x !== cat.key) : [...interests, cat.key] })
                }
              />
            ))}
          </View>
        </Row>
        <Row
          icon="shield-check-outline"
          label={t('permissions')}
          sub={`${t('location')}: ${loc.status === 'granted' ? t('allowed') : t('denied')} · ${t('camera')}: ${cam?.granted ? t('allowed') : t('denied')}`}
          onPress={() => Linking.openSettings()}
        />
        <Row icon="presentation" label={t('demoData')} sub={t('demoDataHint')}>
          <Switch
            value={app.demoMode}
            onValueChange={(v) => update({ demoMode: v })}
            trackColor={{ true: c.secondary, false: c.border }}
            thumbColor="#FFF"
          />
        </Row>
        <Row icon="image-multiple-outline" label={t('credits')} onPress={() => setShowCredits(!showCredits)}>
          <Icon name={showCredits ? 'chevron-up' : 'chevron-down'} color={c.textSec} />
        </Row>
        {showCredits ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 6 }}>
            <T v="small" color={c.textSec}>
              {t('dataCredit', { d: OFFICIAL_SOURCE.date })} {t('photoCredit')}.
            </T>
            {Object.values(CREDITS).map((cr) => (
              <Pressable key={cr.url} onPress={() => Linking.openURL(cr.url)}>
                <T v="small" color={c.textSec} style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
                  {cr.title} — {cr.author} ({cr.license}), Wikimedia Commons
                </T>
              </Pressable>
            ))}
            <T v="small" color={c.textSec}>© OpenStreetMap contributors · © CARTO · © OpenTopoMap</T>
          </View>
        ) : null}
        <Row icon="information-outline" label={t('about')} onPress={() => setShowAbout(!showAbout)}>
          <Icon name={showAbout ? 'chevron-up' : 'chevron-down'} color={c.textSec} />
        </Row>
        {showAbout ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
            <T v="meta" color={c.textSec}>
              {t('aboutText')}
            </T>
            <Pressable onPress={() => Linking.openURL(OFFICIAL_SOURCE.url)}>
              <T v="small" color={c.primary}>
                {t('dataCredit', { d: OFFICIAL_SOURCE.date })}
              </T>
            </Pressable>
          </View>
        ) : null}
        <Row
          icon="delete-outline"
          label={t('resetApp')}
          danger
          last
          onPress={() =>
            Alert.alert(t('resetApp'), t('resetAppQ'), [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                  await app.reset();
                  router.replace('/onboarding');
                },
              },
            ])
          }
        />
      </View>

      <T v="small" color={c.textSec} style={{ textAlign: 'center' }}>
        {t('version')}
      </T>
    </ScrollView>
  );
}

function Stat({ n, label, onPress }: { n: number; label: string; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.stat, { backgroundColor: c.bg }]}>
      <T v="h2">{n}</T>
      <T v="small" color={c.textSec}>
        {label}
      </T>
    </Pressable>
  );
}

function Row({
  icon,
  label,
  sub,
  children,
  onPress,
  vertical,
  danger,
  last,
}: {
  icon: string;
  label: string;
  sub?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  vertical?: boolean;
  danger?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  const color = danger ? c.danger : c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.border }, vertical && { flexDirection: 'column', alignItems: 'stretch' }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: vertical ? undefined : 1 }}>
        <Icon name={icon} color={danger ? c.danger : c.secondary} />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong" color={color}>
            {label}
          </T>
          {sub ? (
            <T v="small" color={c.textSec} style={{ fontFamily: fonts.regular }}>
              {sub}
            </T>
          ) : null}
        </View>
        {onPress && !children ? <Icon name="chevron-right" color={c.textSec} /> : null}
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: radius.card, borderWidth: 1, gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.input },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 56 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 15 },
});
