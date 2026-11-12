import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, T } from '@/components/ui';
import type { Coords } from '@/data/types';
import { angleDiff, bearingDeg, circularMean, distanceM, formatDistance } from '@/lib/geo';
import {
  confidencePct,
  coordsFromExif,
  MATCH_THRESHOLD,
  NEAR_RADIUS_M,
  nearestSites,
  rankCandidates,
  type Candidate,
} from '@/lib/identify';
import { useLocation } from '@/lib/location';
import { useApp } from '@/lib/store';
import { radius, useTheme , IMG_FILL } from '@/theme';

type Phase = 'aim' | 'identifying' | 'result' | 'fail';

export default function CameraScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, L, lang } = useApp();
  const loc = useLocation();
  const [perm, requestPerm] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('aim');
  const [match, setMatch] = useState<Candidate | null>(null);
  const [galleryUri, setGalleryUri] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [failFrom, setFailFrom] = useState<Coords | null>(null);
  const samples = useRef<number[]>([]);

  // Cámara y brújula solo mientras la pestaña está visible
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      let sub: Location.LocationSubscription | null = null;
      (async () => {
        if (loc.status !== 'granted') return;
        try {
          sub = await Location.watchHeadingAsync((h) => {
            const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            samples.current = [...samples.current.slice(-9), v];
            setHeading(circularMean(samples.current));
          });
        } catch {
          setHeading(null);
        }
      })();
      if (perm && !perm.granted && perm.canAskAgain) requestPerm();
      return () => {
        setFocused(false);
        sub?.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.status, perm?.granted]),
  );

  const near = useMemo(() => {
    if (!loc.coords) return null;
    const n = nearestSites(loc.coords, 1)[0];
    return n && n.distance <= NEAR_RADIUS_M ? n : null;
  }, [loc.coords]);

  const guidance = useMemo(() => {
    if (!near || !loc.coords) return null;
    if (near.distance < 200) return { text: t('youAreInside'), rot: 0 };
    if (heading == null) return null;
    const d = angleDiff(heading, bearingDeg(loc.coords, near.place.coords));
    if (Math.abs(d) < 12) return { text: t('onTarget'), rot: 0 };
    return { text: d > 0 ? t('turnRight', { n: Math.round(d) }) : t('turnLeft', { n: Math.round(-d) }), rot: d };
  }, [near, heading, loc.coords, t]);

  const evaluate = (from: Coords, h: number | null, accuracy?: number | null) => {
    const ranked = rankCandidates(from, h, accuracy ?? 30);
    const best = ranked[0];
    if (best && best.score >= MATCH_THRESHOLD) {
      setMatch(best);
      setPhase('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setMatch(null);
      setFailFrom(from);
      setPhase('fail');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };

  const identify = async () => {
    setNote(null);
    setGalleryUri(null);
    if (loc.status !== 'granted') {
      const ok = await loc.request();
      if (!ok) return;
    }
    setPhase('identifying');
    // Recoge lecturas de la brújula ~1,5 s para estabilizar
    samples.current = [];
    await new Promise((r) => setTimeout(r, 1500));
    let from = loc.coords;
    let acc = loc.accuracy;
    try {
      const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      from = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
      acc = fresh.coords.accuracy ?? acc;
    } catch {
      // usamos la última posición conocida
    }
    if (!from) {
      setPhase('fail');
      return;
    }
    const h = samples.current.length ? circularMean(samples.current) : heading;
    evaluate(from, h, acc);
  };

  const fromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], exif: true, quality: 0.5 });
    if (res.canceled) return;
    const asset = res.assets[0];
    setGalleryUri(asset.uri);
    setPhase('identifying');
    const exif = coordsFromExif(asset.exif as Record<string, unknown> | null);
    await new Promise((r) => setTimeout(r, 900));
    if (exif) {
      setNote(null);
      evaluate(exif.coords, exif.heading, 30);
      return;
    }
    setNote(t('photoNoGps'));
    if (loc.coords) evaluate(loc.coords, null, loc.accuracy);
    else {
      setFailFrom(null);
      setPhase('fail');
    }
  };

  const reset = () => {
    setPhase('aim');
    setMatch(null);
    setGalleryUri(null);
    setNote(null);
  };

  const close = () => router.navigate('/');

  // --- Permiso de cámara denegado
  if (perm && !perm.granted && !perm.canAskAgain) {
    return (
      <View style={[styles.full, { backgroundColor: c.bg, paddingTop: insets.top + 12 }]}>
        <TopBar onClose={close} dark={false} />
        {galleryUri && phase !== 'aim' ? (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: galleryUri }} style={IMG_FILL} />
            <ResultLayer />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 24, gap: 14, flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.errIcon, { backgroundColor: c.primaryTint }]}>
              <Icon name="camera-off-outline" size={36} color={c.primary} />
            </View>
            <T v="h2" style={{ textAlign: 'center' }}>
              {t('cameraErrorTitle')}
            </T>
            <T color={c.textSec} style={{ textAlign: 'center' }}>
              {t('cameraErrorText')}
            </T>
            <Button label={t('openSettings')} icon="cog-outline" onPress={() => Linking.openSettings()} />
            <Button label={t('uploadFromGallery')} icon="image-outline" variant="outline" onPress={fromGallery} />
            <T v="small" color={c.textSec} style={{ textAlign: 'center' }}>
              Código: CAM_PERMISSION_DENIED
            </T>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: '#000' }]}>
      {galleryUri ? (
        <Image source={{ uri: galleryUri }} style={IMG_FILL} resizeMode="cover" />
      ) : focused && perm?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {perm && !perm.granted ? (
            <Button label={t('allowCamera')} icon="camera-outline" onPress={requestPerm} />
          ) : (
            <ActivityIndicator color="#FFF" />
          )}
        </View>
      )}

      <View style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TopBar onClose={close} dark />

        {/* Estás cerca de */}
        <View style={styles.nearPill}>
          <Icon name="map-marker-radius" size={18} color="#FFF" />
          <T v="meta" color="#FFF">
            {near ? `${t('nearOfLabel')} ` : ''}
            <T v="bodyStrong" color="#FFF">
              {near ? near.place.name : loc.status === 'granted' ? t('noSiteNear') : t('location')}
            </T>
          </T>
        </View>
        {loc.status !== 'granted' ? (
          <Pressable onPress={loc.request} style={styles.locWarn}>
            <T v="meta" color="#FFF" style={{ textAlign: 'center' }}>
              {t('needLocationCam')}
            </T>
            <T v="meta" color={c.accent} style={{ textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold' }}>
              {t('enableLocation')}
            </T>
          </Pressable>
        ) : null}

        {/* Marco de enfoque */}
        {phase === 'aim' || phase === 'identifying' ? (
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame}>
              {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
                <View key={k} style={[styles.corner, cornerStyle(k), { borderColor: phase === 'identifying' ? c.accent : '#FFF' }]} />
              ))}
              {phase === 'identifying' ? <ActivityIndicator size="large" color={c.accent} /> : null}
            </View>
            <View style={styles.hint}>
              <T v="bodyStrong" color="#FFF" style={{ textAlign: 'center' }}>
                {phase === 'identifying' ? t('identifying') : t('pointAtSite')}
              </T>
              {phase === 'aim' && guidance ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                  <Icon name="navigation" size={18} color={c.accent} style={{ transform: [{ rotate: `${guidance.rot}deg` }] }} />
                  <T v="meta" color={c.accent}>
                    {guidance.text}
                    {near ? ` · ${formatDistance(near.distance, lang)}` : ''}
                  </T>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }} pointerEvents="none" />
        )}

        <ResultLayer />

        {/* Controles */}
        {phase === 'aim' ? (
          <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
            <Pressable onPress={fromGallery} style={styles.sideBtn} accessibilityLabel={t('uploadFromGallery')}>
              <Icon name="image-outline" size={26} color="#FFF" />
            </Pressable>
            <Pressable onPress={identify} style={[styles.shutter, { borderColor: '#FFF' }]} accessibilityLabel={t('identify')}>
              <View style={[styles.shutterInner, { backgroundColor: c.primary }]}>
                <Icon name="camera-iris" size={30} color="#FFF" />
              </View>
            </Pressable>
            <View style={styles.sideBtn}>
              <Icon name="compass-outline" size={22} color="#FFF" style={{ transform: [{ rotate: `${-(heading ?? 0)}deg` }] }} />
              <T v="small" color="#FFF" style={{ fontSize: 11 }}>
                {heading != null ? `${Math.round(heading)}°` : '—'}
              </T>
            </View>
          </View>
        ) : phase === 'identifying' ? (
          <View style={{ height: insets.bottom + 120 }} />
        ) : null}
      </View>
    </View>
  );

  function ResultLayer() {
    if (phase === 'result' && match) {
      const pct = confidencePct(match.score);
      const p = match.place;
      return (
        <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.conf, { backgroundColor: pct >= 80 ? c.secondaryTint : c.accentTint }]}>
            <Icon name="check-decagram" size={18} color={pct >= 80 ? c.secondary : '#8A5A0B'} />
            <T v="small" color={pct >= 80 ? c.secondary : '#8A5A0B'}>
              {pct >= 80 ? t('highConfidence') : t('mediumConfidence')} · {t('matchPct', { n: pct })}
            </T>
          </View>
          <T v="h2">{p.name}</T>
          <T v="meta" color={c.textSec}>
            {[p.history ? L(p.history.culture) : null, p.history ? L(p.history.period) : null, p.district].filter(Boolean).join(' · ')}
          </T>
          <T>{L(p.cameraInfo ?? p.description)}</T>
          {note ? (
            <T v="small" color={c.textSec}>
              {note}
            </T>
          ) : null}
          <Button label={t('seeFullGuide')} onPress={() => router.push(`/place/${p.id}`)} />
          <Button label={t('tryAgain')} variant="ghost" onPress={reset} />
        </View>
      );
    }
    if (phase === 'fail') {
      const from = failFrom ?? loc.coords;
      const options = from ? nearestSites(from, 3) : [];
      return (
        <ScrollView
          style={[styles.sheet, { backgroundColor: c.surface, maxHeight: '75%' }]}
          contentContainerStyle={{ gap: 10, paddingBottom: insets.bottom + 16 }}
        >
          <T v="h2">{t('notRecognized')}</T>
          <T color={c.textSec}>{t('notRecognizedHint')}</T>
          {[t('tipCloser'), t('tipCompass'), t('tipFrame')].map((s) => (
            <View key={s} style={{ flexDirection: 'row', gap: 8 }}>
              <T color={c.primary}>•</T>
              <T v="meta" style={{ flex: 1 }}>
                {s}
              </T>
            </View>
          ))}
          {note ? (
            <T v="small" color={c.textSec}>
              {note}
            </T>
          ) : null}
          {options.length ? (
            <>
              <T v="bodyStrong" style={{ marginTop: 6 }}>
                {t('areYouAt')}
              </T>
              {options.map((o) => (
                <Pressable
                  key={o.place.id}
                  onPress={() => router.push(`/place/${o.place.id}`)}
                  style={[styles.option, { borderColor: c.border }]}
                >
                  <Icon name="wall" color={c.primary} />
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong">{o.place.name}</T>
                    <T v="meta" color={c.textSec}>
                      {t('aDistanceFromYou', { d: formatDistance(distanceM(from!, o.place.coords), lang) })}
                    </T>
                  </View>
                  <Icon name="chevron-right" color={c.textSec} />
                </Pressable>
              ))}
            </>
          ) : null}
          <Button label={t('tryAgain')} onPress={reset} style={{ marginTop: 6 }} />
        </ScrollView>
      );
    }
    if (phase === 'aim' && !galleryUri) {
      return (
        <T v="small" color="rgba(255,255,255,0.75)" style={{ textAlign: 'center', paddingHorizontal: 32, marginBottom: 8, fontFamily: 'PlusJakartaSans_400Regular' }}>
          {t('howItWorks')}
        </T>
      );
    }
    return null;
  }
}

function TopBar({ onClose, dark }: { onClose: () => void; dark: boolean }) {
  const { t } = useApp();
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10 }}>
      <Pressable
        onPress={onClose}
        accessibilityLabel={t('close')}
        style={[styles.round, { backgroundColor: dark ? 'rgba(0,0,0,0.45)' : c.surface }]}
      >
        <Icon name="close" color={dark ? '#FFF' : c.text} />
      </Pressable>
    </View>
  );
}

function cornerStyle(k: 'tl' | 'tr' | 'bl' | 'br') {
  const s = { borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 } as Record<string, number | string>;
  if (k[0] === 't') {
    s.top = 0;
    s.borderTopWidth = 4;
  } else {
    s.bottom = 0;
    s.borderBottomWidth = 4;
  }
  if (k[1] === 'l') {
    s.left = 0;
    s.borderLeftWidth = 4;
  } else {
    s.right = 0;
    s.borderRightWidth = 4;
  }
  return s;
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nearPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  locWarn: { marginHorizontal: 24, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', gap: 4 },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  frame: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 40, height: 40, borderRadius: 6 },
  hint: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, maxWidth: 320 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 16 },
  sideBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  conf: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.badge },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  errIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
