/**
 * DATOS DE DEMOSTRACIÓN para presentaciones.
 * Reseñas ficticias pero verosímiles sobre lugares reales (MINCETUR).
 * Se pueden desactivar en Perfil → "Datos de demostración".
 * Clave: id del lugar curado o código de la ficha MINCETUR.
 */
type R = [author: string, country: string, visited: string, rating: number, lang: 'es' | 'en', text: string, tip?: string];

export const DEMO_REVIEWS: Record<string, R[]> = {
  pumamarca: [
    ['Rosa Quispe', 'Perú', '2026-10', 5, 'es', 'Fuimos con mi familia desde Cusco. La comunidad es muy amable y el sitio está tranquilo, sin colas. Los andenes con los canales todavía funcionando son impresionantes.', 'Lleva sencillo: en la comunidad venden chicha y no hay vuelto.'],
    ['Lucía Morales', 'Chile', '2026-08', 5, 'es', 'Casi no había nadie. Las vistas del valle de Patacancha son increíbles y los recintos están muy bien conservados.', 'Sal antes de las 8 a. m. para evitar el sol fuerte en la subida.'],
    ['Tom Keller', 'Alemania', '2026-07', 4, 'en', 'Beautiful and quiet. The trail from Ollantaytambo is steeper than it looks but totally worth it.', 'Take a taxi up and walk back down to Ollantaytambo.'],
  ],
  pinkuylluna: [
    ['Julia Sánchez', 'Argentina', '2026-09', 5, 'es', 'Gratis y con la mejor vista de Ollantaytambo. La subida es corta pero empinada.', 'Ve en la tarde para ver la fortaleza con luz dorada.'],
    ['Emma Johnson', 'Estados Unidos', '2026-06', 4, 'en', 'Short but steep climb with stone steps. The storehouses and the view of the town are amazing.', 'Wear proper shoes, some steps are narrow.'],
  ],
  'intipunku-ollantaytambo': [
    ['Diego Huamán', 'Perú', '2026-07', 5, 'es', 'La caminata es larga, pero llegar a la portada con el nevado Verónica al frente no tiene precio.', 'Lleva al menos 2 litros de agua; no hay dónde comprar.'],
    ['Sophie Martin', 'Francia', '2026-05', 4, 'en', 'Tough hike with almost no other people. Amazing views of the Sacred Valley and the glacier.', 'Start early, the afternoon wind is strong.'],
  ],
  kachiqhata: [
    ['Andrés Paredes', 'Colombia', '2026-08', 4, 'es', 'Ver las "piedras cansadas" en el camino ayuda a entender cómo construyeron Ollantaytambo. Poca sombra.', 'Sombrero y bloqueador sí o sí.'],
  ],
  perolniyoc: [
    ['Andrea Vargas', 'Perú', '2026-03', 5, 'es', 'La catarata en época de lluvias es impresionante. El camino desde Socma es exigente pero vale cada paso.', 'Contrata el taxi de ida y vuelta: en Socma casi no pasan carros.'],
    ['Liam O’Brien', 'Irlanda', '2026-04', 5, 'en', 'One of the best day hikes in the valley. The waterfall and the Inca ruins above it are stunning.', 'Pay the small community fee in cash.'],
    ['Camila Rojas', 'Perú', '2026-09', 4, 'es', 'En septiembre tenía menos agua, pero igual muy bonita. El sendero tiene partes resbalosas.', 'Usa zapatillas con buen agarre.'],
  ],
  mandor: [
    ['Kenji Tanaka', 'Japón', '2026-06', 4, 'en', 'Easy walk along the train tracks from Aguas Calientes. Lots of birds and orchids, very peaceful.', 'Keep away from the tracks when you hear a train.'],
    ['Valeria Gómez', 'México', '2026-02', 5, 'es', 'Perfecto para la tarde libre después de Machu Picchu. Vimos colibríes y un gallito de las rocas.', 'Lleva repelente.'],
  ],
  pumahuanca: [
    ['Miguel Ccahuana', 'Perú', '2026-01', 4, 'es', 'Quebrada muy verde con bosque de queuñas a pocos minutos de Urubamba. Ideal para escaparse un día.', 'Después del mediodía suele llover en verano.'],
  ],
  piuray: [
    ['Marc Dubois', 'Francia', '2026-06', 5, 'en', 'Rented a bike in Chinchero and rode around the lake. Peaceful and stunning at sunset.', 'It gets very cold after 5 pm, bring gloves.'],
    ['Patricia León', 'Perú', '2026-07', 4, 'es', 'Laguna tranquila rodeada de chacras. Nos encontramos con pastores y sus ovejas.', 'Combínalo con la feria de Chinchero del domingo.'],
  ],
  ipsaycocha: [
    ['Hannah Weber', 'Suiza', '2026-07', 5, 'en', 'A turquoise lake under snowy peaks and llamas everywhere. Hard at this altitude, but magical.', 'Acclimatise at least 3 days in Cusco before.'],
  ],
  chicon: [
    ['Raúl Mamani', 'Perú', '2026-08', 5, 'es', 'Subir hasta ver el glaciar del Chicón de cerca fue lo mejor del viaje. Hay que ir con guía local.', 'Sal a las 6 a. m.; la caminata dura casi todo el día.'],
  ],
  moray: [
    ['Carmen Ruiz', 'España', '2026-04', 4, 'es', 'Impresiona ver los andenes circulares desde arriba. Se puede bajar hasta el círculo central.', 'Combínalo con las salineras el mismo día, están cerca.'],
    ['James Carter', 'Reino Unido', '2026-09', 5, 'en', 'Fascinating Inca agricultural site. Our guide explained the temperature differences between levels.', 'The boleto turístico includes Moray.'],
  ],
  salineras: [
    ['Kenji Tanaka', 'Japón', '2026-05', 4, 'en', 'Walking up from Pichingoto was the highlight, almost no tourists on the trail.', 'Buy pink salt from the families, it supports the community.'],
    ['Fernanda Lima', 'Brasil', '2026-10', 5, 'es', 'Miles de pozas blancas en la ladera, un paisaje único. Las familias explican cómo trabajan la sal.', 'Ve temprano para mejores fotos.'],
  ],
  urquillos: [
    ['Gabriel Torres', 'Perú', '2026-05', 5, 'es', 'Bajar desde Chinchero por el camino inca hasta Urquillos es precioso: el valle se abre de golpe.', 'Cuida las rodillas, el empedrado es irregular.'],
  ],
  'chinchero-arqueologico': [
    ['Isabel Fernández', 'España', '2026-08', 5, 'es', 'La iglesia colonial con sus pinturas murales sobre muros incas es preciosa. El domingo hay feria.', 'Ve el domingo por la feria y quédate al atardecer.'],
  ],
  'mirador-raqchi': [
    ['Noah Williams', 'Canadá', '2026-06', 5, 'en', 'The best panoramic view of the Sacred Valley and the Urubamba range. A must stop on the road.', 'Ask the van driver to stop for 10 minutes.'],
  ],
  patacancha: [
    ['Elena Castro', 'Perú', '2026-07', 5, 'es', 'Las comunidades tejedoras son increíbles. Compramos directamente a las familias.', 'Pide permiso antes de fotografiar a las personas.'],
  ],
  putucusi: [
    ['Lucas Schmidt', 'Alemania', '2026-06', 4, 'en', 'Very steep ladders, not for everyone. The view of Machu Picchu from the front is unique.', 'Do not climb if it rained, the ladders get slippery.'],
  ],
  // Códigos MINCETUR
  '3661': [
    ['Pedro Álvarez', 'Perú', '2026-08', 4, 'es', 'Laguna grande y tranquila, ideal para kayak. Vimos muchas aves.', 'Lleva casaca: el viento es frío.'],
  ],
  '938': [
    ['Olivia Brown', 'Australia', '2026-07', 5, 'en', 'The fortress-temple and its terraces are spectacular. Climb to the top for the best view.', 'Go at 7 am before the tour groups arrive.'],
    ['Martín Díaz', 'Uruguay', '2026-05', 5, 'es', 'El templo del sol con esos bloques enormes es impresionante. Ollantaytambo es un pueblo inca vivo.', 'Usa el boleto turístico parcial.'],
  ],
  '917': [
    ['Ana Lucía Prado', 'Perú', '2026-09', 5, 'es', 'Machu Picchu siempre emociona. Compramos las entradas con anticipación y llegamos en el primer bus.', 'Compra las entradas con semanas de anticipación.'],
  ],
  '11360': [
    ['Sara Medina', 'Ecuador', '2026-03', 4, 'es', 'Catarata escondida muy cerca de Chinchero, camino corto y bonito.', 'Pregunta en el mercado artesanal por el inicio del camino.'],
  ],
  '13089': [
    ['Joaquín Herrera', 'Perú', '2026-06', 4, 'es', 'Sitio arqueológico poco visitado arriba de Urubamba, con vista a todo el valle.', 'Sube temprano, hay poca sombra.'],
  ],
  '12387': [
    ['Clara Núñez', 'Perú', '2026-04', 4, 'es', 'El palacio de Huayna Cápac (Quispiguanca) está en el mismo Urubamba y casi nadie lo conoce.', 'Puedes ir caminando desde la plaza.'],
  ],
  '3705': [
    ['Mia Rossi', 'Italia', '2026-08', 5, 'en', 'Weaving demonstration in Huilloc was the most authentic experience of our trip.', 'Bring cash to buy textiles directly from the weavers.'],
  ],
  '13575': [
    ['Felipe Ortiz', 'Perú', '2026-07', 4, 'es', 'Desde Ollantaytambo se ve clarito el rostro de Tunupa en la montaña. Muy curioso.', 'Pide a un guía local que te lo señale.'],
  ],
  '7238': [
    ['Daniela Paz', 'Bolivia', '2026-05', 4, 'es', 'Un santuario inca tallado dentro de una cueva. Pequeño pero muy especial.', 'Combínalo con la visita a Ollantaytambo.'],
  ],
  '2686': [
    ['Ethan Clark', 'Estados Unidos', '2026-09', 5, 'en', 'Sunday market in Chinchero is colourful and real. Great place to buy textiles.', 'Arrive before 10 am.'],
  ],
  '2684': [
    ['Luciana Vera', 'Argentina', '2026-06', 4, 'es', 'Después de Machu Picchu, los baños termales son el mejor descanso.', 'Lleva sandalias y toalla.'],
  ],
  '13712': [
    ['Thomas Müller', 'Austria', '2026-07', 5, 'en', 'Paucarcancha is a peaceful Inca site on the trail, few people and great scenery.', 'Bring snacks, no shops nearby.'],
  ],
  '14240': [
    ['Renata Silva', 'Brasil', '2026-02', 4, 'es', 'Mirador corto desde Machupicchu Pueblo con buena observación de aves.', 'Ve al amanecer para ver más aves.'],
  ],
};
