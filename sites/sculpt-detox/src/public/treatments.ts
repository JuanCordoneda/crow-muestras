/**
 * Los tratamientos de Sculpt Detox, en castellano e inglés. Es lo que sale en las tarjetas, en el
 * desplegable de la reserva y en la ficha para Google.
 *
 * Precio y duración se rellenan aquí:
 * - `price`: el «desde», en euros (`45`). Mientras sea `null`, la web enseña «Desde XX €».
 * - `minutes`: la duración de la sesión (`60`). Mientras sea `null`, la web enseña «XX min».
 * - `photo`: opcional (`/img/sculptdetox/maderoterapia.webp`). Sin foto, la tarjeta va solo con texto.
 *
 * El `id` no se cambia: es el que lleva el enlace «Reservar» de cada tarjeta.
 */
import type { SiteLang } from '../shared/routing'

type Text = Record<SiteLang, string>
const tx = (es: string, en: string): Text => ({ es, en })

export type TreatmentGroup = 'corporal' | 'facial'

export type Treatment = {
  id: string
  group: TreatmentGroup
  name: Text
  text: Text
  price: number | null
  minutes: number | null
  photo?: string
  /** Niveles con su propio precio (Hydrafacial). Cada uno se reserva por separado. */
  tiers?: { id: string; name: Text; text: Text; price: number | null; minutes: number | null }[]
}

export const TREATMENTS: Treatment[] = [
  /* ---------- corporales ---------- */
  {
    id: 'drenaje-brasileno',
    group: 'corporal',
    name: tx('Drenaje linfático manual brasileño', 'Brazilian manual lymphatic drainage'),
    text: tx(
      'Maniobras rítmicas y firmes, inspiradas en la técnica brasileña, que activan la circulación linfática. Ayuda a reducir la retención de líquidos y la sensación de hinchazón: el cuerpo se nota más ligero y la silueta, más definida.',
      'Rhythmic, firm strokes inspired by the Brazilian technique to boost lymphatic flow. It helps reduce fluid retention and that bloated feeling, so your body feels lighter and your silhouette looks more defined.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'drenaje-postquirurgico',
    group: 'corporal',
    name: tx('Drenaje linfático post-quirúrgico', 'Post-surgical lymphatic drainage'),
    text: tx(
      'Técnica suave y adaptada a cada fase de la recuperación tras una cirugía estética (liposucción, abdominoplastia, lipoescultura…). Acompaña la reducción de la inflamación y de la tirantez. Siempre con la indicación de tu cirujano.',
      'A gentle technique adapted to each stage of recovery after cosmetic surgery (liposuction, tummy tuck, liposculpture…). It supports the reduction of swelling and tightness. Always with your surgeon’s approval.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'maderoterapia',
    group: 'corporal',
    name: tx('Maderoterapia', 'Wood therapy'),
    text: tx(
      'Masaje con instrumentos de madera de distintas formas que trabajan el tejido en profundidad. Moldea la silueta, activa la circulación y mejora el aspecto de la piel de naranja en piernas, glúteos y abdomen.',
      'Massage with wooden tools of different shapes that work the tissue in depth. It contours the silhouette, boosts circulation and improves the look of orange-peel skin on legs, buttocks and abdomen.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'anticelulitis',
    group: 'corporal',
    name: tx('Tratamiento anticelulitis', 'Anti-cellulite treatment'),
    text: tx(
      'Protocolo por zonas que combina técnicas manuales intensas y activos específicos. Trabaja la celulitis desde la circulación y el tejido para una piel más lisa, uniforme y tonificada sesión a sesión.',
      'A zone-by-zone protocol combining intensive manual techniques with targeted active ingredients. It tackles cellulite through circulation and tissue work, for smoother, more even and toned skin session after session.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'reafirmante',
    group: 'corporal',
    name: tx('Tratamiento reafirmante (flacidez)', 'Firming treatment (skin laxity)'),
    text: tx(
      'Estimula la firmeza y la elasticidad de la piel en abdomen, brazos, glúteos o piernas. Pensado para después de una pérdida de peso, de un embarazo o cuando la piel ha perdido tono.',
      'Stimulates skin firmness and elasticity on the abdomen, arms, buttocks or legs. Designed for after weight loss, after pregnancy, or whenever skin has lost its tone.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'detox-corporal',
    group: 'corporal',
    name: tx('Tratamiento detox corporal', 'Body detox treatment'),
    text: tx(
      'Exfoliación, envoltura con activos naturales y maniobras de drenaje en una misma sesión. Una puesta a punto completa para sentir el cuerpo desinflamado, ligero y con la piel renovada.',
      'Exfoliation, a wrap with natural actives and drainage techniques in a single session. A full reset to leave your body feeling de-puffed, light and with renewed skin.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'descontracturante',
    group: 'corporal',
    name: tx('Masaje descontracturante', 'Deep tissue massage'),
    text: tx(
      'Presión profunda sobre cuello, espalda y hombros para soltar nudos y contracturas. Para quien pasa muchas horas sentado, entrena a menudo o acumula el estrés en la espalda.',
      'Deep pressure on the neck, back and shoulders to release knots and muscle tension. For anyone who sits for long hours, trains often or carries stress in their back.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'relajante',
    group: 'corporal',
    name: tx('Masaje relajante', 'Relaxing massage'),
    text: tx(
      'Movimientos lentos y envolventes con aceites naturales para bajar el ritmo, calmar la mente y descansar de verdad. Un rato solo para ti.',
      'Slow, enveloping movements with natural oils to slow down, quiet the mind and truly rest. Time just for you.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'embarazadas',
    group: 'corporal',
    name: tx('Masaje para embarazadas', 'Pregnancy massage'),
    text: tx(
      'Masaje suave, en una postura cómoda y segura, que alivia la pesadez de piernas, la zona lumbar y la tensión propias del embarazo. Habitualmente a partir del segundo trimestre y con el visto bueno de tu matrona o ginecóloga.',
      'A gentle massage in a comfortable, safe position that eases heavy legs, lower-back discomfort and the tension that comes with pregnancy. Usually from the second trimester, with your midwife’s or doctor’s approval.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'infrarrojo',
    group: 'corporal',
    name: tx('Infrarrojo', 'Infrared therapy'),
    text: tx(
      'Calor infrarrojo que relaja la musculatura, favorece la sudoración y potencia el efecto del drenaje o la maderoterapia. Se puede hacer solo o como complemento de otro tratamiento.',
      'Infrared heat that relaxes the muscles, promotes sweating and enhances the effect of drainage or wood therapy. It can be booked on its own or added to another treatment.',
    ),
    price: null,
    minutes: null,
  },

  /* ---------- faciales ---------- */
  {
    id: 'gua-sha',
    group: 'facial',
    name: tx('Gua Sha', 'Gua Sha'),
    text: tx(
      'Piedra de jade deslizada sobre el rostro siguiendo el recorrido linfático. Descongestiona, relaja la mandíbula y aporta luz: el rostro se ve más descansado y definido.',
      'A jade stone glided over the face along the lymphatic pathways. It decongests, relaxes the jaw and brings radiance, leaving the face looking rested and more defined.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'drenaje-facial',
    group: 'facial',
    name: tx('Drenaje linfático facial', 'Facial lymphatic drainage'),
    text: tx(
      'Maniobras muy suaves que ayudan a deshinchar párpados, ojeras y contorno. Ideal para pieles congestionadas, al despertar con el rostro hinchado o antes de un evento.',
      'Very gentle techniques that help de-puff eyelids, under-eye area and jawline. Ideal for congested skin, puffy mornings or before a special event.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'hydrafacial',
    group: 'facial',
    name: tx('Hydrafacial', 'Hydrafacial'),
    text: tx(
      'Limpieza facial profunda en tres niveles, según lo que pida tu piel.',
      'Deep facial cleansing in three levels, depending on what your skin needs.',
    ),
    price: null,
    minutes: null,
    tiers: [
      {
        id: 'hydrafacial-standard',
        name: tx('Hydrafacial Standard', 'Hydrafacial Standard'),
        text: tx('Limpieza superficial, manual y sin aparatología: piel limpia e hidratada.', 'A gentle surface cleanse done by hand, without devices: clean, hydrated skin.'),
        price: null,
        minutes: null,
      },
      {
        id: 'hydrafacial-deluxe',
        name: tx('Hydrafacial Deluxe', 'Hydrafacial Deluxe'),
        text: tx('Limpieza media con dos aparatos: exfolia, extrae impurezas e hidrata en profundidad.', 'A medium-depth cleanse with two devices: exfoliates, extracts impurities and deeply hydrates.'),
        price: null,
        minutes: null,
      },
      {
        id: 'hydrafacial-platinum',
        name: tx('Hydrafacial Platinum', 'Hydrafacial Platinum'),
        text: tx('La limpieza más completa, de principio a fin, para una piel renovada y luminosa.', 'The most complete cleanse, from start to finish, for renewed, glowing skin.'),
        price: null,
        minutes: null,
      },
    ],
  },
  {
    id: 'detox-face',
    group: 'facial',
    name: tx('Detox Face', 'Detox Face'),
    text: tx(
      'Limpieza y oxigenación para pieles apagadas, con poros obstruidos o castigadas por el sol. Devuelve frescor y luminosidad al rostro.',
      'Cleansing and oxygenation for dull skin, clogged pores or sun-stressed skin. Brings freshness and glow back to your face.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'sculpt-face',
    group: 'facial',
    name: tx('Sculpt Face', 'Sculpt Face'),
    text: tx(
      'Masaje esculpidor con técnicas manuales profundas, también intraorales, que trabajan la musculatura del rostro. Pómulos más marcados, óvalo más definido y efecto tensor natural, sin agujas.',
      'A sculpting massage with deep manual techniques, including intraoral work, targeting the facial muscles. More lifted cheekbones, a sharper jawline and a natural tightening effect, with no needles.',
    ),
    price: null,
    minutes: null,
  },
  {
    id: 'masaje-facial',
    group: 'facial',
    name: tx('Masaje facial', 'Facial massage'),
    text: tx(
      'Masaje relajante de rostro, cuello y escote que suelta la tensión de la frente y la mandíbula. Un momento de calma que se nota en la expresión.',
      'A relaxing massage for face, neck and décolleté that releases tension in the forehead and jaw. A moment of calm that shows in your expression.',
    ),
    price: null,
    minutes: null,
  },
]

/**
 * Lo que se puede reservar: cada tratamiento y, en el Hydrafacial, cada nivel por separado.
 * Es la lista del desplegable del formulario.
 */
export const BOOKABLE = TREATMENTS.flatMap((treatment) =>
  treatment.tiers
    ? treatment.tiers.map((tier) => ({ id: tier.id, group: treatment.group, name: tier.name }))
    : [{ id: treatment.id, group: treatment.group, name: treatment.name }],
)
