import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, EmptyState, Header, Icon, T } from '@/components/ui';
import type { Category, District } from '@/data/types';
import { isConfigured, submitSuggestion, useIsOnline } from '@/lib/community';
import { useApp } from '@/lib/store';
import { fonts, radius, useTheme } from '@/theme';

const S = {
  title: { es: 'Sugerir un lugar', en: 'Suggest a place' },
  subtitle: { es: 'Ayuda al próximo viajero', en: 'Help the next traveller' },
  intro: {
    es: '¿Conoces un rincón de Urubamba que no está en la guía? Cuéntanos. Lo revisaremos antes de publicarlo.',
    en: "Know a spot in Urubamba that isn't in the guide? Tell us. We'll review it before publishing.",
  },
  name: { es: 'Nombre del lugar', en: 'Place name' },
  namePh: { es: 'Ej. Laguna de Huaypo', en: 'e.g. Huaypo Lagoon' },
  category: { es: 'Categoría', en: 'Category' },
  district: { es: 'Distrito', en: 'District' },
  location: { es: 'Ubicación', en: 'Location' },
  useLocation: { es: 'Usar mi ubicación actual', en: 'Use my current location' },
  locating: { es: 'Buscando tu ubicación…', en: 'Finding your location…' },
  locationHint: {
    es: 'Opcional. Úsalo si estás en el lugar ahora mismo.',
    en: "Optional. Use it if you're at the place right now.",
  },
  locationDenied: { es: 'No tenemos permiso para usar tu ubicación.', en: "We don't have permission to use your location." },
  locationError: { es: 'No pudimos obtener tu ubicación. Inténtalo al aire libre.', en: "We couldn't get your location. Try outdoors." },
  clear: { es: 'Quitar', en: 'Remove' },
  description: { es: '¿Qué hay allí?', en: "What's there?" },
  descriptionPh: {
    es: 'Describe el lugar: qué se ve, por qué vale la pena, cuánto tiempo toma…',
    en: "Describe the place: what you'll see, why it's worth it, how long it takes…",
  },
  howToGet: { es: 'Cómo llegar', en: 'How to get there' },
  howToGetPh: {
    es: 'Desde qué pueblo se sale, transporte, por dónde se camina…',
    en: 'Which town to start from, transport, the trail…',
  },
  tips: { es: 'Consejos', en: 'Tips' },
  tipsPh: { es: 'Qué llevar, mejor hora, entrada, cuidados…', en: 'What to bring, best time, entry fee, precautions…' },
  photos: { es: 'Fotos (hasta 3)', en: 'Photos (up to 3)' },
  add: { es: 'Añadir', en: 'Add' },
  remove: { es: 'Quitar foto', en: 'Remove photo' },
  required: { es: 'Obligatorio', en: 'Required' },
  nameShort: { es: 'Escribe al menos 3 letras', en: 'Write at least 3 letters' },
  descShort: { es: 'Escribe al menos 20 caracteres', en: 'Write at least 20 characters' },
  pickCategory: { es: 'Elige una categoría', en: 'Pick a category' },
  pickDistrict: { es: 'Elige un distrito', en: 'Pick a district' },
  fixErrors: { es: 'Revisa los campos marcados', en: 'Check the highlighted fields' },
  send: { es: 'Enviar sugerencia', en: 'Send suggestion' },
  thanksTitle: { es: '¡Gracias!', en: 'Thank you!' },
  thanks: {
    es: 'Gracias, lo revisaremos antes de publicarlo.',
    en: "Thanks, we'll review it before publishing.",
  },
  queued: {
    es: 'Estás sin conexión: tu sugerencia se enviará automáticamente cuando vuelva la señal.',
    en: "You're offline: your suggestion will be sent automatically when you're back online.",
  },
  localOnly: {
    es: 'Tu sugerencia quedó guardada en este teléfono y se enviará cuando el servicio esté disponible.',
    en: 'Your suggestion is saved on this phone and will be sent when the service is available.',
  },
  another: { es: 'Sugerir otro lugar', en: 'Suggest another place' },
  done: { es: 'Volver', en: 'Back' },
} as const;

const CATEGORIES: { key: Category; es: string; en: string; icon: string }[] = [
  { key: 'paisajes', es: 'Paisajes', en: 'Landscapes', icon: 'image-filter-hdr' },
  { key: 'lagunas', es: 'Lagunas', en: 'Lagoons', icon: 'waves' },
  { key: 'arqueologia', es: 'Arqueología', en: 'Archaeology', icon: 'pillar' },
  { key: 'cataratas', es: 'Cataratas', en: 'Waterfalls', icon: 'waterfall' },
  { key: 'miradores', es: 'Miradores', en: 'Viewpoints', icon: 'binoculars' },
  { key: 'nevados', es: 'Nevados', en: 'Snow peaks', icon: 'snowflake' },
  { key: 'aventura', es: 'Aventura', en: 'Adventure', icon: 'hiking' },
  { key: 'cultura', es: 'Cultura', en: 'Culture', icon: 'drama-masks' },
];

const DISTRICTS: District[] = ['Ollantaytambo', 'Urubamba', 'Chinchero', 'Maras', 'Huayllabamba', 'Yucay', 'Machupicchu'];

export default function SuggestPlace() {
  const { lang } = useApp();
  const tr = (k: keyof typeof S) => S[k][lang];
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const online = useIsOnline();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [howToGet, setHowToGet] = useState('');
  const [tips, setTips] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = {
    name: name.trim().length < 3 ? (name.trim() ? tr('nameShort') : tr('required')) : null,
    category: category ? null : tr('pickCategory'),
    district: district ? null : tr('pickDistrict'),
    description: description.trim().length < 20 ? (description.trim() ? tr('descShort') : tr('required')) : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const locate = async () => {
    setLocError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocError(tr('locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      setLocError(tr('locationError'));
    } finally {
      setLocating(false);
    }
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - photos.length,
      quality: 0.6,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 3));
  };

  const send = async () => {
    setTried(true);
    if (hasErrors || !category || !district) return;
    setSending(true);
    try {
      await submitSuggestion({
        name: name.trim(),
        category,
        district,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        description: description.trim(),
        howToGet: howToGet.trim() || undefined,
        tips: tips.trim() || undefined,
        lang,
        photos,
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory(null);
    setDistrict(null);
    setCoords(null);
    setLocError(null);
    setDescription('');
    setHowToGet('');
    setTips('');
    setPhotos([]);
    setTried(false);
    setSent(false);
  };

  if (sent) {
    const note = !isConfigured() ? tr('localOnly') : !online ? tr('queued') : null;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title={tr('title')} />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
          <EmptyState icon="check-decagram-outline" title={tr('thanksTitle')} text={tr('thanks')}>
            {note ? (
              <View style={[styles.note, { backgroundColor: c.accentTint, borderLeftColor: c.accent }]}>
                <Icon name="cloud-clock-outline" size={18} color={c.text} />
                <T v="meta" style={{ flex: 1 }}>
                  {note}
                </T>
              </View>
            ) : null}
            <Button label={tr('done')} onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 8 }} />
            <Button label={tr('another')} variant="ghost" onPress={resetForm} style={{ alignSelf: 'stretch' }} />
          </EmptyState>
        </ScrollView>
      </View>
    );
  }

  const input = [styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontFamily: fonts.regular }];
  const errBorder = { borderColor: c.danger };
  const errorText = (msg: string | null) =>
    tried && msg ? (
      <T v="small" color={c.danger}>
        {msg}
      </T>
    ) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={tr('title')} subtitle={tr('subtitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
        <T color={c.textSec}>{tr('intro')}</T>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('name')} *</T>
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, 80))}
            placeholder={tr('namePh')}
            placeholderTextColor={c.textSec}
            style={[input, tried && errors.name ? errBorder : null]}
          />
          {errorText(errors.name)}
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('category')} *</T>
          <View style={styles.wrap}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={cat[lang]}
                icon={cat.icon}
                selected={category === cat.key}
                onPress={() => setCategory(category === cat.key ? null : cat.key)}
              />
            ))}
          </View>
          {errorText(errors.category)}
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('district')} *</T>
          <View style={styles.wrap}>
            {DISTRICTS.map((d) => (
              <Chip key={d} label={d} selected={district === d} onPress={() => setDistrict(district === d ? null : d)} />
            ))}
          </View>
          {errorText(errors.district)}
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('location')}</T>
          <T v="meta" color={c.textSec}>
            {tr('locationHint')}
          </T>
          {coords ? (
            <View style={[styles.coords, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Icon name="map-marker-check-outline" size={20} color={c.primary} />
              <T v="meta" style={{ flex: 1, fontFamily: fonts.semibold }}>
                {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </T>
              <Pressable onPress={() => setCoords(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('clear')}>
                <T v="meta" color={c.primary} style={{ fontFamily: fonts.bold }}>
                  {tr('clear')}
                </T>
              </Pressable>
            </View>
          ) : (
            <Button
              label={locating ? tr('locating') : tr('useLocation')}
              icon="crosshairs-gps"
              variant="outline"
              loading={locating}
              onPress={locate}
            />
          )}
          {locError ? (
            <T v="small" color={c.danger}>
              {locError}
            </T>
          ) : null}
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('description')} *</T>
          <TextInput
            value={description}
            onChangeText={(v) => setDescription(v.slice(0, 1500))}
            placeholder={tr('descriptionPh')}
            placeholderTextColor={c.textSec}
            multiline
            style={[input, { minHeight: 120, textAlignVertical: 'top' }, tried && errors.description ? errBorder : null]}
          />
          {errorText(errors.description)}
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('howToGet')}</T>
          <TextInput
            value={howToGet}
            onChangeText={(v) => setHowToGet(v.slice(0, 1000))}
            placeholder={tr('howToGetPh')}
            placeholderTextColor={c.textSec}
            multiline
            style={[input, { minHeight: 90, textAlignVertical: 'top' }]}
          />
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lightbulb-on-outline" size={18} color={c.accent} />
            <T v="bodyStrong">{tr('tips')}</T>
          </View>
          <TextInput
            value={tips}
            onChangeText={(v) => setTips(v.slice(0, 600))}
            placeholder={tr('tipsPh')}
            placeholderTextColor={c.textSec}
            multiline
            style={[input, { minHeight: 70, textAlignVertical: 'top', backgroundColor: c.accentTint, borderColor: c.accent }]}
          />
        </View>

        <View style={styles.field}>
          <T v="bodyStrong">{tr('photos')}</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {photos.map((u) => (
              <View key={u}>
                <Image source={{ uri: u }} style={styles.photo} />
                <Pressable
                  onPress={() => setPhotos(photos.filter((x) => x !== u))}
                  style={[styles.removePhoto, { backgroundColor: c.text }]}
                  hitSlop={8}
                  accessibilityLabel={tr('remove')}
                >
                  <Icon name="close" size={14} color={c.bg} />
                </Pressable>
              </View>
            ))}
            {photos.length < 3 ? (
              <Pressable
                onPress={pick}
                accessibilityRole="button"
                style={[styles.photo, styles.addPhoto, { borderColor: c.border, backgroundColor: c.surface }]}
              >
                <Icon name="image-plus" color={c.textSec} />
                <T v="small" color={c.textSec}>
                  {tr('add')}
                </T>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: c.border, gap: 8 }}>
        {tried && hasErrors ? (
          <T v="small" color={c.danger} style={{ textAlign: 'center' }}>
            {tr('fixErrors')}
          </T>
        ) : null}
        <Button label={tr('send')} icon="send" onPress={send} loading={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: radius.input, padding: 14, fontSize: 16, minHeight: 48 },
  coords: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radius.input, padding: 12 },
  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.input, borderLeftWidth: 4, alignItems: 'flex-start', alignSelf: 'stretch' },
  photo: { width: 88, height: 88, borderRadius: 14 },
  addPhoto: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  removePhoto: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
