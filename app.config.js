// Prototipo: funciona SIN API keys.
// - Android: el SDK de Google Maps exige una entrada de key en el manifiesto o la app se cierra.
//   Si no hay key se usa un marcador de posición: el mapa base de Google queda vacío y la app
//   dibuja encima un mapa libre (CARTO / OpenStreetMap) que no necesita key.
// - Para producción coloca GOOGLE_MAPS_API_KEY en .env.
const PLACEHOLDER = 'NO_KEY_PROTOTYPE';

module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? '';
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? key;
  const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY ?? key;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: androidKey || PLACEHOLDER,
          ...(iosKey ? { iosGoogleMapsApiKey: iosKey } : {}),
        },
      ],
    ],
    extra: { ...(config.extra ?? {}), hasGoogleMapsKey: !!androidKey },
  };
};
