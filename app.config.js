// Inyecta la API key de Google Maps desde variables de entorno (.env).
// app.json no puede leer variables de entorno, por eso se hace aquí.
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? '';
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? key,
          iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY ?? key,
        },
      ],
    ],
  };
};
