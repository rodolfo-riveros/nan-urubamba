import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, Stars, T } from '@/components/ui';
import { getPlace } from '@/data/places';
import { submitReview } from '@/lib/community';
import { useApp } from '@/lib/store';
import type { StringKey } from '@/lib/strings';
import { fonts, radius, useTheme } from '@/theme';

const MAX = 600;

function lastMonths(n: number, lang: 'es' | 'en') {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`,
      label: x.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { month: 'short', year: 'numeric' }),
    });
  }
  return out;
}

export default function WriteReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getPlace(id);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, lang, update, userName, userCountry, visited } = useApp();
  const [rating, setRating] = useState(0);
  const months = lastMonths(12, lang);
  const [month, setMonth] = useState(months[0].key);
  const [text, setText] = useState('');
  const [tip, setTip] = useState('');
  const [name, setName] = useState(userName);
  const [country, setCountry] = useState(userCountry);
  const [photos, setPhotos] = useState<string[]>([]);

  if (!place) return <EmptyState icon="map-marker-question-outline" title={t('notFound')} />;

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - photos.length,
      quality: 0.6,
    });
    if (!res.canceled) setPhotos([...photos, ...res.assets.map((a) => a.uri)].slice(0, 3));
  };

  const publish = () => {
    if (!rating) return Alert.alert(t('reviewNeedRating'));
    if (text.trim().length < 20) return Alert.alert(t('reviewNeedText'));
    // Se publica en el servidor; sin señal queda en cola y se envía al reconectar
    submitReview({
      placeId: place.id,
      author: name.trim() || (lang === 'es' ? 'Viajero' : 'Traveller'),
      country: country.trim(),
      visitedAt: month,
      rating,
      text: text.trim(),
      tip: tip.trim() || undefined,
      lang,
      photos,
    }).catch(() => {});
    update({
      userName: userName || name.trim(),
      userCountry: country.trim() || userCountry,
      visited: visited.includes(place.id) ? visited : [...visited, place.id],
    });
    Alert.alert(t('reviewThanks'));
    router.back();
  };

  const input = [styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontFamily: fonts.regular }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top > 30 ? 12 : insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('close')}>
          <Icon name="close" size={26} />
        </Pressable>
        <T v="h3" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {t('yourReviewOf', { x: place.name })}
        </T>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8 }}>
          <T v="bodyStrong">{t('howWasIt')}</T>
          <Stars value={rating} size={44} onChange={setRating} />
          <T v="meta" color={c.textSec}>
            {rating ? t(`rate${rating}` as StringKey) : ' '}
          </T>
        </View>

        <View style={{ gap: 8 }}>
          <T v="bodyStrong">{t('visitDate')}</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {months.map((m) => {
              const sel = m.key === month;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMonth(m.key)}
                  style={[styles.month, { backgroundColor: sel ? c.secondary : c.surface, borderColor: sel ? c.secondary : c.border }]}
                >
                  <T v="meta" color={sel ? '#FFF' : c.text}>
                    {m.label}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ gap: 8 }}>
          <T v="bodyStrong">{t('tellUs')}</T>
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX))}
            placeholder={t('tellUsPh')}
            placeholderTextColor={c.textSec}
            multiline
            style={[input, { minHeight: 130, textAlignVertical: 'top' }]}
          />
          <T v="small" color={c.textSec} style={{ alignSelf: 'flex-end' }}>
            {text.length} / {MAX}
          </T>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lightbulb-on-outline" size={18} color={c.accent} />
            <T v="bodyStrong">{t('tipForNext')}</T>
          </View>
          <TextInput
            value={tip}
            onChangeText={(v) => setTip(v.slice(0, 200))}
            placeholder={t('tipPh')}
            placeholderTextColor={c.textSec}
            multiline
            style={[input, { minHeight: 70, textAlignVertical: 'top', backgroundColor: c.accentTint, borderColor: c.accent }]}
          />
        </View>

        <View style={{ gap: 8 }}>
          <T v="bodyStrong">{t('photosUpTo')}</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {photos.map((u) => (
              <View key={u}>
                <Image source={{ uri: u }} style={styles.photo} />
                <Pressable
                  onPress={() => setPhotos(photos.filter((x) => x !== u))}
                  style={[styles.removePhoto, { backgroundColor: c.text }]}
                  hitSlop={8}
                  accessibilityLabel={t('delete')}
                >
                  <Icon name="close" size={14} color={c.bg} />
                </Pressable>
              </View>
            ))}
            {photos.length < 3 ? (
              <Pressable onPress={pick} style={[styles.photo, styles.addPhoto, { borderColor: c.border, backgroundColor: c.surface }]}>
                <Icon name="image-plus" color={c.textSec} />
                <T v="small" color={c.textSec}>
                  {t('add')}
                </T>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <T v="bodyStrong">{t('yourName')}</T>
            <TextInput value={name} onChangeText={setName} placeholder="Ana" placeholderTextColor={c.textSec} style={input} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <T v="bodyStrong">{t('yourCountry')}</T>
            <TextInput value={country} onChangeText={setCountry} placeholder="Perú" placeholderTextColor={c.textSec} style={input} />
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button label={t('publish')} onPress={publish} disabled={!rating || text.trim().length < 20} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  input: { borderWidth: 1, borderRadius: radius.input, padding: 14, fontSize: 16, minHeight: 48 },
  month: { paddingHorizontal: 14, height: 40, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  photo: { width: 88, height: 88, borderRadius: 14 },
  addPhoto: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  removePhoto: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
