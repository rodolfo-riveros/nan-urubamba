import officialData from './official.json';
import type { CareKey, Category, Coords, District, Place, RouteStep } from './types';

/**
 * Lugares de la provincia de Urubamba (Cusco).
 * IMPORTANTE: coordenadas, costos, altitudes y tiempos son referenciales.
 * Validar con fuentes oficiales (DDC Cusco, municipalidades) antes de publicar.
 */

export const TOWNS: Record<string, Coords> = {
  Ollantaytambo: { latitude: -13.2584, longitude: -72.2633 },
  Urubamba: { latitude: -13.3047, longitude: -72.116 },
  Chinchero: { latitude: -13.3922, longitude: -72.0481 },
  Maras: { latitude: -13.3356, longitude: -72.1572 },
  Yucay: { latitude: -13.32, longitude: -72.083 },
  Huayllabamba: { latitude: -13.3392, longitude: -72.0631 },
  Machupicchu: { latitude: -13.1547, longitude: -72.5254 },
};

/** Centro aproximado de la provincia, para el mapa */
export const PROVINCE_CENTER: Coords = { latitude: -13.29, longitude: -72.2 };

const t = (es: string, en: string) => ({ es, en });

type CuratedPlace = Omit<Place, 'source' | 'kind'>;

const CURATED: CuratedPlace[] = [
  {
    id: 'pumamarca',
    name: 'Pumamarca',
    categories: ['arqueologia', 'miradores'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.2186, longitude: -72.2389 },
    origin: { name: 'Ollantaytambo', coords: TOWNS.Ollantaytambo },
    difficulty: 'moderada',
    durationHours: 4,
    durationNote: t('Ida, visita y vuelta', 'Round trip with visit'),
    altitude: 3350,
    bestSeason: t('Abr – Oct', 'Apr – Oct'),
    summary: t('Recinto inca sobre el valle de Patacancha', 'Inca complex above the Patacancha valley'),
    description: t(
      'Complejo inca poco visitado sobre el valle de Patacancha, con recintos, depósitos y andenes. Casi siempre lo tendrás para ti solo.',
      'Rarely visited Inca complex above the Patacancha valley, with buildings, storehouses and terraces. You will often have it to yourself.',
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XV', '15th century'),
      text: t(
        'Complejo inca que vigilaba la entrada al valle de Patacancha. Conserva recintos, depósitos (qollqas) y andenes con muros de piedra y adobe. Su ubicación permitía controlar el paso hacia la zona de Lares y la selva.',
        'Inca complex that guarded the entrance to the Patacancha valley. It preserves buildings, storehouses (qollqas) and terraces with stone and adobe walls. Its location controlled the route towards Lares and the jungle.',
      ),
    },
    cameraInfo: t(
      'Estás frente a los recintos que vigilaban la entrada al valle de Patacancha. Observa los nichos trapezoidales en los muros.',
      'You are facing the buildings that guarded the entrance to the Patacancha valley. Look at the trapezoidal niches in the walls.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Urubamba → Ollantaytambo', 'Shared van Urubamba → Ollantaytambo'),
        detail: t('Sale del terminal de Urubamba cada 15 min aprox.', 'Leaves Urubamba terminal roughly every 15 min.'),
        cost: 'S/ 3',
        time: '30 min',
      },
      {
        mode: 'taxi',
        title: t('Taxi a la comunidad de Pumamarca', 'Taxi to Pumamarca community'),
        detail: t('Por la trocha del valle de Patacancha. Acuerda el precio antes.', 'Along the Patacancha valley dirt road. Agree on the price first.'),
        cost: 'S/ 25–35',
        time: '25 min',
      },
      {
        mode: 'walk',
        title: t('Caminata hasta el sitio', 'Hike to the site'),
        detail: t('Sendero marcado, subida continua entre andenes.', 'Marked trail, steady climb between terraces.'),
        time: '1 h 30 min',
      },
    ],
    routeKm: 7,
    cares: ['altura', 'agua', 'sol', 'capas', 'patrimonio', 'guia'],
    signal: 'debil',
    publicTransport: true,
    rating: 4.8,
    ratingCount: 126,
  },
  {
    id: 'pinkuylluna',
    name: 'Pinkuylluna',
    categories: ['arqueologia', 'miradores'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.257, longitude: -72.2611 },
    origin: { name: 'Ollantaytambo', coords: TOWNS.Ollantaytambo },
    difficulty: 'moderada',
    durationHours: 2,
    durationNote: t('Subida y bajada', 'Up and down'),
    altitude: 2950,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('Depósitos incas colgados sobre el pueblo', 'Inca storehouses hanging above town'),
    description: t(
      'Depósitos incas construidos en la ladera frente a la fortaleza de Ollantaytambo. Entrada gratuita y una vista espectacular del pueblo inca.',
      'Inca storehouses built on the slope facing the Ollantaytambo fortress. Free entry and a spectacular view of the Inca town.',
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XV', '15th century'),
      text: t(
        'Las qollqas de Pinkuylluna se construyeron en altura para aprovechar el viento frío y conservar granos. En la ladera se reconoce el perfil del rostro de Tunupa, figura mítica andina.',
        'The Pinkuylluna qollqas were built high up to use the cold wind to preserve grain. On the hillside you can see the profile of Tunupa, a mythical Andean figure.',
      ),
    },
    cameraInfo: t(
      'Estás frente a las qollqas (depósitos) incas. Su altura y ventilación ayudaban a conservar alimentos.',
      'You are facing the Inca qollqas (storehouses). Their height and ventilation helped preserve food.',
    ),
    route: [
      {
        mode: 'walk',
        title: t('Desde la plaza de Ollantaytambo', 'From Ollantaytambo main square'),
        detail: t('Camina por la calle Lares hasta el letrero de Pinkuylluna.', 'Walk along Lares street to the Pinkuylluna sign.'),
        time: '5 min',
      },
      {
        mode: 'walk',
        title: t('Subida por escalinatas', 'Climb the stone stairs'),
        detail: t('Sendero empinado y estrecho, sin barandas en algunos tramos.', 'Steep and narrow trail, no railings in some sections.'),
        time: '40 min',
      },
    ],
    routeKm: 0.6,
    cares: ['agua', 'sol', 'sendero', 'patrimonio'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.7,
    ratingCount: 212,
  },
  {
    id: 'intipunku-ollantaytambo',
    name: 'Intipunku de Ollantaytambo',
    categories: ['arqueologia', 'miradores'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.278, longitude: -72.251 },
    origin: { name: 'Ollantaytambo', coords: TOWNS.Ollantaytambo },
    difficulty: 'dificil',
    durationHours: 6,
    durationNote: t('Ida y vuelta', 'Round trip'),
    altitude: 3700,
    bestSeason: t('May – Sep', 'May – Sep'),
    summary: t('Puerta del Sol con vista al nevado Verónica', 'Sun Gate with views of Mount Verónica'),
    description: t(
      'Una portada inca en lo alto de la montaña, frente al nevado Verónica (Wakay Willka). Larga subida pero con muy pocos visitantes.',
      'An Inca gateway high on the mountain, facing Mount Verónica (Wakay Willka). A long climb with very few visitors.',
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XV', '15th century'),
      text: t(
        'Portada ceremonial y punto de control del camino inca que unía Ollantaytambo con las alturas. Desde aquí se observa todo el valle.',
        'Ceremonial gateway and checkpoint on the Inca trail that connected Ollantaytambo with the highlands. The whole valley can be seen from here.',
      ),
    },
    cameraInfo: t(
      'Estás frente a la Puerta del Sol de Ollantaytambo. Mira hacia el norte: el nevado Verónica domina el horizonte.',
      'You are facing the Ollantaytambo Sun Gate. Look north: Mount Verónica dominates the horizon.',
    ),
    route: [
      {
        mode: 'walk',
        title: t('Inicio en el puente inca', 'Start at the Inca bridge'),
        detail: t('Cruza el río Vilcanota y toma el sendero hacia el sur.', 'Cross the Vilcanota river and take the trail south.'),
        time: '15 min',
      },
      {
        mode: 'walk',
        title: t('Subida por camino inca', 'Climb along the Inca trail'),
        detail: t('Pendiente fuerte y constante. Lleva bastones si tienes.', 'Steep and constant gradient. Bring trekking poles if you have them.'),
        time: '3 h',
      },
    ],
    routeKm: 5,
    cares: ['altura', 'agua', 'sol', 'capas', 'sendero', 'guia'],
    signal: 'debil',
    publicTransport: true,
    rating: 4.8,
    ratingCount: 58,
  },
  {
    id: 'kachiqhata',
    name: 'Canteras de Kachiqhata',
    categories: ['arqueologia', 'paisajes'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.264, longitude: -72.286 },
    origin: { name: 'Ollantaytambo', coords: TOWNS.Ollantaytambo },
    difficulty: 'dificil',
    durationHours: 6,
    durationNote: t('Ida y vuelta', 'Round trip'),
    altitude: 3450,
    bestSeason: t('Abr – Oct', 'Apr – Oct'),
    summary: t('La cantera de donde salieron las piedras del templo', 'The quarry that supplied the temple stones'),
    description: t(
      'Canteras incas al otro lado del río, con "piedras cansadas" abandonadas en el camino hacia Ollantaytambo.',
      'Inca quarries across the river, with "tired stones" abandoned along the way to Ollantaytambo.',
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XV', '15th century'),
      text: t(
        'De Kachiqhata se extrajeron los bloques de riolita rosada del Templo del Sol de Ollantaytambo. Los incas los trasladaban por rampas y cruzaban el río desviando su cauce.',
        'The pink rhyolite blocks of the Ollantaytambo Sun Temple were extracted from Kachiqhata. The Incas moved them on ramps and crossed the river by diverting its course.',
      ),
    },
    cameraInfo: t(
      'Estás en la cantera de Kachiqhata. Busca los bloques a medio tallar: son las "piedras cansadas".',
      'You are at the Kachiqhata quarry. Look for the half-carved blocks: the "tired stones".',
    ),
    route: [
      {
        mode: 'walk',
        title: t('Cruce del puente de Ollantaytambo', 'Cross the Ollantaytambo bridge'),
        detail: t('Toma el camino hacia la estación y sigue la trocha al oeste.', 'Head towards the station and follow the dirt road west.'),
        time: '30 min',
      },
      {
        mode: 'walk',
        title: t('Subida a las canteras', 'Climb to the quarries'),
        detail: t('Sendero en zigzag, poca sombra.', 'Zig-zag trail, little shade.'),
        time: '2 h 30 min',
      },
    ],
    routeKm: 6,
    cares: ['altura', 'agua', 'sol', 'sendero', 'patrimonio'],
    signal: 'nula',
    publicTransport: true,
    rating: 4.6,
    ratingCount: 31,
  },
  {
    id: 'perolniyoc',
    name: 'Catarata Perolniyoc',
    categories: ['cataratas', 'arqueologia'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.2128, longitude: -72.2945 },
    origin: { name: 'Comunidad de Socma', coords: { latitude: -13.231, longitude: -72.297 } },
    difficulty: 'dificil',
    durationHours: 5,
    durationNote: t('Desde Socma, ida y vuelta', 'From Socma, round trip'),
    altitude: 3600,
    bestSeason: t('Ene – Abr (más caudal)', 'Jan – Apr (more water)'),
    summary: t('Caída de agua de 80 m y restos incas', '80 m waterfall and Inca ruins'),
    description: t(
      'Una catarata de unos 80 metros escondida en la quebrada de Socma. Arriba está el sitio inca de Raqaypata.',
      'An approximately 80-metre waterfall hidden in the Socma gorge. The Inca site of Raqaypata sits above it.',
    ),
    route: [
      {
        mode: 'taxi',
        title: t('Taxi Ollantaytambo → Socma', 'Taxi Ollantaytambo → Socma'),
        detail: t('Por la carretera a Quillabamba, desvío a Socma.', 'Along the road to Quillabamba, turn-off to Socma.'),
        cost: 'S/ 30–40',
        time: '30 min',
      },
      {
        mode: 'walk',
        title: t('Caminata por la quebrada', 'Hike up the gorge'),
        detail: t('Sendero empinado. Pago de ingreso a la comunidad.', 'Steep trail. Community entrance fee.'),
        cost: 'S/ 10',
        time: '2 h',
      },
    ],
    routeKm: 9,
    cares: ['altura', 'agua', 'resbaloso', 'entrada', 'efectivo', 'capas'],
    signal: 'nula',
    publicTransport: false,
    rating: 4.9,
    ratingCount: 97,
  },
  {
    id: 'mandor',
    name: 'Catarata de Mandor',
    categories: ['cataratas', 'paisajes'],
    district: 'Machupicchu',
    coords: { latitude: -13.142, longitude: -72.542 },
    origin: { name: 'Machupicchu Pueblo', coords: TOWNS.Machupicchu },
    difficulty: 'facil',
    durationHours: 3,
    durationNote: t('Caminata junto a la vía férrea', 'Walk along the railway'),
    altitude: 1850,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('Jardines, aves y una catarata en el bosque', 'Gardens, birds and a forest waterfall'),
    description: t(
      'Un jardín privado en plena ceja de selva con orquídeas, aves y una catarata. Ideal si tienes tiempo libre en Machupicchu Pueblo.',
      'A private garden in the cloud forest with orchids, birds and a waterfall. Ideal if you have free time in Machupicchu town.',
    ),
    route: [
      {
        mode: 'walk',
        title: t('Caminata por la vía del tren', 'Walk along the train tracks'),
        detail: t('Desde Machupicchu Pueblo, río abajo. Cuidado con los trenes.', 'From Machupicchu town, downstream. Watch out for trains.'),
        time: '1 h',
      },
      {
        mode: 'walk',
        title: t('Ingreso a los jardines', 'Enter the gardens'),
        detail: t('Pago de ingreso en la entrada.', 'Pay the fee at the entrance.'),
        cost: 'S/ 15',
        time: '20 min',
      },
    ],
    routeKm: 3.5,
    cares: ['lluvia', 'resbaloso', 'entrada', 'efectivo'],
    extraCare: t('Camina siempre por el costado de la vía y atento al silbato del tren.', 'Always walk beside the tracks and listen for the train whistle.'),
    signal: 'debil',
    publicTransport: true,
    rating: 4.5,
    ratingCount: 143,
  },
  {
    id: 'pumahuanca',
    name: 'Cataratas de Pumahuanca',
    categories: ['cataratas', 'paisajes'],
    district: 'Urubamba',
    coords: { latitude: -13.27, longitude: -72.105 },
    origin: { name: 'Urubamba', coords: TOWNS.Urubamba },
    difficulty: 'moderada',
    durationHours: 5,
    durationNote: t('Ida y vuelta desde Urubamba', 'Round trip from Urubamba'),
    altitude: 3200,
    bestSeason: t('Dic – Abr', 'Dec – Apr'),
    summary: t('Quebrada verde con bosque de queuñas', 'Green valley with queuña forest'),
    description: t(
      'Valle angosto al norte de Urubamba con riachuelos, pequeñas caídas de agua y bosques nativos.',
      'Narrow valley north of Urubamba with streams, small waterfalls and native forests.',
    ),
    route: [
      {
        mode: 'taxi',
        title: t('Mototaxi hasta Pumahuanca', 'Mototaxi to Pumahuanca'),
        detail: t('Desde la plaza de Urubamba hasta el inicio del valle.', 'From Urubamba square to the start of the valley.'),
        cost: 'S/ 8',
        time: '15 min',
      },
      {
        mode: 'walk',
        title: t('Caminata por el valle', 'Hike up the valley'),
        detail: t('Sigue el canal y el río hacia el norte.', 'Follow the canal and the river north.'),
        time: '2 h',
      },
    ],
    routeKm: 6,
    cares: ['agua', 'resbaloso', 'lluvia', 'capas'],
    signal: 'debil',
    publicTransport: true,
    rating: 4.4,
    ratingCount: 22,
  },
  {
    id: 'piuray',
    name: 'Laguna de Piuray',
    categories: ['lagunas', 'paisajes'],
    district: 'Chinchero',
    coords: { latitude: -13.41, longitude: -72.03 },
    origin: { name: 'Chinchero', coords: TOWNS.Chinchero },
    difficulty: 'facil',
    durationHours: 3,
    durationNote: t('Vuelta a la laguna', 'Around the lake'),
    altitude: 3720,
    bestSeason: t('May – Sep', 'May – Sep'),
    summary: t('Espejo de agua rodeado de chacras', 'Mirror lake surrounded by fields'),
    description: t(
      'Laguna altoandina que abastece de agua a Cusco, rodeada de chacras y comunidades. Perfecta para caminar o ir en bicicleta.',
      'High Andean lake that supplies water to Cusco, surrounded by farmland and communities. Perfect for walking or cycling.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Cusco/Urubamba → Chinchero', 'Shared van Cusco/Urubamba → Chinchero'),
        detail: t('Bájate en el pueblo de Chinchero.', 'Get off in Chinchero town.'),
        cost: 'S/ 4',
        time: '40 min',
      },
      {
        mode: 'walk',
        title: t('Caminata o bicicleta a la laguna', 'Walk or cycle to the lake'),
        detail: t('Trocha plana entre chacras.', 'Flat dirt road between fields.'),
        time: '1 h',
      },
    ],
    routeKm: 4,
    cares: ['altura', 'sol', 'frio', 'capas'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.6,
    ratingCount: 84,
  },
  {
    id: 'ipsaycocha',
    name: 'Laguna Ipsaycocha',
    categories: ['lagunas', 'nevados'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.165, longitude: -72.205 },
    origin: { name: 'Patacancha', coords: { latitude: -13.19, longitude: -72.21 } },
    difficulty: 'experto',
    durationHours: 10,
    durationNote: t('Día entero desde Patacancha', 'Full day from Patacancha'),
    altitude: 4300,
    bestSeason: t('May – Sep', 'May – Sep'),
    summary: t('Laguna glaciar bajo el abra de Ipsaycasa', 'Glacial lake below Ipsaycasa pass'),
    description: t(
      'Laguna turquesa en la ruta de Lares, rodeada de picos nevados y llamas. Solo para caminantes aclimatados.',
      'Turquoise lake on the Lares route, surrounded by snowy peaks and llamas. Only for acclimatised hikers.',
    ),
    route: [
      {
        mode: 'car',
        title: t('Transporte Ollantaytambo → Patacancha', 'Transport Ollantaytambo → Patacancha'),
        detail: t('Colectivo o taxi por la trocha del valle.', 'Shared van or taxi along the valley road.'),
        cost: 'S/ 10–60',
        time: '1 h',
      },
      {
        mode: 'walk',
        title: t('Caminata de altura', 'High-altitude hike'),
        detail: t('Sendero de ruta de Lares, sin señalización clara.', 'Lares route trail, poorly marked.'),
        time: '4 h',
      },
    ],
    routeKm: 12,
    cares: ['altura', 'frio', 'guia', 'agua', 'sol', 'capas'],
    extraCare: t('Informa a alguien tu ruta y hora de regreso.', 'Tell someone your route and return time.'),
    signal: 'nula',
    publicTransport: false,
    rating: 4.9,
    ratingCount: 18,
  },
  {
    id: 'chicon',
    name: 'Quebrada de Chicón',
    categories: ['nevados', 'paisajes', 'lagunas'],
    district: 'Urubamba',
    coords: { latitude: -13.255, longitude: -72.118 },
    origin: { name: 'Urubamba', coords: TOWNS.Urubamba },
    difficulty: 'experto',
    durationHours: 9,
    durationNote: t('Día entero', 'Full day'),
    altitude: 4200,
    bestSeason: t('May – Sep', 'May – Sep'),
    summary: t('Caminata hasta el pie del nevado Chicón', 'Hike to the foot of Mount Chicón'),
    description: t(
      'Quebrada que sube desde Urubamba hasta el glaciar del nevado Chicón (5530 m), con bosques de queuña y lagunillas glaciares.',
      'Valley climbing from Urubamba up to the glacier of Mount Chicón (5,530 m), with queuña forests and small glacial lakes.',
    ),
    route: [
      {
        mode: 'taxi',
        title: t('Taxi a la comunidad de Chicón', 'Taxi to Chicón community'),
        detail: t('Desde Urubamba por trocha.', 'From Urubamba along a dirt road.'),
        cost: 'S/ 20',
        time: '30 min',
      },
      {
        mode: 'walk',
        title: t('Ascenso por la quebrada', 'Climb up the valley'),
        detail: t('Sendero exigente y de altura.', 'Demanding high-altitude trail.'),
        time: '4 h',
      },
    ],
    routeKm: 10,
    cares: ['altura', 'frio', 'guia', 'agua', 'sol'],
    signal: 'nula',
    publicTransport: false,
    rating: 4.8,
    ratingCount: 27,
  },
  {
    id: 'moray',
    name: 'Moray',
    categories: ['arqueologia', 'paisajes'],
    district: 'Maras',
    coords: { latitude: -13.3297, longitude: -72.197 },
    origin: { name: 'Maras', coords: TOWNS.Maras },
    difficulty: 'facil',
    durationHours: 2,
    durationNote: t('Visita al sitio', 'Site visit'),
    altitude: 3500,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('Andenes circulares, laboratorio agrícola inca', 'Circular terraces, an Inca agricultural lab'),
    description: t(
      'Andenes circulares concéntricos que forman un anfiteatro natural. Combínalo con las salineras de Maras.',
      'Concentric circular terraces forming a natural amphitheatre. Combine it with the Maras salt pans.',
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XV', '15th century'),
      text: t(
        'Se cree que Moray fue un centro de experimentación agrícola: la diferencia de temperatura entre los andenes superiores e inferiores permitía aclimatar cultivos.',
        'Moray is believed to have been an agricultural research centre: the temperature difference between upper and lower terraces allowed crops to be acclimatised.',
      ),
    },
    cameraInfo: t(
      'Estás frente a los andenes circulares de Moray. Entre el nivel más alto y el más bajo puede haber varios grados de diferencia.',
      'You are facing the circular terraces of Moray. There can be several degrees of difference between the top and bottom levels.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Urubamba → cruce de Maras', 'Shared van Urubamba → Maras junction'),
        detail: t('Pide bajar en el desvío a Maras.', 'Ask to get off at the Maras turn-off.'),
        cost: 'S/ 3',
        time: '20 min',
      },
      {
        mode: 'taxi',
        title: t('Taxi del cruce a Moray', 'Taxi from junction to Moray'),
        detail: t('Taxis esperan en el cruce.', 'Taxis wait at the junction.'),
        cost: 'S/ 20–30',
        time: '20 min',
      },
    ],
    routeKm: 9,
    cares: ['entrada', 'sol', 'patrimonio', 'altura'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.6,
    ratingCount: 310,
  },
  {
    id: 'salineras',
    name: 'Salineras de Maras',
    categories: ['paisajes'],
    district: 'Maras',
    coords: { latitude: -13.3046, longitude: -72.1554 },
    origin: { name: 'Pichingoto', coords: { latitude: -13.296, longitude: -72.152 } },
    difficulty: 'facil',
    durationHours: 2,
    durationNote: t('Caminata desde Pichingoto', 'Walk from Pichingoto'),
    altitude: 3000,
    bestSeason: t('May – Nov', 'May – Nov'),
    summary: t('Miles de pozas de sal en la ladera', 'Thousands of salt ponds on the hillside'),
    description: t(
      'Más de 3000 pozas de sal trabajadas por familias de Maras desde tiempos preincas. Sube a pie desde Pichingoto para evitar los buses.',
      'More than 3,000 salt ponds worked by Maras families since pre-Inca times. Walk up from Pichingoto to avoid the tour buses.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Urubamba → Pichingoto', 'Shared van Urubamba → Pichingoto'),
        detail: t('Bájate en el puente de Pichingoto.', 'Get off at Pichingoto bridge.'),
        cost: 'S/ 2',
        time: '10 min',
      },
      {
        mode: 'walk',
        title: t('Sendero hacia las salineras', 'Trail to the salt pans'),
        detail: t('Subida suave junto al riachuelo salado.', 'Gentle climb next to the salty stream.'),
        time: '45 min',
      },
    ],
    routeKm: 2,
    cares: ['entrada', 'sol', 'resbaloso', 'efectivo'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.7,
    ratingCount: 402,
  },
  {
    id: 'urquillos',
    name: 'Camino Chinchero – Urquillos',
    categories: ['paisajes', 'arqueologia'],
    district: 'Huayllabamba',
    coords: { latitude: -13.365, longitude: -72.055 },
    origin: { name: 'Chinchero', coords: TOWNS.Chinchero },
    difficulty: 'moderada',
    durationHours: 3,
    durationNote: t('Solo de bajada', 'Downhill only'),
    altitude: 3400,
    bestSeason: t('Abr – Oct', 'Apr – Oct'),
    summary: t('Camino inca de bajada hacia el valle', 'Downhill Inca trail into the valley'),
    description: t(
      'Camino inca empedrado que baja desde las ruinas de Chinchero hasta el pueblo de Urquillos, en el valle del Vilcanota.',
      'Paved Inca trail descending from the Chinchero ruins to the village of Urquillos in the Vilcanota valley.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo a Chinchero', 'Shared van to Chinchero'),
        detail: t('Bájate en la plaza y sube al complejo arqueológico.', 'Get off at the square and walk up to the archaeological complex.'),
        cost: 'S/ 4',
        time: '40 min',
      },
      {
        mode: 'walk',
        title: t('Bajada por el camino inca', 'Descend the Inca trail'),
        detail: t('Empedrado irregular, cuida tus rodillas.', 'Uneven paving, mind your knees.'),
        time: '2 h 30 min',
      },
      {
        mode: 'taxi',
        title: t('Urquillos → Urubamba', 'Urquillos → Urubamba'),
        detail: t('Taxi o colectivo desde el puente de Huayllabamba.', 'Taxi or shared van from the Huayllabamba bridge.'),
        cost: 'S/ 3–20',
        time: '20 min',
      },
    ],
    routeKm: 8,
    cares: ['agua', 'sol', 'sendero', 'capas'],
    signal: 'debil',
    publicTransport: true,
    rating: 4.6,
    ratingCount: 45,
  },
  {
    id: 'chinchero-arqueologico',
    name: 'Complejo de Chinchero',
    categories: ['arqueologia'],
    district: 'Chinchero',
    coords: { latitude: -13.3915, longitude: -72.049 },
    origin: { name: 'Chinchero', coords: TOWNS.Chinchero },
    difficulty: 'facil',
    durationHours: 2,
    durationNote: t('Visita al sitio', 'Site visit'),
    altitude: 3760,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('Palacio de Túpac Yupanqui e iglesia colonial', "Túpac Yupanqui's palace and colonial church"),
    description: t(
      'Andenes, muros incas y una iglesia colonial construida sobre el palacio inca. Los domingos hay feria tradicional.',
      'Terraces, Inca walls and a colonial church built on top of the Inca palace. Traditional market on Sundays.',
    ),
    history: {
      culture: t('Cultura inca · colonial', 'Inca · colonial'),
      period: t('Siglos XV – XVII', '15th – 17th c.'),
      text: t(
        'Residencia del inca Túpac Yupanqui. Sobre sus muros se levantó en 1607 la iglesia de Nuestra Señora de Montserrat, decorada con pintura mural.',
        'Residence of the Inca Túpac Yupanqui. The church of Our Lady of Montserrat, decorated with murals, was built on its walls in 1607.',
      ),
    },
    cameraInfo: t(
      'Estás frente a los muros del palacio inca de Chinchero. Nota cómo la iglesia colonial se asienta sobre la mampostería inca.',
      "You are facing the walls of Chinchero's Inca palace. Notice how the colonial church sits on the Inca stonework.",
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo a Chinchero', 'Shared van to Chinchero'),
        detail: t('Desde Urubamba o Cusco.', 'From Urubamba or Cusco.'),
        cost: 'S/ 4',
        time: '40 min',
      },
      {
        mode: 'walk',
        title: t('Subida al complejo', 'Walk up to the complex'),
        detail: t('Calles empedradas desde la plaza.', 'Cobbled streets from the square.'),
        time: '10 min',
      },
    ],
    routeKm: 0.5,
    cares: ['entrada', 'altura', 'patrimonio', 'frio'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.5,
    ratingCount: 188,
  },
  {
    id: 'mirador-raqchi',
    name: 'Mirador de Raqchi',
    categories: ['miradores', 'paisajes'],
    district: 'Chinchero',
    coords: { latitude: -13.3474, longitude: -72.0948 },
    origin: { name: 'Urubamba', coords: TOWNS.Urubamba },
    difficulty: 'facil',
    durationHours: 1,
    durationNote: t('Parada en la carretera', 'Roadside stop'),
    altitude: 3600,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('La mejor vista del Valle Sagrado', 'The best view of the Sacred Valley'),
    description: t(
      'Mirador sobre la carretera Chinchero–Urubamba con vista a la cordillera Urubamba y el nevado Chicón.',
      'Viewpoint on the Chinchero–Urubamba road overlooking the Urubamba range and Mount Chicón.',
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Urubamba → Chinchero', 'Shared van Urubamba → Chinchero'),
        detail: t('Pide bajar en el mirador.', 'Ask to get off at the viewpoint.'),
        cost: 'S/ 3',
        time: '20 min',
      },
    ],
    routeKm: 6,
    cares: ['sol', 'frio'],
    extraCare: t('Cuidado al cruzar la carretera.', 'Be careful crossing the road.'),
    signal: 'buena',
    publicTransport: true,
    rating: 4.7,
    ratingCount: 76,
  },
  {
    id: 'yucay',
    name: 'Palacio de Sayri Túpac',
    categories: ['arqueologia'],
    district: 'Yucay',
    coords: { latitude: -13.3205, longitude: -72.0838 },
    origin: { name: 'Yucay', coords: TOWNS.Yucay },
    difficulty: 'facil',
    durationHours: 1,
    durationNote: t('Paseo por el pueblo', 'Walk around town'),
    altitude: 2860,
    bestSeason: t('Todo el año', 'All year'),
    summary: t('Muros incas de adobe en la plaza de Yucay', 'Inca adobe walls on Yucay square'),
    description: t(
      'Restos del palacio del inca Sayri Túpac y andenes que todavía se cultivan, en un pueblo tranquilo del valle.',
      "Remains of Inca Sayri Túpac's palace and terraces still under cultivation, in a quiet valley town.",
    ),
    history: {
      culture: t('Cultura inca', 'Inca culture'),
      period: t('Siglo XVI', '16th century'),
      text: t(
        'Sayri Túpac, inca de Vilcabamba, se estableció en Yucay tras pactar con los españoles en 1558. Su palacio combina adobe y piedra.',
        'Sayri Túpac, Inca of Vilcabamba, settled in Yucay after making a pact with the Spanish in 1558. His palace combines adobe and stone.',
      ),
    },
    cameraInfo: t(
      'Estás frente al palacio de Sayri Túpac. Observa las portadas de doble jamba, signo de un recinto importante.',
      "You are facing Sayri Túpac's palace. Notice the double-jamb doorways, a sign of an important building.",
    ),
    route: [
      {
        mode: 'bus',
        title: t('Colectivo Urubamba → Yucay', 'Shared van Urubamba → Yucay'),
        detail: t('Cualquier colectivo hacia Calca o Pisac pasa por Yucay.', 'Any van towards Calca or Pisac passes through Yucay.'),
        cost: 'S/ 1',
        time: '10 min',
      },
    ],
    routeKm: 3,
    cares: ['patrimonio', 'sol'],
    signal: 'buena',
    publicTransport: true,
    rating: 4.3,
    ratingCount: 29,
  },
  {
    id: 'patacancha',
    name: 'Andenes de Patacancha',
    categories: ['paisajes', 'arqueologia'],
    district: 'Ollantaytambo',
    coords: { latitude: -13.205, longitude: -72.222 },
    origin: { name: 'Ollantaytambo', coords: TOWNS.Ollantaytambo },
    difficulty: 'moderada',
    durationHours: 4,
    durationNote: t('Caminata por comunidades', 'Walk through communities'),
    altitude: 3500,
    bestSeason: t('Abr – Oct', 'Apr – Oct'),
    summary: t('Comunidades tejedoras y andenes en el valle', 'Weaving communities and valley terraces'),
    description: t(
      'Valle de comunidades quechuas como Willoq y Patacancha, famosas por sus tejidos de colores y andenes en uso.',
      'Valley of Quechua communities like Willoq and Patacancha, famous for colourful textiles and terraces still in use.',
    ),
    cameraInfo: t(
      'Estás frente a andenes del valle de Patacancha, todavía cultivados por las comunidades.',
      'You are facing terraces in the Patacancha valley, still farmed by local communities.',
    ),
    route: [
      {
        mode: 'car',
        title: t('Colectivo Ollantaytambo → Patacancha', 'Shared van Ollantaytambo → Patacancha'),
        detail: t('Salen temprano desde el mercado.', 'They leave early from the market.'),
        cost: 'S/ 10',
        time: '45 min',
      },
      {
        mode: 'walk',
        title: t('Caminata entre comunidades', 'Walk between communities'),
        detail: t('Pide permiso antes de fotografiar a las personas.', 'Ask permission before photographing people.'),
        time: '2 h',
      },
    ],
    routeKm: 8,
    cares: ['altura', 'agua', 'efectivo', 'capas'],
    signal: 'debil',
    publicTransport: true,
    rating: 4.7,
    ratingCount: 39,
  },
  {
    id: 'putucusi',
    name: 'Montaña Putucusi',
    categories: ['miradores', 'paisajes'],
    district: 'Machupicchu',
    coords: { latitude: -13.153, longitude: -72.52 },
    origin: { name: 'Machupicchu Pueblo', coords: TOWNS.Machupicchu },
    difficulty: 'experto',
    durationHours: 4,
    durationNote: t('Subida con escaleras de madera', 'Climb with wooden ladders'),
    altitude: 2560,
    bestSeason: t('May – Oct', 'May – Oct'),
    summary: t('Vista frontal de Machupicchu sin pagar boleto', 'Front view of Machu Picchu without a ticket'),
    description: t(
      'Montaña frente a Machupicchu con escaleras verticales. Vista única de la ciudadela. Verifica antes si el acceso está abierto.',
      'Mountain facing Machu Picchu with vertical ladders. Unique view of the citadel. Check beforehand whether access is open.',
    ),
    route: [
      {
        mode: 'walk',
        title: t('Desde Machupicchu Pueblo', 'From Machupicchu town'),
        detail: t('Camina por la vía del tren hasta el inicio del sendero.', 'Walk along the tracks to the trailhead.'),
        time: '10 min',
      },
      {
        mode: 'walk',
        title: t('Ascenso con escaleras', 'Climb with ladders'),
        detail: t('Tramos verticales. No apto si sufres de vértigo.', 'Vertical sections. Not suitable if you suffer from vertigo.'),
        time: '1 h 30 min',
      },
    ],
    routeKm: 2,
    cares: ['resbaloso', 'lluvia', 'agua', 'guia'],
    extraCare: t('No subas con lluvia: las escaleras se vuelven muy peligrosas.', 'Do not climb in the rain: the ladders become very dangerous.'),
    signal: 'debil',
    publicTransport: true,
    rating: 4.8,
    ratingCount: 64,
  },
];


// ---------------------------------------------------------------------------
// Datos oficiales (MINCETUR) + capa curada
// ---------------------------------------------------------------------------

type OfficialItem = (typeof officialData.items)[number];

export const OFFICIAL_SOURCE = {
  name: officialData.source,
  license: officialData.license,
  url: officialData.url,
  date: officialData.generatedAt,
};

/** Lugar curado → código de ficha oficial */
const LINKS: Record<string, string> = {
  pumamarca: '3702',
  pinkuylluna: '7227',
  'intipunku-ollantaytambo': '7191',
  kachiqhata: '3665',
  perolniyoc: '3704',
  mandor: '3674',
  piuray: '2682',
  moray: '1814',
  salineras: '1813',
  'chinchero-arqueologico': '937',
  'mirador-raqchi': '7225',
  yucay: '1779',
  patacancha: '3707',
  putucusi: '11012',
};

/**
 * Coordenadas oficiales que contradicen la ruta de acceso de su propia ficha.
 * Se mantiene la coordenada curada hasta verificar en campo.
 */
const KEEP_CURATED_COORDS = new Set(['perolniyoc']);

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function seasonOf(h?: string): LTextT {
  if (!h || /todo el a[ñn]o/i.test(h)) return t('Todo el año', 'All year');
  const s = h.split('·')[0].trim();
  return t(s, s);
}
type LTextT = { es: string; en: string };

function caresOf(o: OfficialItem, cats: Category[]): CareKey[] {
  const c: CareKey[] = [];
  if ((o.alt ?? 0) >= 3300) c.push('altura');
  if (o.ingreso && /boleto|ticket|pago|tarifa/i.test(o.ingreso)) c.push('entrada');
  if (cats.some((x) => ['paisajes', 'lagunas', 'cataratas', 'nevados', 'miradores', 'aventura'].includes(x))) c.push('agua', 'sol');
  if (cats.includes('arqueologia')) c.push('patrimonio');
  if (o.ruta.some((r) => r.mode === 'walk')) c.push('sendero');
  if (cats.includes('cataratas')) c.push('resbaloso');
  if (o.kind === 'place' && /pueblo|comunidad|tradicional/i.test(o.name + o.subtipo)) c.push('efectivo');
  if (o.difficulty === 'dificil' || o.difficulty === 'experto') c.push('guia');
  return [...new Set(c)].slice(0, 6) as CareKey[];
}

function officialBlock(o: OfficialItem): NonNullable<Place['official']> {
  return {
    code: o.code,
    url: o.url,
    subtype: o.subtipo,
    description: o.desc,
    toponymy: o.toponimia,
    reference: o.referencia,
    state: o.estado,
    entry: o.ingreso,
    hours: o.horario,
    activities: o.acts,
  };
}

function fromOfficial(o: OfficialItem): Place {
  const district = o.district as District;
  const cats = (o.categories.length ? o.categories : ['cultura']) as Category[];
  const route: RouteStep[] = o.ruta.map((r) => ({
    mode: r.mode as RouteStep['mode'],
    title: r.title,
    detail: r.detail,
    time: r.time,
  }));
  const publicTransport = o.ruta.some((r) => /público|combi|colectivo|tren|estación/i.test(r.detail.es + r.title.es)) || o.routeKm < 1;
  return {
    id: `${slug(o.name)}-${o.code}`,
    name: o.name,
    categories: cats,
    district,
    coords: { latitude: o.lat, longitude: o.lon },
    origin: { name: district, coords: TOWNS[district] ?? PROVINCE_CENTER },
    difficulty: o.difficulty as Place['difficulty'],
    durationHours: o.hours,
    durationNote: t('Estimado según la ficha oficial', 'Estimated from the official record'),
    altitude: o.alt ?? 0,
    bestSeason: seasonOf(o.horario),
    summary: o.summary,
    description: o.summary,
    route,
    routeKm: o.routeKm,
    cares: caresOf(o, cats),
    signal: 'desconocida',
    publicTransport,
    rating: 0,
    ratingCount: 0,
    photos: o.fotos,
    source: 'mincetur',
    kind: o.kind as Place['kind'],
    estimated: true,
    official: officialBlock(o),
  };
}

function merge(c: CuratedPlace, o: OfficialItem): Place {
  return {
    ...c,
    district: (o.district as District) ?? c.district,
    coords: KEEP_CURATED_COORDS.has(c.id) ? c.coords : { latitude: o.lat, longitude: o.lon },
    altitude: o.alt ?? c.altitude,
    categories: [...new Set([...c.categories, ...(o.categories as Category[])])],
    rating: 0,
    ratingCount: 0,
    photos: o.fotos,
    source: 'mincetur',
    kind: 'place',
    estimated: false,
    official: officialBlock(o),
  };
}

const byCode = new Map(officialData.items.map((o) => [o.code, o]));
const linkedCodes = new Set(Object.values(LINKS));

export const PLACES: Place[] = [
  ...CURATED.map((c) => {
    const o = LINKS[c.id] ? byCode.get(LINKS[c.id]) : undefined;
    return o ? merge(c, o) : ({ ...c, rating: 0, ratingCount: 0, source: 'curado', kind: 'place' } as Place);
  }),
  ...officialData.items.filter((o) => !linkedCodes.has(o.code)).map(fromOfficial),
];

const extra: Place[] = [];
/** Lugares aportados por la comunidad y aprobados (se cargan desde el servidor) */
export function setCommunityPlaces(list: Place[]) {
  extra.splice(0, extra.length, ...list);
}
export const allPlaces = () => (extra.length ? [...PLACES, ...extra] : PLACES);
export const getPlace = (id: string) => PLACES.find((p) => p.id === id) ?? extra.find((p) => p.id === id);
