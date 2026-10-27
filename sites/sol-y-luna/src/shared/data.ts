/**
 * Carta, horario y datos de Restaurante El Puerto, tomados de restauranteelpuertocanpicafort.com
 * (carta en castellano, inglés, alemán y francés) y de su página de reservas.
 *
 * Los precios salen de la carta en castellano, que es la que manda: las otras versiones de la web
 * antigua tenían alguno distinto por descuido. Las traducciones parten de las de la web antigua,
 * con las erratas corregidas.
 *
 * Es la carta con la que arranca una base vacía y la que se pinta si el servidor no contesta.
 * Al cambiarla hay que subir `version`: el navegador que ya tenía una copia la reemplaza.
 */
import type { Category, DayHours, Dish, DishOption, DishTag, Localized, Menu, Settings, Special } from './types'

export const MENU_VERSION = 7

/** Castellano, inglés, alemán y francés, en ese orden. */
const t = (es: string, en: string, de: string, fr: string): Localized => ({ es, en, de, fr })
const none = t('', '', '', '')

/** Un día corrido. El horario partido lo pone el restaurante desde el panel, no viene de serie. */
const open = (from: string, to: string, lunch: boolean, dinner: boolean): DayHours =>
  ({ closed: false, open: from, close: to, split: false, open2: '', close2: '', lunch, dinner })
const closed: DayHours = { closed: true, open: '', close: '', split: false, open2: '', close2: '', lunch: false, dinner: false }

export const seedSettings = (): Settings => ({
  name: 'Restaurante El Puerto',
  phone: '971 85 09 42',
  mobile: '666 02 27 33',
  whatsapp: '',
  email: 'elpuerto.restaurante@gmail.com',
  address: 'Carrer Cervantes 22',
  postcode: '07450',
  town: 'Can Picafort',
  region: 'Mallorca, Illes Balears',
  latitude: 39.7656305,
  longitude: 3.1569732,
  instagram: 'https://www.instagram.com/elpuertorestaurante/',
  facebook: 'https://www.facebook.com/profile.php?id=100063644828409',
  tripadvisor: 'https://www.tripadvisor.es/Restaurant_Review-g580284-d1724689-Reviews-El_Puerto-Ca_n_Picafort_Majorca_Balearic_Islands.html',
  // El enlace corto para opinar en Google lo da el propio restaurante desde su ficha de negocio.
  google: '',
  googleBusiness: '',
  // Domingo · lunes · martes … sábado. De martes a sábado de 12:00 a 22:00, domingo de 12:00 a 15:00, lunes cerrado.
  hours: [
    open('12:00', '15:00', true, false),
    closed,
    open('12:00', '22:00', true, true),
    open('12:00', '22:00', true, true),
    open('12:00', '22:00', true, true),
    open('12:00', '22:00', true, true),
    open('12:00', '22:00', true, true),
  ],
  // Las franjas de su libro de reservas: comida de 13:00 a 15:00 y cena de 18:30 a 22:00.
  services: { lunch: { from: '13:00', to: '15:00' }, dinner: { from: '18:30', to: '22:00' } },
  slotMinutes: 30,
  minNoticeMinutes: 60,
  bookingDays: 60,
  maxPartySize: 12,
  // Sin aforo configurado la web no rechaza reservas por llenarse: lo pone el restaurante en Ajustes.
  capacity: { lunch: 0, dinner: 0 },
  bookingEnabled: true,
  closedDates: [],
  notice: none,
  specials: seedSpecials(),
  // Sin nada aquí, la web enseña las fotos con las que se estrenó (`src/shared/photos.ts`).
  photos: {},
})

/**
 * Sugerencias de arranque, hechas con platos que ya están en la carta: así los precios son los de
 * verdad. Están para que la portada no salga vacía el primer día; el restaurante las cambia desde
 * el panel (Carta → Sugerencias) cada semana y cada mes.
 */
export const seedSpecials = (): Special[] => [
  {
    id: 'semana-rape-gambas',
    period: 'semana',
    name: t('Arroz de rape y gamba roja', 'Monkfish and red prawn rice', 'Reis mit Seeteufel und roten Garnelen', 'Riz à la lotte et crevettes rouges'),
    description: t(
      'Meloso, con fumet de la casa. El que más nos piden esta semana: encárgalo con tu mesa.',
      'Our house fish stock makes it. The one everyone is ordering this week: pre-order it with your table.',
      'Mit hausgemachtem Fischfond. Diese Woche am meisten bestellt: gleich mit dem Tisch vorbestellen.',
      'Au fumet maison. Le plus demandé cette semaine : commandez-le avec votre table.',
    ),
    price: 0,
    perPerson: true,
    photo: '/img/cocina-paellas.webp',
    dishId: 'arroz-rape-gambas',
    visible: true,
  },
  {
    id: 'semana-tartar',
    period: 'semana',
    name: t('Tartar de atún y mango', 'Tuna and mango tartare', 'Thunfisch-Mango-Tatar', 'Tartare de thon et mangue'),
    description: t(
      'Fresco y ligero, para abrir boca antes del arroz.',
      'Fresh and light, to start before the rice.',
      'Frisch und leicht, als Auftakt vor dem Reis.',
      'Frais et léger, pour ouvrir l’appétit avant le riz.',
    ),
    price: 0,
    perPerson: false,
    photo: '/img/tartar-atun.webp',
    dishId: 'tartar-atun-mango',
    visible: true,
  },
  {
    id: 'mes-arroz-marisco',
    period: 'mes',
    name: t('Paella de marisco', 'Seafood paella', 'Meeresfrüchte-Paella', 'Paella aux fruits de mer'),
    description: t(
      'La más completa de la casa: cigala, zamburiña, gamba roja, rape y sepia. La paella del mes.',
      'Our most generous paella: langoustine, scallops, red prawns, monkfish and cuttlefish. Paella of the month.',
      'Die üppigste des Hauses: Kaisergranat, Jakobsmuscheln, rote Garnelen, Seeteufel und Sepia. Paella des Monats.',
      'La plus complète de la maison : langoustine, pétoncles, crevettes rouges, lotte et seiche. La paella du mois.',
    ),
    price: 0,
    perPerson: true,
    photo: '/img/paella-marisco.webp',
    dishId: 'arroz-marisco',
    visible: true,
  },
]

export const seedCategories = (): Category[] => [
  {
    id: 'arroces',
    name: t('Paella o fideuà', 'Paella or fideuà', 'Paella oder Fideuà', 'Paella ou fideuà'),
    note: t(
      'Con caldo de pescado y marisco. Mínimo 2 personas, precio por persona. En horas punta no servimos paellas sin reserva, y como máximo hasta las 22:00.',
      'Made with fish and seafood stock. Minimum 2 people, price per person. At peak times we do not serve paella without a booking, and never after 10 pm.',
      'Mit Fisch- und Meeresfrüchtebrühe. Mindestens 2 Personen, Preis pro Person. Zu Stoßzeiten servieren wir Paella nur mit Reservierung, und höchstens bis 22:00 Uhr.',
      'Au bouillon de poisson et de fruits de mer. Minimum 2 personnes, prix par personne. Aux heures d’affluence, pas de paella sans réservation, et au plus tard jusqu’à 22 h.',
    ),
    footnote: t(
      'La vegana se hace con caldo de verduras (mínimo 2 personas).',
      'The vegan one is made with vegetable stock (minimum 2 people).',
      'Die vegane wird mit Gemüsebrühe zubereitet (mindestens 2 Personen).',
      'La végétalienne est préparée au bouillon de légumes (minimum 2 personnes).',
    ),
    visible: true,
  },
  {
    id: 'para-picar',
    name: t('Para picar', 'Starters to share', 'Vorspeisen zum Teilen', 'Entrées à partager'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'carnes',
    name: t('Carnes', 'Meat', 'Fleisch', 'Viandes'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'pescados',
    name: t('Pescados', 'Fish', 'Fisch', 'Poissons'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'ensaladas',
    name: t('Ensaladas', 'Salads', 'Salate', 'Salades'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'pizzas',
    name: t('Pizzas', 'Pizzas', 'Pizzas', 'Pizzas'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'ninos',
    name: t('Para los niños', 'For children', 'Für Kinder', 'Pour les enfants'),
    note: none,
    footnote: none,
    visible: true,
  },
  {
    id: 'postres',
    name: t('Postres', 'Desserts', 'Desserts', 'Desserts'),
    note: none,
    footnote: none,
    visible: true,
  },
]

type DishSeed = {
  id: string
  name: Localized
  description?: Localized
  price: number
  photo?: string
  featured?: boolean
  tags?: DishTag[]
  options?: DishOption[]
}

/** Fecha fija: la carta sembrada es la misma en cada arranque y no parece recién editada. */
const SEEDED_AT = Date.UTC(2026, 8, 15)

const section = (categoryId: string, entries: DishSeed[], perPerson = false): Dish[] =>
  entries.map((entry) => ({
    id: entry.id,
    categoryId,
    name: entry.name,
    description: entry.description ?? none,
    price: entry.price,
    perPerson,
    options: entry.options ?? [],
    photo: entry.photo ?? '',
    tags: entry.tags ?? [],
    allergens: [],
    featured: entry.featured ?? false,
    status: 'disponible',
    updatedAt: SEEDED_AT,
  }))

/**
 * Ingredientes que se repiten en las pizzas, escritos tal como van en mitad de la lista:
 * en minúscula, salvo los sustantivos alemanes y los nombres propios.
 */
const MOZZ = t('Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella')
const list = (...parts: Localized[]) => {
  const join = (lang: keyof Localized, and: string) => {
    const words = parts.map((part) => part[lang])
    return words.length > 1 ? `${words.slice(0, -1).join(', ')} ${and} ${words[words.length - 1]}` : words[0]
  }
  return t(join('es', 'y'), join('en', 'and'), join('de', 'und'), join('fr', 'et'))
}
const I = {
  tomate: t('tomate', 'tomato', 'Tomate', 'tomate'),
  jamonCocido: t('jamón cocido', 'cooked ham', 'Kochschinken', 'jambon blanc'),
  salami: t('salami', 'salami', 'Salami', 'salami'),
  cebolla: t('cebolla', 'onion', 'Zwiebeln', 'oignon'),
  atun: t('atún', 'tuna', 'Thunfisch', 'thon'),
  espinacas: t('espinacas', 'spinach', 'Spinat', 'épinards'),
  anchoas: t('anchoas', 'anchovies', 'Sardellen', 'anchois'),
  bolonesa: t('salsa boloñesa', 'Bolognese sauce', 'Bolognese-Sauce', 'sauce bolognaise'),
  champinones: t('champiñones', 'mushrooms', 'Champignons', 'champignons'),
  pina: t('piña', 'pineapple', 'Ananas', 'ananas'),
  bacon: t('bacon', 'bacon', 'Speck', 'bacon'),
  huevo: t('huevo', 'egg', 'Ei', 'œuf'),
  pimientoVerde: t('pimiento verde', 'green pepper', 'grüne Paprika', 'poivron vert'),
  pimientoRojo: t('pimiento rojo', 'red pepper', 'rote Paprika', 'poivron rouge'),
  alcachofas: t('alcachofas', 'artichokes', 'Artischocken', 'artichauts'),
  edam: t('edam', 'Edam', 'Edamer', 'edam'),
  roquefort: t('roquefort', 'Roquefort', 'Roquefort', 'roquefort'),
  cabra: t('queso de cabra', 'goat’s cheese', 'Ziegenkäse', 'fromage de chèvre'),
  ajo: t('ajo', 'garlic', 'Knoblauch', 'ail'),
  gambas: t('gambas', 'prawns', 'Garnelen', 'crevettes'),
  serrano: t('jamón serrano', 'Serrano ham', 'Serranoschinken', 'jambon serrano'),
  pollo: t('pollo', 'chicken', 'Hähnchen', 'poulet'),
  cremaEspinacas: t('crema de espinacas', 'creamed spinach', 'Spinatcreme', 'crème d’épinards'),
  rucula: t('rúcula', 'rocket', 'Rucola', 'roquette'),
  parmesano: t('parmesano', 'Parmesan', 'Parmesan', 'parmesan'),
  cherry: t('tomate cherry', 'cherry tomatoes', 'Kirschtomaten', 'tomates cerises'),
  calamar: t('calamar', 'squid', 'Tintenfisch', 'calamar'),
  mejillon: t('mejillón', 'mussels', 'Miesmuscheln', 'moules'),
}

export const seedDishes = (): Dish[] => [
  ...section('para-picar', [
    {
      id: 'puntillas',
      name: t('Puntillas / chipirones fritos', 'Fried baby squid', 'Frittierte Baby-Tintenfische', 'Petits calmars frits'),
      description: t(
        'Cesta de chipirones enharinados y fritos.',
        'A basket of baby squid, dusted in flour and fried.',
        'Körbchen mit bemehlten und frittierten kleinen Tintenfischen.',
        'Panier de petits calmars farinés et frits.',
      ),
      price: 16,
      photo: '/img/chipirones.webp',
      featured: true,
    },
    {
      id: 'calamares-andaluza',
      name: t('Calamar a la andaluza', 'Andalusian-style squid', 'Tintenfisch nach andalusischer Art', 'Calamars à l’andalouse'),
      description: t(
        'Cesta de calamar cortado, enharinado y frito.',
        'A basket of sliced squid, dusted in flour and fried.',
        'Körbchen mit geschnittenem, bemehltem und frittiertem Tintenfisch.',
        'Panier de calamars en lamelles, farinés et frits.',
      ),
      price: 18.75,
    },
    {
      id: 'croquetas',
      name: t('Croquetas caseras (8 uds.)', 'Homemade croquettes (8 pcs)', 'Hausgemachte Kroketten (8 Stück)', 'Croquettes maison (8 pièces)'),
      description: t(
        'De pollo asado · De boletus y trufa · De espinacas con queso de cabra y nueces.',
        'Roast chicken · Boletus mushroom and truffle · Spinach with goat’s cheese and walnuts.',
        'Brathähnchen · Steinpilz und Trüffel · Spinat mit Ziegenkäse und Walnüssen.',
        'Poulet rôti · Cèpes et truffe · Épinards, fromage de chèvre et noix.',
      ),
      price: 14.75,
    },
    {
      id: 'tartar-atun-mango',
      name: t('Tartar de atún y mango', 'Tuna and mango tartare', 'Thunfisch-Mango-Tatar', 'Tartare de thon et mangue'),
      description: t(
        'Atún y mango aliñados con mostaza, teriyaki, tabasco y limón.',
        'Tuna and mango dressed with mustard, teriyaki, Tabasco and lemon.',
        'Thunfisch und Mango, angemacht mit Senf, Teriyaki, Tabasco und Zitrone.',
        'Thon et mangue assaisonnés de moutarde, teriyaki, tabasco et citron.',
      ),
      price: 19.95,
      photo: '/img/tartar-atun.webp',
      featured: true,
    },
    {
      id: 'bacalao-dorado',
      name: t('Bacalao dorado', 'Golden salt cod', 'Kabeljau mit Ei und Strohkartoffeln', 'Morue dorée'),
      description: t(
        'Revuelto con migas de bacalao desalado, patata paja, cebolla, ajo y huevo.',
        'Scrambled eggs with flaked desalted cod, shoestring potatoes, onion and garlic.',
        'Rührei mit entsalzenem, gezupftem Kabeljau, Strohkartoffeln, Zwiebeln und Knoblauch.',
        'Œufs brouillés à la morue dessalée émiettée, pommes paille, oignon et ail.',
      ),
      price: 16.75,
    },
    {
      id: 'huevos-rotos',
      name: t('Huevos rotos a baja temperatura con jamón', 'Slow-cooked broken eggs with ham', 'Zerdrückte Eier mit Schinken bei niedriger Temperatur', 'Œufs cassés basse température au jambon'),
      description: t(
        'Patatas fritas, virutas de jamón serrano asado, 3 huevos cocinados a baja temperatura durante 45 minutos, foie de pato y aceite de trufa.',
        'Fried potatoes, roasted Serrano ham shavings, 3 eggs cooked at low temperature for 45 minutes, duck foie gras and truffle oil.',
        'Pommes frites, geröstete Serrano-Schinkenspäne, 3 Eier 45 Minuten bei niedriger Temperatur gegart, Entenstopfleber und Trüffelöl.',
        'Frites, copeaux de jambon serrano rôti, 3 œufs cuits 45 minutes à basse température, foie gras de canard et huile de truffe.',
      ),
      price: 18.95,
      photo: '/img/huevos-rotos.webp',
      featured: true,
    },
    {
      id: 'solomillo-5-pimientas',
      name: t('Solomillo 5 pimientas', 'Five-pepper beef tenderloin', 'Rinderfilet mit fünf Pfeffersorten', 'Filet de bœuf aux cinq poivres'),
      description: t(
        'Taquitos de solomillo de ternera salteados con escamas de sal y mezcla de 5 pimientas.',
        'Beef tenderloin cubes sautéed with sea salt flakes and a blend of five peppers.',
        'Rinderfiletwürfel, gebraten mit Salzflocken und einer Mischung aus fünf Pfeffersorten.',
        'Dés de filet de bœuf sautés, fleur de sel et mélange de cinq poivres.',
      ),
      price: 21.5,
      photo: '/img/solomillo-5-pimientas.webp',
      featured: true,
    },
    {
      id: 'flores-alcachofa',
      name: t('Flores de alcachofa a la plancha', 'Grilled artichoke flowers', 'Gegrillte Artischockenblüten', 'Fleurs d’artichaut à la plancha'),
      description: t(
        'Con vinagreta suave de mostaza y virutas de jamón asado.',
        'With a mild mustard vinaigrette and roasted ham shavings.',
        'Mit milder Senfvinaigrette und gerösteten Schinkenspänen.',
        'Vinaigrette douce à la moutarde et copeaux de jambon rôti.',
      ),
      price: 15,
    },
    {
      id: 'pinsa-boquerones',
      name: t('Mini pinsa crujiente de boquerones', 'Crispy mini pinsa with anchovies', 'Knusprige Mini-Pinsa mit Sardellen', 'Mini pinsa croustillante aux anchois'),
      description: t(
        'Base de pinsa romana con boquerones en vinagreta y pimientos asados macerados en moscatel.',
        'Roman pinsa base with anchovies in vinaigrette and roasted peppers marinated in muscatel.',
        'Römischer Pinsa-Boden mit Sardellen in Vinaigrette und in Muskateller marinierten gerösteten Paprika.',
        'Base de pinsa romaine, anchois à la vinaigrette et poivrons rôtis marinés au muscat.',
      ),
      price: 16.95,
    },
    {
      id: 'pinsa-salmon',
      name: t('Mini pinsa crujiente de salmón', 'Crispy mini pinsa with salmon', 'Knusprige Mini-Pinsa mit Lachs', 'Mini pinsa croustillante au saumon'),
      description: t(
        'Base de pinsa romana con aceite de ajo, rúcula, salmón ahumado y tomate cherry.',
        'Roman pinsa base with garlic oil, rocket, smoked salmon and cherry tomatoes.',
        'Römischer Pinsa-Boden mit Knoblauchöl, Rucola, Räucherlachs und Kirschtomaten.',
        'Base de pinsa romaine, huile à l’ail, roquette, saumon fumé et tomates cerises.',
      ),
      price: 15.95,
    },
  ]),

  ...section('ensaladas', [
    {
      id: 'ensalada-rucula',
      name: t('Rúcula, queso de cabra y balsámico', 'Rocket with goat’s cheese and balsamic', 'Rucola mit Ziegenkäse und Balsamico', 'Roquette, chèvre et balsamique'),
      description: t(
        'Rúcula, rodaja de queso de cabra a la plancha, crema de balsámico, nueces, tomates cherry y olivas.',
        'Rocket, grilled goat’s cheese, balsamic cream, walnuts, cherry tomatoes and olives.',
        'Rucola, gegrillter Ziegenkäse, Balsamico-Creme, Walnüsse, Kirschtomaten und Oliven.',
        'Roquette, chèvre grillé, crème de balsamique, noix, tomates cerises et olives.',
      ),
      price: 14,
      photo: '/img/ensalada-rucula.webp',
      featured: true,
      tags: ['vegetariano'],
    },
    {
      id: 'ensalada-griega',
      name: t('Griega con feta y tzatziki', 'Greek salad with feta and tzatziki', 'Griechischer Salat mit Feta und Tsatsiki', 'Salade grecque, feta et tzatziki'),
      description: t(
        'Mezcla de lechugas, tomate, pepino, pimiento verde, cebolla morada, queso feta, aceitunas, orégano y tzatziki.',
        'Mixed leaves, tomato, cucumber, green pepper, red onion, feta cheese, olives, oregano and tzatziki.',
        'Blattsalate, Tomate, Gurke, grüne Paprika, rote Zwiebel, Feta, Oliven, Oregano und Tsatsiki.',
        'Mesclun, tomate, concombre, poivron vert, oignon rouge, feta, olives, origan et tzatziki.',
      ),
      price: 15,
      tags: ['vegetariano'],
    },
    {
      id: 'ensalada-salmon',
      name: t('Salmón, mango y aguacate', 'Salmon, mango and avocado', 'Lachs, Mango und Avocado', 'Saumon, mangue et avocat'),
      description: t(
        'Lechugas, salmón ahumado, cebolla morada, mango, aguacate y tomates cherry, aliñada con vinagre de manzana, mostaza y teriyaki.',
        'Lettuce, smoked salmon, red onion, mango, avocado and cherry tomatoes, dressed with cider vinegar, mustard and teriyaki.',
        'Blattsalat, Räucherlachs, rote Zwiebel, Mango, Avocado und Kirschtomaten, angemacht mit Apfelessig, Senf und Teriyaki.',
        'Salade, saumon fumé, oignon rouge, mangue, avocat et tomates cerises, vinaigre de cidre, moutarde et teriyaki.',
      ),
      price: 16.5,
    },
  ]),

  ...section(
    'arroces',
    [
      {
        id: 'arroz-clasica',
        name: t('Clásica', 'Classic', 'Klassisch', 'Classique'),
        description: t(
          'Pollo y cerdo deshuesado, sepia, patas de cangrejo, mejillones y gambas.',
          'Boneless chicken and pork, cuttlefish, crab legs, mussels and prawns.',
          'Hähnchen und Schweinefleisch ohne Knochen, Sepia, Krabbenbeine, Miesmuscheln und Garnelen.',
          'Poulet et porc désossés, seiche, pattes de crabe, moules et crevettes.',
        ),
        price: 21.5,
        photo: '/img/paella.webp',
        featured: true,
      },
      {
        id: 'arroz-rape-gambas',
        name: t('De rape y gambas', 'Monkfish and prawns', 'Mit Seeteufel und Garnelen', 'Lotte et crevettes'),
        description: t('Rape, sepia y gamba roja.', 'Monkfish, cuttlefish and red prawns.', 'Seeteufel, Sepia und rote Garnelen.', 'Lotte, seiche et crevettes rouges.'),
        price: 23.5,
      },
      {
        id: 'arroz-bacalao',
        name: t('Bacalao desalado', 'Salt cod', 'Entsalzter Kabeljau', 'Morue dessalée'),
        description: t(
          'Bacalao desalado y desmigado, sepia, pimientos del piquillo y alioli de tinta de calamar.',
          'Desalted flaked cod and cuttlefish, finished with piquillo peppers and squid-ink aioli.',
          'Entsalzener, gezupfter Kabeljau und Sepia, vollendet mit Piquillo-Paprika und Aioli mit Tintenfischtinte.',
          'Morue dessalée émiettée et seiche, finie aux poivrons del piquillo et aïoli à l’encre de seiche.',
        ),
        price: 22.5,
      },
      {
        id: 'arroz-negro',
        name: t('Negra', 'Black rice', 'Schwarzer Reis', 'Riz noir'),
        description: t(
          'Chipirones, sofrito, pimiento rojo y tinta de calamar.',
          'Baby squid, sofrito, red pepper and squid ink.',
          'Baby-Tintenfisch, Sofrito, rote Paprika und Tintenfischtinte.',
          'Petits calmars, sofrito, poivron rouge et encre de seiche.',
        ),
        price: 19.5,
      },
      {
        id: 'arroz-marisco',
        name: t('Marisco', 'Seafood', 'Meeresfrüchte', 'Fruits de mer'),
        description: t(
          'Sepia, rape, gamba roja, mejillones, cigala, zamburiña y patas de cangrejo.',
          'Cuttlefish, monkfish, red prawns, mussels, langoustine, queen scallops and crab legs.',
          'Sepia, Seeteufel, rote Garnelen, Miesmuscheln, Kaisergranat, kleine Jakobsmuscheln und Krabbenbeine.',
          'Seiche, lotte, crevettes rouges, moules, langoustine, pétoncles et pattes de crabe.',
        ),
        price: 26.5,
        photo: '/img/arroz-marisco.webp',
        featured: true,
      },
      {
        id: 'arroz-caldoso',
        name: t('Caldoso de pescado y marisco', 'Soupy fish and seafood rice', 'Suppiger Reis mit Fisch und Meeresfrüchten', 'Riz caldoso poisson et fruits de mer'),
        description: t(
          'Sepia, rape, gamba roja, patas de cangrejo y mejillones.',
          'Cuttlefish, monkfish, red prawns, crab legs and mussels.',
          'Sepia, Seeteufel, rote Garnelen, Krabbenbeine und Miesmuscheln.',
          'Seiche, lotte, crevettes rouges, pattes de crabe et moules.',
        ),
        price: 24,
      },
      {
        id: 'arroz-vegano',
        name: t('Vegana', 'Vegan', 'Vegan', 'Végétalienne'),
        description: t(
          'Sofrito con verduras de la huerta.',
          'Sofrito with garden vegetables.',
          'Sofrito mit Gartengemüse.',
          'Sofrito et légumes du potager.',
        ),
        price: 19.95,
        tags: ['vegano'],
      },
    ],
    true,
  ),

  ...section('carnes', [
    {
      id: 'costillas',
      name: t('Costillar de cerdo con mostaza y miel', 'Rack of pork ribs with mustard and honey', 'Schweinerippchen am Stück mit Senf und Honig', 'Carré de travers de porc moutarde et miel'),
      description: t(
        'Costillas de cerdo asadas a baja temperatura, marinadas en mostaza, miel, ajo y perejil y horneadas.',
        'Pork ribs roasted at low temperature, marinated in mustard, honey, garlic and parsley, then oven-baked.',
        'Bei niedriger Temperatur gegarte Schweinerippchen, mariniert in Senf, Honig, Knoblauch und Petersilie und im Ofen gebacken.',
        'Travers de porc rôtis à basse température, marinés à la moutarde, au miel, à l’ail et au persil, puis passés au four.',
      ),
      price: 21.75,
      photo: '/img/costillas.webp',
      featured: true,
    },
    {
      id: 'solomillo-cerdo-relleno',
      name: t('Solomillo de cerdo relleno', 'Stuffed pork tenderloin', 'Gefülltes Schweinefilet', 'Filet mignon de porc farci'),
      description: t(
        'Solomillo duroc relleno de jamón serrano y queso de Menorca semicurado, cocido a baja temperatura y dorado con mantequilla.',
        'Duroc pork tenderloin stuffed with Serrano ham and semi-cured Menorca cheese, cooked at low temperature and browned in butter.',
        'Duroc-Schweinefilet, gefüllt mit Serrano-Schinken und halbgereiftem Käse aus Menorca, bei niedriger Temperatur gegart und in Butter gebräunt.',
        'Filet mignon de porc Duroc farci au jambon serrano et au fromage de Minorque demi-affiné, cuit à basse température et doré au beurre.',
      ),
      price: 22.75,
    },
    {
      id: 'solomillo-ternera',
      name: t('Solomillo de ternera', 'Beef tenderloin', 'Rinderfilet', 'Filet de bœuf'),
      description: t(
        'Corte de solomillo de ternera a la plancha, al punto que prefieras.',
        'Grilled beef tenderloin, cooked to your liking.',
        'Rinderfilet von der Plancha, nach Wunsch gegart.',
        'Filet de bœuf à la plancha, cuisson au choix.',
      ),
      price: 32,
    },
    {
      id: 'pollo-pimienta-vermut',
      name: t('Pollo con pimienta y vermut', 'Chicken with pepper and vermouth', 'Hähnchen mit Pfeffer und Wermut', 'Poulet au poivre et au vermouth'),
      description: t(
        'Pechuga de pollo cocinada con pimienta verde a baja temperatura, dorada con mantequilla y flambeada con vermut ahumado.',
        'Chicken breast cooked with green peppercorns at low temperature, browned in butter and flambéed with smoked vermouth.',
        'Hähnchenbrust mit grünem Pfeffer bei niedriger Temperatur gegart, in Butter gebräunt und mit geräuchertem Wermut flambiert.',
        'Blanc de poulet cuit à basse température au poivre vert, doré au beurre et flambé au vermouth fumé.',
      ),
      price: 19.95,
    },
    {
      id: 'carrillera',
      name: t('Carrillera de ternera', 'Braised beef cheek', 'Rinderbäckchen', 'Joue de bœuf'),
      description: t(
        'Ración de carrillera de ternera horneada al vacío con su jugo.',
        'Beef cheek slow-baked sous vide and served in its own juices.',
        'Im Vakuum gegarte Rinderbäckchen mit ihrem eigenen Saft.',
        'Joue de bœuf cuite sous vide au four, servie avec son jus.',
      ),
      price: 21.75,
      photo: '/img/carrillada.webp',
      featured: true,
    },
  ]),

  ...section('pescados', [
    {
      id: 'tataki-atun',
      name: t('Tataki de atún', 'Tuna tataki', 'Thunfisch-Tataki', 'Tataki de thon'),
      description: t(
        'Lomo de atún marcado a la plancha con salsa teriyaki.',
        'Tuna loin seared on the plancha with teriyaki sauce.',
        'Kurz auf der Plancha angebratenes Thunfischfilet mit Teriyaki-Sauce.',
        'Longe de thon snackée à la plancha, sauce teriyaki.',
      ),
      price: 21,
    },
    {
      id: 'sepias-plancha',
      name: t('Sepias a la plancha', 'Grilled cuttlefish', 'Sepia von der Plancha', 'Seiches à la plancha'),
      description: t(
        'Ración de sepias nacionales a la plancha con ajo y perejil.',
        'Spanish cuttlefish grilled on the plancha with garlic and parsley.',
        'Spanische Sepia von der Plancha mit Knoblauch und Petersilie.',
        'Seiches d’Espagne à la plancha, ail et persil.',
      ),
      price: 19.95,
    },
    {
      id: 'bacalao-confitado',
      name: t(
        'Bacalao confitado con cebolla, dátiles, pasas y miel',
        'Cod confit with onion, dates, raisins and honey',
        'Kabeljau-Confit mit Zwiebeln, Datteln, Rosinen und Honig',
        'Cabillaud confit, oignon, dattes, raisins secs et miel',
      ),
      description: t(
        'Lomo de bacalao salvaje confitado en aceite virgen y asado con cebolla caramelizada con miel, pasas y dátiles, con puré de patatas.',
        'Wild cod loin confit in virgin olive oil, roasted with honey-caramelised onion, raisins and dates, served with mashed potatoes.',
        'Wildkabeljau, in nativem Olivenöl confiert und mit in Honig karamellisierten Zwiebeln, Rosinen und Datteln gebraten, dazu Kartoffelpüree.',
        'Dos de cabillaud sauvage confit à l’huile vierge, rôti aux oignons caramélisés au miel, raisins secs et dattes, servi avec une purée de pommes de terre.',
      ),
      price: 23.5,
    },
  ]),

  ...section('pizzas', [
    { id: 'pizza-margarita', name: t('Margarita', 'Margherita', 'Margherita', 'Margherita'), description: list(MOZZ, I.tomate), price: 10.5, tags: ['vegetariano'] },
    { id: 'pizza-prosciutto', name: t('Prosciutto', 'Prosciutto', 'Prosciutto', 'Prosciutto'), description: list(MOZZ, I.tomate, I.jamonCocido), price: 12 },
    { id: 'pizza-salami', name: t('Salami', 'Salami', 'Salami', 'Salami'), description: list(MOZZ, I.tomate, I.salami), price: 12 },
    { id: 'pizza-atun', name: t('Atún', 'Tuna', 'Thunfisch', 'Thon'), description: list(MOZZ, I.tomate, I.cebolla, I.atun), price: 11 },
    { id: 'pizza-espinacas', name: t('Espinacas', 'Spinach', 'Spinat', 'Épinards'), description: list(MOZZ, I.tomate, I.jamonCocido, I.espinacas), price: 12.5 },
    { id: 'pizza-napolitana', name: t('Napolitana', 'Napoletana', 'Napoletana', 'Napolitaine'), description: list(MOZZ, I.tomate, I.jamonCocido, I.anchoas), price: 13 },
    { id: 'pizza-bolonesa', name: t('Boloñesa', 'Bolognese', 'Bolognese', 'Bolognaise'), description: list(MOZZ, I.bolonesa, I.champinones), price: 13 },
    { id: 'pizza-tropical', name: t('Tropical', 'Tropical', 'Tropical', 'Tropicale'), description: list(MOZZ, I.tomate, I.jamonCocido, I.pina), price: 11 },
    { id: 'pizza-reina', name: t('Reina', 'Regina', 'Regina', 'Reine'), description: list(MOZZ, I.tomate, I.jamonCocido, I.bacon, I.huevo), price: 13.5 },
    {
      id: 'pizza-vegetal',
      name: t('Vegetal', 'Vegetable', 'Gemüse', 'Végétarienne'),
      description: list(MOZZ, I.tomate, I.espinacas, I.cebolla, I.pimientoVerde, I.pimientoRojo, I.alcachofas, I.champinones),
      price: 14,
      tags: ['vegetariano'],
    },
    { id: 'pizza-4-quesos', name: t('4 quesos', 'Four cheeses', 'Vier Käse', 'Quatre fromages'), description: list(MOZZ, I.tomate, I.edam, I.roquefort, I.cabra), price: 12, tags: ['vegetariano'] },
    { id: 'pizza-gamberoni', name: t('Gamberoni', 'Gamberoni', 'Gamberoni', 'Gamberoni'), description: list(MOZZ, I.tomate, I.ajo, I.cebolla, I.gambas), price: 14.5 },
    { id: 'pizza-calzone', name: t('Calzone', 'Calzone', 'Calzone', 'Calzone'), description: list(MOZZ, I.tomate, I.jamonCocido, I.champinones, I.cebolla, I.pimientoRojo), price: 15.5 },
    {
      id: 'pizza-4-estaciones',
      name: t('4 estaciones', 'Four seasons', 'Vier Jahreszeiten', 'Quatre saisons'),
      description: list(MOZZ, I.tomate, I.jamonCocido, I.atun, I.alcachofas, I.champinones, I.pimientoRojo),
      price: 15,
    },
    { id: 'pizza-especial-1', name: t('Especial nº 1', 'Special no. 1', 'Spezial Nr. 1', 'Spéciale n° 1'), description: list(MOZZ, I.tomate, I.serrano, I.cabra), price: 15 },
    { id: 'pizza-especial-2', name: t('Especial nº 2', 'Special no. 2', 'Spezial Nr. 2', 'Spéciale n° 2'), description: list(MOZZ, I.tomate, I.serrano, I.pollo, I.pimientoVerde), price: 16 },
    { id: 'pizza-caprichosa', name: t('Caprichosa', 'Capricciosa', 'Capricciosa', 'Capricciosa'), description: list(MOZZ, I.tomate, I.jamonCocido, I.salami, I.champinones, I.anchoas), price: 15 },
    { id: 'pizza-casa', name: t('De la casa', 'House special', 'Pizza des Hauses', 'Maison'), description: list(MOZZ, I.cremaEspinacas, I.gambas), price: 16 },
    { id: 'pizza-iberica', name: t('Ibérica', 'Ibérica', 'Ibérica', 'Ibérica'), description: list(MOZZ, I.tomate, I.rucula, I.serrano, I.parmesano, I.cherry), price: 16 },
    { id: 'pizza-frutti-di-mare', name: t('Frutti di mare', 'Frutti di mare', 'Frutti di Mare', 'Frutti di mare'), description: list(MOZZ, I.tomate, I.calamar, I.mejillon, I.gambas, I.pimientoVerde, I.cebolla), price: 16 },
  ]),

  ...section('ninos', [
    { id: 'ninos-nuggets', name: t('Nuggets de pollo con patatas', 'Chicken nuggets with chips', 'Hähnchen-Nuggets mit Pommes', 'Nuggets de poulet et frites'), price: 9.5 },
    { id: 'ninos-espaguetis', name: t('Espaguetis a la boloñesa', 'Spaghetti Bolognese', 'Spaghetti Bolognese', 'Spaghetti bolognaise'), price: 9.75 },
    { id: 'ninos-pechuga', name: t('Pechuga de pollo con patatas', 'Chicken breast with chips', 'Hähnchenbrust mit Pommes', 'Blanc de poulet et frites'), price: 9.75 },
    { id: 'ninos-escalope', name: t('Escalope de lomo con patatas', 'Pork loin escalope with chips', 'Schweineschnitzel mit Pommes', 'Escalope de porc et frites'), price: 9.75 },
    { id: 'ninos-tortilla', name: t('Tortilla francesa con patatas', 'Plain omelette with chips', 'Omelett mit Pommes', 'Omelette nature et frites'), price: 9.5 },
  ]),

  ...section('postres', [
    { id: 'coulant', name: t('Coulant de chocolate', 'Chocolate fondant', 'Schokoladen-Coulant', 'Coulant au chocolat'), price: 7.95 },
    { id: 'pudding-queso', name: t('Pudding de queso', 'Cheese pudding', 'Käsepudding', 'Pudding au fromage'), price: 7.95 },
    {
      id: 'gato-almendra',
      name: t('«Gató» con helado de almendra', '“Gató” with almond ice cream', '„Gató“ mit Mandeleis', '« Gató » et glace aux amandes'),
      description: t(
        'Bizcocho mallorquín de almendra.',
        'Traditional Mallorcan almond cake.',
        'Traditioneller mallorquinischer Mandelkuchen.',
        'Gâteau majorquin traditionnel aux amandes.',
      ),
      price: 7.95,
    },
    { id: 'creme-brulee', name: t('Crème brûlée', 'Crème brûlée', 'Crème brûlée', 'Crème brûlée'), price: 7.95 },
    { id: 'choco-coco-curry', name: t('Choco, coco, curry', 'Choco, coconut, curry', 'Schoko, Kokos, Curry', 'Choco, coco, curry'), price: 7.95 },
    {
      id: 'corte-helado',
      name: t('Corte de helado', 'Ice cream wafer sandwich', 'Eis-Waffelschnitte', 'Tranche de glace entre gaufrettes'),
      price: 4.95,
      options: [
        { id: 'vainilla', label: t('Vainilla', 'Vanilla', 'Vanille', 'Vanille'), price: 4.95 },
        { id: 'chocolate', label: t('Chocolate', 'Chocolate', 'Schokolade', 'Chocolat'), price: 4.95 },
      ],
    },
    {
      id: 'helados-artesanos',
      name: t('Helados artesanos', 'Artisan ice cream', 'Hausgemachtes Eis', 'Glaces artisanales'),
      price: 3.25,
      options: [
        { id: '1-bola', label: t('1 bola', '1 scoop', '1 Kugel', '1 boule'), price: 3.25 },
        { id: '2-bolas', label: t('2 bolas', '2 scoops', '2 Kugeln', '2 boules'), price: 6 },
        { id: '3-bolas', label: t('3 bolas', '3 scoops', '3 Kugeln', '3 boules'), price: 7.75 },
      ],
    },
    { id: 'hojaldre-tropical', name: t('Hojaldre tropical de piña y coco', 'Tropical pineapple and coconut puff pastry', 'Tropischer Blätterteig mit Ananas und Kokos', 'Feuilleté tropical ananas et coco'), price: 7.95 },
  ]),
]

export const seedMenu = (): Menu => ({
  version: MENU_VERSION,
  settings: seedSettings(),
  categories: seedCategories(),
  dishes: seedDishes(),
})
