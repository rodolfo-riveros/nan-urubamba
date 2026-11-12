# Ñan Urubamba

App móvil (React Native + Expo) para que turistas nacionales y extranjeros descubran lugares poco conocidos de la **provincia de Urubamba (Cusco)**: paisajes, lagunas, cataratas, nevados, sitios arqueológicos, aventura y cultura viva. Bilingüe **español / inglés**.

> *Ñan* significa "camino" en quechua.

## Qué incluye

| Función | Detalle |
|---|---|
| **Datos oficiales** | 67 recursos del **Inventario Nacional de Recursos Turísticos (MINCETUR)** de la provincia de Urubamba: descripción oficial, altitud, horario, tipo de ingreso, actividades, ruta de acceso y fotos oficiales. 14 de ellos enriquecidos con datos de campo (dificultad, tiempos, costos, cuidados, info para modo cámara). |
| **Categorías** | Paisajes, Lagunas, Arqueología, Cataratas, Miradores, Nevados, **Aventura** (trekking, camping, kayak, pesca… según las actividades oficiales) y **Cultura viva** (pueblos, templos, museos, fiestas). Selección múltiple + filtros por dificultad, duración, distrito, transporte público y señal. |
| **GPS** | Ordena todo por cercanía a tu posición actual ("Lo más cercano a ti") y muestra la distancia a cada lugar. |
| **Ruta desde tu posición** | Con internet: ruta real por carretera/a pie (Google Directions API) dibujada dentro de la app y guardada para reutilizarla sin señal. Sin internet: ruta estimada eligiendo el pueblo de acceso más conveniente. Botón "Navegar" abre Google Maps. |
| **Google Maps** | Mapa con marcadores por categoría, tarjeta del lugar, ruta y modo oscuro. |
| **Funciona sin internet** | Fichas, rutas, cuidados y **portadas oficiales** van dentro de la app. Los mapas se descargan por zona (pantalla *Mapas sin conexión*) y siguen funcionando sin señal junto con el GPS. Las reseñas y sugerencias hechas sin señal quedan en cola y se envían al reconectar. |
| **Modo cámara** | Apunta a un sitio arqueológico: usa GPS + brújula para saber qué sitio tienes enfrente y muestra su historia. También acepta una foto de la galería (lee la ubicación EXIF). No guarda fotos. |
| **Comunidad** | Los turistas alimentan la app: reseñas con calificación, consejo para el próximo visitante y fotos (publicación inmediata, con botón *Reportar*; 3 reportes la ocultan). **Sugerir un lugar** nuevo (se publica tras moderación). |
| **Hospedaje y restaurantes** | Por lugar o cerca de ti, con filtros de precio y distancia, WhatsApp y "Cómo llegar". ⚠️ Los registros actuales son **de ejemplo** (`src/data/businesses.ts`): reemplázalos por negocios reales. |
| **Otros** | Onboarding (idioma, intereses, permisos), guardados, perfil, tema claro/oscuro/automático, accesibilidad (áreas táctiles de 48 px, dificultad siempre con color + texto + icono). |

## Prototipo para presentación

- **Probar en Expo Go:** instala *Expo Go* en tu teléfono, ejecuta `npx expo start` en esta carpeta y escanea el QR (misma red Wi-Fi; si no, `npx expo start --tunnel`).
- **APK listo (compilado en la nube de Expo):** [descargar nan-urubamba.apk](https://expo.dev/artifacts/eas/jBaoMicCMcJa9kxaD_HT82IY6b17VrmCZTWybt2pVRU.apk) · todas las compilaciones: https://expo.dev/accounts/rdo0711/projects/nan-urubamba/builds
- **Mapa:** en Expo Go usa Google Maps; en el APK (sin API key) usa Leaflet con mapa topográfico de Esri, empaquetado en la app.
- **Sin API keys ni base de datos:** el mapa no necesita key (Google en Expo Go, Leaflet + Esri en el APK); las rutas desde tu posición son estimadas; tus reseñas y sugerencias se guardan en el teléfono (cola lista para enviarse cuando se conecte un servidor).
- **Datos reales:** los 67 lugares, descripciones, horarios, rutas y fotos de portada vienen de MINCETUR.
- **Datos de demostración:** reseñas de ejemplo en ~30 lugares (marcadas "Demo") y hospedajes/restaurantes de ejemplo con imágenes referenciales de Wikimedia Commons. Se desactivan en *Perfil → Datos de demostración*.
- Créditos de imágenes: *Perfil → Créditos de imágenes* y `src/data/imageCredits.json`.

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completa las keys (ver abajo)
npx expo start
```

Para probar en el teléfono necesitas un **development build** (la app usa módulos nativos: mapas, cámara, sistema de archivos):

```bash
npx expo run:android      # o: npx eas-cli@latest build --profile development --platform android
```

### Variables de entorno (`.env`)

| Variable | Para qué |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Opcional. Mapa base de Google (*Maps SDK for Android/iOS*). Sin ella se usa el mapa libre CARTO/OSM. |
| `EXPO_PUBLIC_GOOGLE_DIRECTIONS_KEY` | Rutas reales desde tu posición (*Directions API*). Opcional: sin ella se usa la ruta estimada. |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Servidor de la comunidad. Sin ellas los aportes quedan en el teléfono. |
| `EXPO_PUBLIC_OFFLINE_TILE_URL` | Servidor de teselas para mapas offline (por defecto OpenTopoMap). |

### Servidor de la comunidad (Supabase) — opcional, para producción

1. Crea un proyecto en [supabase.com](https://supabase.com) (región São Paulo, cercana a Perú).
2. **SQL Editor → New query** → pega todo `supabase/schema.sql` → **Run** (se puede ejecutar varias veces; crea tablas, políticas de seguridad RLS y el bucket público `review-photos`).
3. **Project Settings → API**: copia *Project URL* y *anon public key* en `.env`.
4. Reinicia con `npx expo start -c`.

Moderación (Table Editor o SQL):
- Aprobar un lugar sugerido: `update place_suggestions set status = 'approved' where id = '…';`
- Volver a publicar una reseña ocultada por reportes: `update reviews set status = 'published', report_count = 0 where id = '…';`

## Fuentes de datos y créditos

- **MINCETUR — Inventario Nacional de Recursos Turísticos**, vía [datosabiertos.gob.pe](https://www.datosabiertos.gob.pe/dataset/inventario-nacional-de-recursos-tur%C3%ADsticos), licencia **ODC-BY** (se cita en la app). Fotos de portada tomadas de las fichas oficiales (`consultasenlinea.mincetur.gob.pe`), redimensionadas a 960×640.
- Mapas: © OpenStreetMap contributors · © CARTO · © OpenTopoMap (CC-BY-SA).
- Imágenes de lugares sin foto oficial y de negocios de ejemplo: Wikimedia Commons (CC0 / CC BY / CC BY-SA), autores en `src/data/imageCredits.json` (`scripts/commons-images.js`).

### Compilar el APK

Se compila en los servidores de Expo (EAS), sin Android Studio:

```bash
npx eas-cli@latest build -p android --profile preview   # APK para instalar directo
npx eas-cli@latest build -p android --profile production # AAB para Play Store
```

### Actualizar los datos oficiales

```bash
curl -L -o inv.csv https://www.mincetur.gob.pe/Datos_abiertos/DGET/Inventario_recursos_turisticos.csv
node scripts/mincetur-1-filter.js inv.csv urubamba.json
node scripts/mincetur-2-fetch-fichas.js urubamba.json fichas/
node scripts/mincetur-3-parse.js urubamba.json fichas parsed.json
node scripts/mincetur-4-build.js parsed.json             # → src/data/official.json
npm i --no-save sharp && node scripts/mincetur-5-covers.js src/data/official.json assets/places src/data/covers.ts
```

Agrega el resumen en inglés de cada recurso nuevo en `scripts/official-en.json`.

### Datos a verificar en campo

- El CSV oficial trae las columnas LATITUD/LONGITUD **invertidas**; el script lo corrige.
- **Catarata de Perolniyoc**: la coordenada oficial (−13.310, −72.263) contradice su propia ruta de acceso (vía Socma, al norte). Se usa la coordenada curada (`KEEP_CURATED_COORDS` en `src/data/places.ts`).
- Diferencias grandes entre coordenadas oficiales y curadas: Intipunku (7 km), Patacancha (4,5 km), Mirador de Raqchi (3,4 km), Pumamarka y Putucusi (~1,8 km). Se usan las oficiales.
- Algunas altitudes oficiales son imposibles (p. ej. 33 645 m) y se descartan.
- En los 53 recursos sin datos de campo, dificultad y duración son **estimadas** a partir de la ruta oficial (la app lo indica).
- Lugares curados que no figuran en el inventario: Cataratas de Pumahuanca, Laguna Ipsaycocha, Quebrada de Chicón y Camino Chinchero–Urquillos (sin foto oficial).

## Limitaciones conocidas

- El **modo cámara** no usa visión artificial: identifica por GPS + brújula (fiable cerca o dentro del sitio).
- **Mapas offline en iOS con Google Maps**: react-native-maps no tiene `LocalTile` para Google en iOS; se usa `UrlTile` con `file://` y falta probarlo en un dispositivo. En Android funciona con `LocalTile`.
- **OpenTopoMap** es un servidor voluntario: para producción usa un proveedor de teselas que permita descargas offline.
- No hay cuentas de usuario: cada teléfono tiene un identificador anónimo.

## Estructura

```
src/app/            pantallas (expo-router): (tabs)/ explorar, mapa, cámara, guardados, perfil;
                    place/[id], reviews/[id], review/[id], nearby/[id], filters, offline, suggest, onboarding
src/components/     UI del sistema de diseño, tarjetas, marcadores, capa de mapa offline
src/data/           official.json (MINCETUR), places.ts (unión oficial + curado), covers.ts, catálogos
src/lib/            store, ubicación, rutas (directions), mapas offline, comunidad (Supabase + cola), cámara
supabase/schema.sql esquema del servidor
scripts/            importación de datos oficiales
```

Comandos útiles: `npm run typecheck`, `npm run lint`, `npx expo-doctor`.
