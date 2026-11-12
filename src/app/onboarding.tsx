import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Image , Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IMAGES } from '@/data/images';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Icon, T } from '@/components/ui';
import { CATEGORIES } from '@/data/catalog';
import type { Category, Lang } from '@/data/types';
import { useLocation } from '@/lib/location';
import { useApp } from '@/lib/store';
import { radius, useTheme , IMG_FILL } from '@/theme';

export default function Onboarding() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang, update, interests } = useApp();
  const loc = useLocation();
  const [cam, requestCam] = useCameraPermissions();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Category[]>(interests);

  const finish = () => {
    update({ onboarded: true, interests: picked });
    router.replace('/');
  };

  if (step === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1B18' }}>
        <Image source={IMAGES['place-chicon']} style={IMG_FILL} resizeMode="cover" />
        <LinearGradient colors={['rgba(20,18,16,0.15)', 'rgba(20,18,16,0.35)', 'rgba(20,18,16,0.92)']} style={StyleSheet.absoluteFill} />
        <T v="small" color="rgba(255,255,255,0.7)" style={{ position: 'absolute', top: insets.top + 16, left: 20 }}>
          Nevado Chicón · Foto: C. D. Real Ayala (CC BY-SA 4.0)
        </T>
        <View style={[styles.welcome, { paddingBottom: insets.bottom + 24 }]}>
          <T v="display" color="#FFF">
            Ñan Urubamba
          </T>
          <T color="rgba(255,255,255,0.9)" style={{ fontSize: 18, lineHeight: 26 }}>
            {t('appTagline')}
          </T>
          <T v="meta" color="rgba(255,255,255,0.7)">
            {t('quickSteps')}
          </T>
          <Button label={t('start')} onPress={() => setStep(1)} style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Pressable onPress={() => setStep(step - 1)} hitSlop={12} accessibilityLabel={t('back')}>
          <Icon name="chevron-left" size={28} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6, marginHorizontal: 12 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.primary : c.border }} />
          ))}
        </View>
        {step < 3 ? (
          <Pressable onPress={finish} hitSlop={12}>
            <T v="meta" color={c.textSec} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {t('skip')}
            </T>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}>
        <T v="meta" color={c.textSec}>
          {t('stepOf', { n: step })}
        </T>

        {step === 1 && (
          <>
            <T v="h1">{t('langQuestion')}</T>
            <T color={c.textSec}>{t('langHint')}</T>
            {(['es', 'en'] as Lang[]).map((l) => {
              const sel = lang === l;
              return (
                <Pressable
                  key={l}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => update({ lang: l })}
                  style={[styles.option, { borderColor: sel ? c.primary : c.border, backgroundColor: sel ? c.primaryTint : c.surface }]}
                >
                  <View style={[styles.langCode, { backgroundColor: sel ? c.primary : c.border }]}>
                    <T v="bodyStrong" color={sel ? '#FFF' : c.text}>
                      {l.toUpperCase()}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong">{l === 'es' ? 'Español' : 'English'}</T>
                    <T v="meta" color={c.textSec}>
                      {l === 'es' ? (lang === 'es' ? 'Idioma por defecto' : 'Default language') : 'Full app in English'}
                    </T>
                  </View>
                  <Icon name={sel ? 'radiobox-marked' : 'radiobox-blank'} color={sel ? c.primary : c.textSec} />
                </Pressable>
              );
            })}
            <View style={[styles.row, { gap: 8 }]}>
              <Icon name="translate" size={18} color={c.textSec} />
              <T v="meta" color={c.textSec} style={{ flex: 1 }}>
                {t('reviewsLangNote')}
              </T>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <T v="h1">{t('interestsQuestion')}</T>
            <T color={c.textSec}>{t('interestsHint')}</T>
            <View style={styles.grid}>
              {CATEGORIES.map((cat) => {
                const sel = picked.includes(cat.key);
                return (
                  <Pressable
                    key={cat.key}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                    onPress={() => setPicked(sel ? picked.filter((x) => x !== cat.key) : [...picked, cat.key])}
                    style={[styles.tile, { borderColor: sel ? c.secondary : c.border, backgroundColor: sel ? c.secondaryTint : c.surface }]}
                  >
                    <Icon name={cat.icon} size={30} color={sel ? c.secondary : c.text} />
                    <T v="bodyStrong">{L(cat.label)}</T>
                    {sel ? <Icon name="check-circle" size={20} color={c.secondary} style={{ position: 'absolute', top: 10, right: 10 }} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <T v="h1">{t('permsTitle')}</T>
            <T color={c.textSec}>{t('permsHint')}</T>
            <PermCard
              icon="crosshairs-gps"
              title={t('location')}
              sub={t('whileUsing')}
              text={t('locationWhy')}
              action={t('allowLocation')}
              granted={loc.status === 'granted'}
              denied={loc.status === 'denied'}
              onPress={loc.request}
            />
            <PermCard
              icon="camera-outline"
              title={t('camera')}
              sub={t('onlyCameraMode')}
              text={t('cameraWhy')}
              action={t('allowCamera')}
              granted={!!cam?.granted}
              denied={!!cam && !cam.granted && !cam.canAskAgain}
              onPress={requestCam}
            />
          </>
        )}
      </ScrollView>

      <View style={{ padding: 20, paddingBottom: insets.bottom + 16 }}>
        {step === 1 && <Button label={t('continue')} onPress={() => setStep(2)} />}
        {step === 2 && (
          <Button
            label={picked.length ? t('continueCount', { n: picked.length }) : t('continue')}
            onPress={() => setStep(3)}
          />
        )}
        {step === 3 && <Button label={t('startExploring')} onPress={finish} />}
      </View>
    </View>
  );
}

function PermCard(props: {
  icon: string;
  title: string;
  sub: string;
  text: string;
  action: string;
  granted: boolean;
  denied: boolean;
  onPress: () => unknown;
}) {
  const { c } = useTheme();
  const { t } = useApp();
  return (
    <View style={[styles.perm, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.row, { gap: 12 }]}>
        <View style={[styles.permIcon, { backgroundColor: c.primaryTint }]}>
          <Icon name={props.icon} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">{props.title}</T>
          <T v="meta" color={c.textSec}>
            {props.sub}
          </T>
        </View>
      </View>
      <T v="meta" color={c.textSec}>
        {props.text}
      </T>
      {props.granted ? (
        <Chip label={t('allowed')} selected icon="check-circle" />
      ) : (
        <Button
          label={props.denied ? t('denied') : props.action}
          variant="outline"
          small
          disabled={props.denied}
          onPress={() => props.onPress()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48 },
  row: { flexDirection: 'row', alignItems: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card, borderWidth: 2 },
  langCode: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    minHeight: 110,
    borderRadius: radius.card,
    borderWidth: 2,
    padding: 14,
    justifyContent: 'flex-end',
    gap: 8,
  },
  perm: { padding: 16, borderRadius: radius.card, borderWidth: 1, gap: 10 },
  permIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
