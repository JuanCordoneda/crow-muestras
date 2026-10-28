/**
 * Los locales del grupo Mexi-and-Co en el Quartier Latin: datos, horario y carta.
 *
 * Todo lo que cambia de un local a otro vive aquí, no en los textos de la web: la dirección, el
 * teléfono, el horario (con el mismo modelo `DayHours` del resto de la app, así que «abierto
 * ahora», las horas de reserva y la ficha de Google salen del mismo cálculo) y la carta.
 *
 * La carta va **sin precios**: cada plato tiene `price` vacío y la web dice «Prix sur place». En
 * cuanto el restaurante dé los precios, basta con escribirlos aquí (en euros) y se enseñan solos.
 *
 * Le 1492 no está aquí: vive entero en `components/Le1492.tsx`, para poder quitarlo de un golpe si
 * el local ya no existe. Mientras tanto se enseña o se esconde con `SHOW_LE_1492`, más abajo.
 */
import type { DayHours, Lang, Settings } from '../shared/types'

/** Texto de la web en francés (el de referencia) y en castellano. */
export type FrEs = { fr: string; es: string }

export const say = (text: FrEs, lang: Lang) => (lang === 'es' ? text.es : text.fr)

/** Dominio de la web. PENDIENTE: confirmar con el cliente; hasta entonces, canónicos y og:url apuntan aquí. */
export const SITE_URL = 'https://www.mexiandco.fr'

/** El WhatsApp que recibe todas las reservas del grupo (el de El Sol & La Luna). */
export const BOOKING_WHATSAPP = '33624438023'

/**
 * LE-1492: el interruptor de Le 1492. Apagado (`false`) porque no hay fotos, ni carta, ni horario:
 * el local no sale en ninguna parte (portada, menú, pie, reservas, ficha de Google, `index.html` y
 * `llms.txt`, que limpia `scripts/pages.mjs` en el build) y los textos hablan de dos direcciones en
 * el 5e. Para enseñarlo otra vez basta con ponerlo a `true` y compilar; para la imagen de compartir,
 * además, `node scripts/grupo.mjs`. `components/Le1492.tsx` sigue entero.
 */
export const SHOW_LE_1492 = false

export type VenueId = 'el-sol-la-luna' | 'mexi-and-co' | 'le-1492'

export type MenuItem = {
  name: string
  description: FrEs
  /** Precio en euros. Vacío = «Prix sur place». */
  price?: number
  /** Distintivo corto: «Le plat star», «À partager»… */
  badge?: FrEs
  /** Variantes con precio propio (verre / pichet). */
  options?: { label: FrEs; price?: number }[]
  photo?: string
  veggie?: boolean
}

export type MenuSection = { id: string; title: FrEs; note?: FrEs; items: MenuItem[] }

export type Venue = {
  id: VenueId
  name: string
  cuisine: FrEs
  /** Cocinas para schema.org (`servesCuisine`). */
  cuisines: string[]
  intro: FrEs
  address: string
  postcode: string
  town: string
  /** Una línea para situarse: «en face d'El Sol & La Luna». */
  hint?: FrEs
  metro?: string
  phone?: string
  whatsapp?: string
  latitude?: number
  longitude?: number
  /** Índice 0 = domingo … 6 = sábado, como `Date.getDay()`. Vacío = horario sin confirmar. */
  hours: DayHours[]
  /** Nota de Google. Solo se enseña la que está puesta. */
  rating?: { score: number; count: number }
  /** Ficha de Google Maps (o búsqueda que lleva a ella). */
  maps: string
  /** Foto principal. Vacía = cartel con el sol y el nombre del local, sin aviso de «fotos pendientes». */
  photo?: string
  /**
   * Foto apaisada para el héroe en pantallas anchas. La principal puede ser vertical (la fachada lo
   * es) y a pantalla completa en un portátil se estiraría hasta verse blanda.
   */
  photoWide?: string
  gallery?: { src: string; caption: FrEs }[]
  menu: MenuSection[]
}

const open = (from: string, to: string): DayHours => ({ closed: false, open: from, close: to, split: false, open2: '', close2: '', lunch: true, dinner: true })

const SOL_HOURS: DayHours[] = [
  open('11:30', '23:00'), // domingo
  { ...open('17:00', '23:00'), lunch: false }, // lunes: solo por la tarde
  open('11:30', '23:00'),
  open('11:30', '23:00'),
  open('11:30', '23:00'),
  open('11:30', '23:00'),
  open('11:30', '23:00'),
]

const MEXI_HOURS: DayHours[] = Array.from({ length: 7 }, () => open('11:30', '23:30'))

export const EL_SOL: Venue = {
  id: 'el-sol-la-luna',
  name: 'El Sol & La Luna',
  cuisine: { fr: 'Cuisine colombienne & mexicaine', es: 'Cocina colombiana y mexicana' },
  cuisines: ['Colombienne', 'Mexicaine', 'Latino-américaine'],
  intro: {
    fr: 'Un coin de Colombie au Quartier Latin : assiettes généreuses, empanadas maison, bonne musique et accueil chaleureux.',
    es: 'Un rincón de Colombia en el Barrio Latino: platos generosos, empanadas caseras, buena música y un trato cálido.',
  },
  address: '31 rue Saint-Jacques',
  postcode: '75005',
  town: 'Paris',
  metro: 'Maubert-Mutualité · Cluny–La Sorbonne',
  phone: '01 43 54 41 56',
  whatsapp: '06 24 43 80 23',
  latitude: 48.8512811,
  longitude: 2.345938,
  hours: SOL_HOURS,
  rating: { score: 4.4, count: 622 },
  maps: 'https://www.google.com/maps/search/?api=1&query=El+Sol+y+La+Luna+31+Rue+Saint-Jacques+75005+Paris',
  photo: '/img/grupo/sol-facade.webp',
  photoWide: '/img/grupo/sol-interieur-deco.webp',
  gallery: [
    { src: '/img/grupo/sol-interieur-lustre.webp', caption: { fr: 'Le lustre de bouteilles, au-dessus de la salle', es: 'La lámpara de botellas, sobre el comedor' } },
    { src: '/img/grupo/sol-empanadas.webp', caption: { fr: 'Empanadas maison, citron vert et guacamole', es: 'Empanadas caseras, lima y guacamole' } },
    { src: '/img/grupo/sol-facade.webp', caption: { fr: 'La façade, rue Saint-Jacques', es: 'La fachada, en la rue Saint-Jacques' } },
    { src: '/img/grupo/sol-burrito-guacamole.webp', caption: { fr: 'Burrito, riz, guacamole et nachos', es: 'Burrito, arroz, guacamole y nachos' } },
    { src: '/img/grupo/sol-interieur-deco.webp', caption: { fr: 'Une salle pleine d’objets ramenés d’Amérique latine', es: 'Un comedor lleno de objetos traídos de Latinoamérica' } },
    { src: '/img/grupo/sol-quesadilla.webp', caption: { fr: 'Quesadilla, crème et fromage frais', es: 'Quesadilla con crema y queso fresco' } },
    { src: '/img/grupo/sol-burrito.webp', caption: { fr: 'Burrito gratiné, sauce tomate maison', es: 'Burrito gratinado con salsa de tomate casera' } },
  ],
  menu: [
    {
      id: 'colombie',
      title: { fr: 'Spécialités colombiennes', es: 'Especialidades colombianas' },
      items: [
        {
          name: 'Bandeja paisa',
          badge: { fr: 'Le plat star', es: 'El plato estrella' },
          description: {
            fr: 'L’assiette reine de la région paisa : haricots rouges, riz, viande, chicharrón, chorizo, œuf, banane plantain et avocat.',
            es: 'El plato rey de la región paisa: frijoles, arroz, carne, chicharrón, chorizo, huevo, plátano maduro y aguacate.',
          },
        },
        {
          name: 'Empanadas & ají maison',
          photo: '/img/grupo/sol-empanadas.webp',
          description: {
            fr: 'Croustillantes, à la pâte de maïs, servies avec notre ají fait maison.',
            es: 'Crujientes, de masa de maíz, con nuestro ají casero.',
          },
        },
        {
          name: 'Picada colombienne',
          badge: { fr: 'À partager', es: 'Para compartir' },
          description: {
            fr: 'Le grand plateau à partager : viandes grillées, chorizo, chicharrón et accompagnements colombiens.',
            es: 'La bandeja grande para compartir: carnes a la brasa, chorizo, chicharrón y acompañamientos colombianos.',
          },
        },
        {
          name: 'Sobrebarriga',
          description: { fr: 'Bavette de bœuf mijotée longuement, à la colombienne.', es: 'Falda de res cocinada a fuego lento, a la colombiana.' },
        },
        {
          name: 'Tamal',
          description: { fr: 'Pâte de maïs garnie, cuite dans une feuille de bananier.', es: 'Masa de maíz rellena, cocida en hoja de plátano.' },
        },
        {
          name: 'Sopa de pollo',
          description: { fr: 'La soupe de poulet réconfortante, comme là-bas.', es: 'La sopa de pollo de toda la vida, como allá.' },
        },
        {
          name: 'Arepas',
          description: { fr: 'Galettes de maïs dorées, nature ou garnies.', es: 'Arepas de maíz doradas, solas o rellenas.' },
        },
      ],
    },
    {
      id: 'mexique',
      title: { fr: 'Côté Mexique', es: 'El lado mexicano' },
      items: [
        {
          name: 'Tacos, burritos, quesadillas, fajitas',
          photo: '/img/grupo/sol-burrito-guacamole.webp',
          description: { fr: 'Les grands classiques mexicains, garnis selon vos envies.', es: 'Los grandes clásicos mexicanos, rellenos a tu gusto.' },
        },
        {
          name: 'Guacamole & nachos',
          description: { fr: 'Avocat écrasé minute et chips de maïs.', es: 'Aguacate machacado al momento y totopos de maíz.' },
          veggie: true,
        },
      ],
    },
    {
      id: 'boire',
      title: { fr: 'À boire', es: 'Para beber' },
      items: [
        {
          name: 'Margarita frozen',
          description: { fr: 'La margarita glacée de la maison.', es: 'La margarita frozen de la casa.' },
          options: [{ label: { fr: 'Verre', es: 'Copa' } }, { label: { fr: 'Pichet', es: 'Jarra' } }],
        },
      ],
    },
  ],
}

export const MEXI: Venue = {
  id: 'mexi-and-co',
  name: 'Mexi & Co',
  cuisine: { fr: 'Restaurant & épicerie mexicaine', es: 'Restaurante y tienda mexicana' },
  cuisines: ['Mexicaine', 'Tex-Mex', 'Végétarienne'],
  intro: {
    fr: 'Le Mexique en version restaurant et épicerie : burritos, tacos, options végétariennes pour chaque plat, et tous les produits pour cuisiner mexicain chez vous.',
    es: 'México en versión restaurante y tienda: burritos, tacos, opción vegetariana en cada plato y todos los productos para cocinar mexicano en casa.',
  },
  address: '10 rue Dante',
  postcode: '75005',
  town: 'Paris',
  hint: { fr: 'En face d’El Sol & La Luna', es: 'Enfrente de El Sol & La Luna' },
  metro: 'Maubert-Mutualité · Cluny–La Sorbonne',
  phone: '01 46 34 14 12',
  latitude: 48.851126,
  longitude: 2.3460443,
  hours: MEXI_HOURS,
  // Sin nota a propósito: la web no la enseña (ver el bloque «Votre avis compte»).
  maps: 'https://www.google.com/maps/search/?api=1&query=Mexi+%26+Co+10+Rue+Dante+Paris',
  // Sin fotos del local todavía: se pinta el cartel con el nombre (`PhotoSoon`), sin decir que faltan.
  // No se usan las de El Sol: serían de otro local.
  photo: '',
  menu: [
    {
      id: 'plats',
      title: { fr: 'Les plats', es: 'Los platos' },
      note: { fr: 'Options végétariennes pour tous les plats', es: 'Opción vegetariana en todos los platos' },
      items: [
        { name: 'Burritos', description: { fr: 'Généreux, roulés minute, viande ou version végétarienne.', es: 'Generosos, hechos al momento, con carne o vegetarianos.' } },
        { name: 'Tacos', description: { fr: 'Tortillas de maïs garnies, coriandre et oignon.', es: 'Tortillas de maíz con su relleno, cilantro y cebolla.' } },
        { name: 'Quesadillas', description: { fr: 'Tortilla dorée au fromage fondant.', es: 'Tortilla dorada con queso fundido.' } },
        { name: 'Fajitas', description: { fr: 'Servies grésillantes, avec tortillas et garnitures.', es: 'Servidas chisporroteando, con tortillas y guarniciones.' } },
        { name: 'Nachos & guacamole', description: { fr: 'Chips de maïs et guacamole maison.', es: 'Totopos de maíz y guacamole casero.' }, veggie: true },
        { name: 'Chili con carne', description: { fr: 'Mijoté de bœuf, haricots et épices.', es: 'Guiso de ternera, frijoles y especias.' } },
      ],
    },
    {
      id: 'boire',
      title: { fr: 'À boire', es: 'Para beber' },
      items: [
        { name: 'Bières mexicaines', description: { fr: 'Les blondes et les ambrées du Mexique, bien fraîches.', es: 'Rubias y tostadas de México, bien frías.' } },
        { name: 'Cocktails', description: { fr: 'Margaritas et cocktails latinos.', es: 'Margaritas y cócteles latinos.' } },
      ],
    },
  ],
}

/** Los locales con página propia, en el orden en que se presentan. */
export const VENUES: Venue[] = [EL_SOL, MEXI]

/** Cuántas direcciones tiene el grupo en la web: las de página propia y Le 1492 si está encendido. */
export const VENUE_COUNT = VENUES.length + (SHOW_LE_1492 ? 1 : 0)

export const venueById = (id: string | null | undefined) => VENUES.find((venue) => venue.id === id)

export const fullAddress = (venue: Venue) => `${venue.address}, ${venue.postcode} ${venue.town}`

/**
 * Los cálculos de horario (`openState`, `hoursOn`…) trabajan sobre los ajustes del panel. Para un
 * local se le pasan sus horas; sin cierres puntuales, que el grupo no ha dado.
 */
export const scheduleOf = (settings: Settings, hours: DayHours[]): Settings => ({ ...settings, hours, closedDates: [] })
