/*
 * Demo para El Sol & La Luna: la web (FR / EN / ES) y dos chats de WhatsApp con el asistente.
 * Sin framework ni build: la web se pinta con plantillas de texto y los chats se reproducen paso a
 * paso (`SCENES`). Los clics se resuelven por delegación con `data-a="acción"`.
 *
 * Enlaces para mostrarla: ?ver=web|turista|grupo y ?lang=fr|en|es.
 */
(function () {
  const $web = document.getElementById('web')
  const $chat = document.getElementById('chat')
  const $bar = document.getElementById('demo-bar')
  const $pitch = document.getElementById('pitch-scenes')

  // ——— Utilidades ———
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  /** Texto de WhatsApp: *negrita* y saltos de línea. */
  const wa = (s) => esc(s).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')
  const pad = (n) => String(n).padStart(2, '0')
  const store = {
    get: (k) => { try { return localStorage.getItem('solwa:' + k) } catch (e) { return null } },
    set: (k, v) => { try { localStorage.setItem('solwa:' + k, v) } catch (e) {} },
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  const ICONS = {
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
    replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    note: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    train: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 3M18 22l-2-3M8 15h.01M16 15h.01"/>',
    sparkle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  }
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`
  const WA_LOGO = '<svg class="wa-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>'
  const SUN = (cls = 'sun') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><g stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M50.4 13.6l-5.7 5.7M19.3 44.7l-5.7 5.7"/></g><circle cx="32" cy="32" r="12" fill="currentColor"/></svg>`
  const TICKS = '<svg class="ticks" viewBox="0 0 16 11" aria-hidden="true"><path fill="currentColor" d="M11.07.65 4.9 7.15 2.38 4.6 1.3 5.7l3.6 3.65 7.25-7.6zM15.2.65 9.03 7.15l-.75-.76-1.08 1.1 1.83 1.86 7.25-7.6z"/></svg>'
  const SEND = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 20.85 12.92a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>'
  /** Papel picado: una tira de banderines de colores con calados. Se mecen (salvo con menos movimiento). */
  const PICADO = (() => {
    const colors = ['#f2b632', '#c2502e', '#2f9e74', '#3f86a8', '#e2679a', '#f08a24']
    const flags = Array.from({ length: 12 }, (_, i) => {
      const x = i * 36 + 2
      const c = colors[i % colors.length]
      return `<g class="flag" style="transform-origin:${x + 16}px 6px;animation-delay:${(i % 4) * -0.7}s">
        <path d="M${x} 6h32v30l-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4z" fill="${c}"/>
        <path d="M${x + 16} 13l4 5-4 5-4-5zM${x + 7} 26a2 2 0 1 0 0.01 0M${x + 25} 26a2 2 0 1 0 0.01 0M${x + 7} 13h4v3h-4zM${x + 21} 13h4v3h-4z" fill="rgba(23,32,54,.55)"/>
      </g>`
    }).join('')
    return `<svg class="picado" viewBox="0 0 434 44" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><path d="M0 6h434" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>${flags}</svg>`
  })()
  const STARS = (n) => `<span class="stars" aria-label="${n}/5">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`

  /** Foto con dos tamaños: el marco del teléfono mide ~400 px, así que 800 cubre pantallas 2x. */
  const photo = (name, alt, cls = '', eager = false) =>
    `<img class="${cls}" src="img/${name}-800.webp" srcset="img/${name}-800.webp 800w, img/${name}-1400.webp 1400w" sizes="(min-width: 900px) 400px, 100vw" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`

  // ——— Datos del local ———
  const MAPS = 'https://www.google.com/maps/search/?api=1&query=El+Sol+y+La+Luna+31+Rue+Saint-Jacques+75005+Paris'
  const PHONE = '01 43 54 41 56'
  /** Minutos desde medianoche. Lunes solo por la tarde; el resto, de 11:30 a 23:00. */
  const HOURS = (dow) => (dow === 1 ? [17 * 60, 23 * 60] : [11 * 60 + 30, 23 * 60])
  const parisNow = () => {
    const p = {}
    for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())) p[x.type] = x.value
    return { dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: +p.hour * 60 + +p.minute }
  }
  const hhmm = (min, l) => {
    const h = Math.floor(min / 60), m = min % 60
    if (l === 'fr') return `${h}h${m ? pad(m) : ''}`
    if (l === 'en') return `${h % 12 || 12}${m ? ':' + pad(m) : ''} ${h < 12 ? 'am' : 'pm'}`
    return `${h}:${pad(m)}`
  }
  const LOCALE = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }
  // 7/1/2024 fue domingo: de ahí salen los nombres de los días en cada idioma.
  const dayName = (dow, l) => new Date(2024, 0, 7 + dow).toLocaleDateString(LOCALE[l], { weekday: 'long' })

  // ——— Textos de la web ———
  const T = {
    fr: {
      eyebrow: 'Colombie & Mexique · Paris 5e',
      tagline: 'Cuisine colombienne & mexicaine',
      intro: 'Un coin de Colombie au Quartier Latin : assiettes généreuses, empanadas maison, musique latine et l’accueil de Wilson.',
      rating: '<b>4,4</b> sur Google · 626 avis',
      book: 'Réserver par WhatsApp', directions: 'Itinéraire',
      open: (t) => `Ouvert · jusqu’à ${t}`, opensToday: (t) => `Ouvre aujourd’hui à ${t}`, opensTomorrow: (t) => `Fermé · ouvre demain à ${t}`,
      menuKicker: 'À la carte', menuTitle: 'Les incontournables',
      mexico: 'Et côté Mexique : tacos, burritos, quesadillas, fajitas et guacamole minute.',
      vibeKicker: 'L’ambiance', vibeTitle: 'Ici, on vient aussi pour l’ambiance',
      vibeText: 'Un lustre en bouteilles, des objets ramenés de toute l’Amérique latine, de la cumbia et de la salsa : une soirée chez nous, c’est un petit voyage.',
      chips: ['Musique latine', 'Groupes bienvenus', 'Ouvert 7j/7', 'Français · English · Español'],
      reviewsKicker: 'Avis Google', reviewsTitle: 'Ils en parlent', reviewsCount: '626 avis', sample: 'Exemples d’avis',
      waKicker: 'Réservation', waTitle: 'Réservez sur WhatsApp, même à 23h',
      waText: 'Écrivez-nous en français, en anglais ou en espagnol : réponse immédiate, table réservée et adresse envoyée sur votre téléphone.',
      waChat: ['Bonsoir ! Une table pour 2 ce soir ?', 'Bonsoir ! 🙂 Oui, à 20h ou à 21h30. Je vous la réserve ?', 'Réponse en quelques secondes, 7j/7'],
      infoKicker: 'Infos pratiques', infoTitle: 'Horaires & accès', today: 'Aujourd’hui',
      walk: 'À 5 min à pied de Notre-Dame', call: 'Appeler', mapOpen: 'Ouvrir dans Maps',
      footer: 'Restaurant colombien & mexicain au cœur du Quartier Latin.',
      credits: 'Photos bandeja paisa : Wilfredor (CC0) · ajiaco : Bernard Gagnon (CC BY-SA 4.0), via Wikimedia Commons · Carte © OpenStreetMap',
      demo: 'Démo réalisée par Crow Agency',
    },
    en: {
      eyebrow: 'Colombian & Mexican · Paris 5th',
      tagline: 'Colombian & Mexican kitchen',
      intro: 'A corner of Colombia in the Latin Quarter: generous plates, homemade empanadas, Latin music and a warm welcome from Wilson.',
      rating: '<b>4.4</b> on Google · 626 reviews',
      book: 'Book on WhatsApp', directions: 'Directions',
      open: (t) => `Open now · until ${t}`, opensToday: (t) => `Opens today at ${t}`, opensTomorrow: (t) => `Closed · opens tomorrow at ${t}`,
      menuKicker: 'On the menu', menuTitle: 'Must-try dishes',
      mexico: 'And from Mexico: tacos, burritos, quesadillas, fajitas and freshly made guacamole.',
      vibeKicker: 'The vibe', vibeTitle: 'People come for the vibe, too',
      vibeText: 'A chandelier made of bottles, treasures from all over Latin America, cumbia and salsa playing: an evening here feels like a trip.',
      chips: ['Latin music', 'Groups welcome', 'Open 7 days', 'English · Français · Español'],
      reviewsKicker: 'Google reviews', reviewsTitle: 'What guests say', reviewsCount: '626 reviews', sample: 'Sample reviews',
      waKicker: 'Bookings', waTitle: 'Book on WhatsApp, even at 11 pm',
      waText: 'Message us in English, French or Spanish: you get an instant reply, your table booked and our location on your phone.',
      waChat: ['Hi! A table for 2 tonight?', 'Hi! 🙂 Yes, at 8 pm or 9:30 pm. Shall I book it for you?', 'Replies in seconds, 7 days a week'],
      infoKicker: 'Plan your visit', infoTitle: 'Hours & getting here', today: 'Today',
      walk: '5-minute walk from Notre-Dame', call: 'Call', mapOpen: 'Open in Maps',
      footer: 'Colombian & Mexican restaurant in the heart of the Latin Quarter.',
      credits: 'Bandeja paisa photo: Wilfredor (CC0) · ajiaco: Bernard Gagnon (CC BY-SA 4.0), via Wikimedia Commons · Map © OpenStreetMap',
      demo: 'Demo by Crow Agency',
    },
    es: {
      eyebrow: 'Colombia y México · París 5e',
      tagline: 'Cocina colombiana y mexicana',
      intro: 'Un rincón de Colombia en el Barrio Latino: platos generosos, empanadas caseras, música latina y la bienvenida de Wilson.',
      rating: '<b>4,4</b> en Google · 626 reseñas',
      book: 'Reservar por WhatsApp', directions: 'Cómo llegar',
      open: (t) => `Abierto · hasta las ${t}`, opensToday: (t) => `Abre hoy a las ${t}`, opensTomorrow: (t) => `Cerrado · abre mañana a las ${t}`,
      menuKicker: 'En la carta', menuTitle: 'Los imprescindibles',
      mexico: 'Y del lado mexicano: tacos, burritos, quesadillas, fajitas y guacamole al momento.',
      vibeKicker: 'El ambiente', vibeTitle: 'Aquí también se viene por el ambiente',
      vibeText: 'Una lámpara hecha de botellas, objetos traídos de toda Latinoamérica, cumbia y salsa de fondo: una noche aquí es un pequeño viaje.',
      chips: ['Música latina', 'Grupos bienvenidos', 'Abierto todos los días', 'Español · Français · English'],
      reviewsKicker: 'Reseñas de Google', reviewsTitle: 'Lo que dicen', reviewsCount: '626 reseñas', sample: 'Reseñas de ejemplo',
      waKicker: 'Reservas', waTitle: 'Reserva por WhatsApp, incluso a las 23 h',
      waText: 'Escríbenos en español, francés o inglés: te respondemos al momento, reservamos tu mesa y te mandamos la ubicación.',
      waChat: ['¡Hola! ¿Una mesa para 2 esta noche?', '¡Hola! 🙂 Sí, a las 20:00 o a las 21:30. ¿Te la reservo?', 'Respuesta en segundos, todos los días'],
      infoKicker: 'Información', infoTitle: 'Horarios y cómo llegar', today: 'Hoy',
      walk: 'A 5 minutos a pie de Notre-Dame', call: 'Llamar', mapOpen: 'Abrir en Maps',
      footer: 'Restaurante colombiano y mexicano en pleno Barrio Latino.',
      credits: 'Fotos bandeja paisa: Wilfredor (CC0) · ajiaco: Bernard Gagnon (CC BY-SA 4.0), vía Wikimedia Commons · Mapa © OpenStreetMap',
      demo: 'Demo hecha por Crow Agency',
    },
  }

  const DISHES = [
    {
      img: 'bandeja', name: 'Bandeja paisa', star: true,
      badge: { fr: 'Le plat star', en: 'Our star dish', es: 'El plato estrella' },
      text: {
        fr: 'L’assiette reine de la région paisa : haricots rouges, riz, bœuf haché, chicharrón, chorizo, œuf, banane plantain, arepa et avocat.',
        en: 'The king of Colombian plates: red beans, rice, ground beef, crispy pork belly, chorizo, fried egg, sweet plantain, arepa and avocado.',
        es: 'El plato rey de la región paisa: frijoles, arroz, carne molida, chicharrón, chorizo, huevo, maduro, arepa y aguacate.',
      },
    },
    {
      img: 'empanadas', name: 'Empanadas',
      badge: { fr: 'Faites maison', en: 'Homemade', es: 'Caseras' },
      text: {
        fr: 'Pâte de maïs croustillante, servies avec notre ají maison, guacamole et un trait de citron vert.',
        en: 'Crispy corn dough, served with our homemade ají, guacamole and a squeeze of lime.',
        es: 'Masa de maíz crujiente, con nuestro ají casero, guacamole y un toque de limón.',
      },
    },
    {
      img: 'ajiaco', name: 'Ajiaco',
      badge: { fr: 'Recette de Bogotá', en: 'A Bogotá classic', es: 'Receta bogotana' },
      text: {
        fr: 'La soupe de Bogotá : poulet, trois pommes de terre, maïs et guascas, servie avec crème, câpres et avocat.',
        en: 'Bogotá’s famous soup: chicken, three kinds of potato, corn and guascas, served with cream, capers and avocado.',
        es: 'La sopa bogotana: pollo, tres papas, mazorca y guascas, con crema, alcaparras y aguacate.',
      },
    },
  ]

  // Reseñas de ejemplo (la web real mostraría las de Google).
  const REVIEWS = [
    {
      who: 'Sarah', from: { fr: 'Londres', en: 'London', es: 'Londres' }, stars: 5,
      when: { fr: 'il y a 2 semaines', en: '2 weeks ago', es: 'hace 2 semanas' },
      text: {
        en: 'Huge, delicious bandeja paisa and the friendliest staff. It felt like a little trip to Medellín in the middle of Paris.',
        fr: 'Une bandeja paisa énorme et délicieuse, et une équipe adorable. Un petit voyage à Medellín en plein Paris.',
        es: 'Una bandeja paisa enorme y deliciosa, y un equipo encantador. Un pequeño viaje a Medellín en pleno París.',
      },
    },
    {
      who: 'Julien', from: { fr: 'Paris', en: 'Paris', es: 'París' }, stars: 5,
      when: { fr: 'il y a 1 mois', en: 'a month ago', es: 'hace 1 mes' },
      text: {
        fr: 'Super ambiance, musique latine et des empanadas incroyables. On est venus à dix pour un anniversaire : accueil au top.',
        en: 'Great atmosphere, Latin music and amazing empanadas. We came as a group of ten for a birthday and they looked after us so well.',
        es: 'Muy buen ambiente, música latina y unas empanadas increíbles. Fuimos diez por un cumpleaños y nos atendieron de maravilla.',
      },
    },
    {
      who: 'Marta', from: { fr: 'Madrid', en: 'Madrid', es: 'Madrid' }, stars: 4,
      when: { fr: 'il y a 3 semaines', en: '3 weeks ago', es: 'hace 3 semanas' },
      text: {
        es: 'El ajiaco, como en Bogotá. De noche se llena rápido, mejor reservar. Volveremos seguro.',
        fr: 'L’ajiaco, comme à Bogotá. Le soir c’est vite plein, mieux vaut réserver. On reviendra, c’est sûr.',
        en: 'The ajiaco tastes just like in Bogotá. It fills up fast at night, so book ahead. We will definitely be back.',
      },
    },
  ]

  // ——— Escenas de la demo ———
  const SCENE_LIST = [
    { id: 'web', label: 'La web', short: 'Web', sub: 'FR · EN · ES, platos, reseñas y botón de WhatsApp' },
    { id: 'turista', label: 'Turista · 23 h', short: 'Turista 23 h', sub: 'En inglés: mesa para 4 y opciones sin gluten' },
    { id: 'grupo', label: 'Grupo de 12', short: 'Grupo 12', sub: 'En francés: toma los datos y confirma Wilson' },
    { id: 'agenda', label: 'La agenda de Wilson', short: 'Agenda', sub: 'Todo lo que entró por WhatsApp, en un lugar' },
  ]

  /*
   * Cada paso: `c` escribe el cliente (se teclea en la barra de abajo), `a` contesta el asistente
   * (con `buttons`, respuestas rápidas de WhatsApp), `tap` el cliente toca una de esas respuestas,
   * `card` es el resumen de la reserva, `loc` la ubicación, `pill` la fecha, `note` un apunte de la
   * demo (en castellano, para Wilson), `owner` lo que le llega a Wilson (espera a que toque
   * Confirmar) y `sum` el resumen final para Wilson.
   */
  const SCENES = {
    turista: {
      lang: 'en', online: 'online', typing: 'typing…', placeholder: 'Message', next: 'grupo',
      steps: [
        { k: 'pill', t: 'Today' },
        { k: 'note', t: 'Viernes, 23:12. La cocina ya cerró y Wilson atiende las últimas mesas. Contesta el asistente.' },
        { k: 'c', at: '23:12', t: 'Hi! Do you have a table for 4 tomorrow night? 🙏' },
        { k: 'c', at: '23:12', t: 'Also, do you have gluten-free options? One of us is celiac' },
        { k: 'a', at: '23:12', t: 'Hi! 👋 Yes, tomorrow (Saturday) we still have a table for 4. What time suits you?', buttons: ['7:30 pm', '9:00 pm', 'Another time'] },
        { k: 'a', at: '23:12', t: 'And yes 🌽 Colombian cooking uses a lot of corn, so several dishes are naturally gluten-free: our *ajiaco* (chicken & potato soup), *arepas* and the *bandeja paisa*.\n\nSince it’s for a celiac guest, I’ll add a note to the booking so the kitchen is ready and your waiter can guide you through the rest of the menu.' },
        { k: 'tap', at: '23:13', t: '9:00 pm' },
        { k: 'a', at: '23:13', t: 'Perfect 🙌 What name should I put the booking under?' },
        { k: 'c', at: '23:13', t: 'Emma Clarke' },
        {
          k: 'card', at: '23:13', lead: 'Done! ✅ Your table is booked:',
          card: { state: 'ok', head: 'Booking confirmed', rows: [['calendar', 'Saturday · 9:00 pm'], ['users', '4 people'], ['user', 'Emma Clarke'], ['note', '1 celiac guest · gluten-free']], ics: { dow: 6, at: '21:00', label: 'Add to calendar' } },
        },
        { k: 'loc', at: '23:13' },
        { k: 'a', at: '23:13', t: 'We’re in the Latin Quarter, a 5-minute walk from Notre-Dame. Nearest metro: *Maubert–Mutualité* or *Cluny–La Sorbonne* (line 10).\n\nIf your plans change, just reply here. See you tomorrow, there’ll be music! 💃' },
        { k: 'c', at: '23:14', t: 'Amazing, thank you so much!! 🙌' },
        {
          k: 'sum', title: 'Lo que hizo el asistente mientras Wilson cerraba',
          items: [['8 s', 'en contestar, a las 23:12'], ['0', 'mensajes de Wilson'], ['4', 'personas el sábado a las 21:00'], ['1', 'nota para cocina: celíaca']],
          foot: 'Sin asistente, este mensaje se leía mañana al mediodía… y el turista reservaba en otro lado.',
        },
      ],
    },
    grupo: {
      lang: 'fr', online: 'en ligne', typing: 'en train d’écrire…', placeholder: 'Message', next: 'agenda',
      steps: [
        { k: 'pill', t: 'Aujourd’hui' },
        { k: 'note', t: 'Martes, 10:41. Para grupos grandes, el asistente toma los datos y la decisión es de Wilson.' },
        { k: 'c', at: '10:41', t: 'Bonjour ! On voudrait réserver pour 12 personnes vendredi soir, vers 20h30. C’est possible ?' },
        { k: 'a', at: '10:41', t: 'Bonjour et merci de penser à nous ! 🎉 Pour les groupes de plus de 8, c’est Wilson, le patron, qui valide la table. Je prends vos infos et il vous confirme très vite.\n\nC’est à quel nom ? Une occasion particulière ?' },
        { k: 'c', at: '10:42', t: 'Camille Martin. C’est pour un anniversaire 🎂 On a 2 végétariens, et on peut apporter un gâteau ?' },
        {
          k: 'card', at: '10:42', lead: 'Avec plaisir pour le gâteau ! Voici votre demande :',
          card: { state: 'wait', head: 'En attente de Wilson', rows: [['calendar', 'Vendredi · 20h30'], ['users', '12 personnes'], ['user', 'Camille Martin'], ['note', 'Anniversaire · gâteau apporté · 2 végétariens']] },
        },
        { k: 'a', at: '10:42', t: 'Je vous écris ici dès qu’il confirme 🙂' },
        { k: 'owner', at: '10:52' },
        {
          k: 'card', at: '10:52', lead: 'Bonne nouvelle Camille ! Wilson confirme votre table 🥳',
          card: { state: 'ok', head: 'Réservation confirmée', rows: [['calendar', 'Vendredi · 20h30'], ['users', '12 personnes'], ['user', 'Camille Martin']], ics: { dow: 5, at: '20:30', label: 'Ajouter au calendrier' } },
        },
        { k: 'a', at: '10:52', t: 'Apportez le gâteau, on s’occupe des bougies 🕯️ On vous attend pour fêter ça en musique !' },
        { k: 'c', at: '10:53', t: 'Super, merci beaucoup !! 🙏' },
        {
          k: 'sum', title: 'Lo que tuvo que hacer Wilson',
          items: [['1 toque', 'para confirmar el grupo'], ['0', 'llamadas ni mensajes'], ['12', 'personas el viernes a las 20:30'], ['🎂', 'torta y 2 vegetarianos anotados']],
          foot: 'Los grupos grandes los decide siempre Wilson. El asistente junta los datos, le avisa en español y contesta al cliente en su idioma.',
        },
      ],
    },
  }

  /*
   * La agenda de Wilson (datos de ejemplo): lo que entró por WhatsApp. `from` marca las dos reservas
   * que salen de los chats de la demo.
   */
  const AGENDA = [
    {
      day: 'Viernes', rows: [
        { at: '19:00', who: 'Lucía Pérez', n: 2, flag: '🇪🇸', tags: [] },
        { at: '20:30', who: 'Camille Martin', n: 12, flag: '🇫🇷', tags: ['Cumpleaños · traen torta', '2 vegetarianos'], from: 'grupo', state: 'Confirmada por ti' },
        { at: '21:00', who: 'Daniel Kim', n: 6, flag: '🇬🇧', tags: [] },
        { at: '22:00', who: 'Jules & Inès', n: 2, flag: '🇫🇷', tags: ['Mesa tranquila'] },
      ],
    },
    {
      day: 'Sábado', rows: [
        { at: '13:00', who: 'Famille Dubois', n: 5, flag: '🇫🇷', tags: ['Silla para bebé'] },
        { at: '19:30', who: 'Andrés Mejía', n: 3, flag: '🇨🇴', tags: [] },
        { at: '21:00', who: 'Emma Clarke', n: 4, flag: '🇬🇧', tags: ['Celíaca · sin gluten'], from: 'turista', state: 'Reservada a las 23:12' },
        { at: '21:30', who: 'Marco Rossi', n: 2, flag: '🇮🇹', tags: [] },
      ],
    },
  ]

  // ——— Estado y enlaces ———
  const params = new URLSearchParams(location.search)
  const pick = (v, list, def) => (list.includes(v) ? v : def)
  let lang = pick(params.get('lang') || store.get('lang'), ['fr', 'en', 'es'], 'fr')
  let scene = pick(params.get('ver'), SCENE_LIST.map((s) => s.id), 'web')

  const syncUrl = () => {
    const q = new URLSearchParams(location.search)
    q.set('ver', scene)
    if (scene === 'web') q.set('lang', lang)
    else q.delete('lang')
    history.replaceState(null, '', `${location.pathname}?${q}`)
  }

  // ——— La web ———
  function status() {
    const t = T[lang], { dow, min } = parisNow(), [from, to] = HOURS(dow)
    if (min >= from && min < to) return { open: true, text: t.open(hhmm(to, lang)) }
    if (min < from) return { open: false, text: t.opensToday(hhmm(from, lang)) }
    return { open: false, text: t.opensTomorrow(hhmm(HOURS((dow + 1) % 7)[0], lang)) }
  }

  function renderWeb() {
    const t = T[lang]
    const st = status()
    const today = parisNow().dow
    document.documentElement.lang = lang
    $web.innerHTML = `
      <header class="site-head">
        <a class="brand" href="#top" data-a="top">${SUN('sun')}<span>El Sol <i>&amp;</i> La Luna</span></a>
        <div class="langs" role="group" aria-label="Langue / Language / Idioma">
          ${['fr', 'en', 'es'].map((l) => `<button data-a="lang" data-v="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('')}
        </div>
      </header>

      <section class="hero" id="top">
        ${photo('interieur-lustre', '', 'hero-img', true)}
        ${PICADO}
        <div class="hero-body">
          <p class="status ${st.open ? 'is-open' : ''}"><span class="dot"></span>${esc(st.text)}</p>
          <p class="eyebrow">${esc(t.eyebrow)}</p>
          <h1>El Sol &amp; La Luna</h1>
          <p class="tagline">${esc(t.tagline)}</p>
          <p class="intro">${esc(t.intro)}</p>
          <p class="rating"><span class="star">★</span> ${t.rating}</p>
          <div class="hero-ctas">
            <button class="btn btn-wa btn-block" data-a="wa">${WA_LOGO}${esc(t.book)}</button>
            <div class="hero-sub">
              <a class="btn btn-ghost" href="${MAPS}" target="_blank" rel="noopener">${ic('nav', 'ic-sm')}${esc(t.directions)}</a>
              <a class="btn btn-ghost" href="tel:+33143544156">${ic('phone', 'ic-sm')}${esc(t.call)}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="block dishes">
        <p class="kicker">${esc(t.menuKicker)}</p>
        <h2>${esc(t.menuTitle)}</h2>
        ${DISHES.map((d) => `
          <article class="dish ${d.star ? 'is-star' : ''}">
            ${photo(d.img, d.name, 'dish-img')}
            <div class="dish-body">
              <span class="badge">${d.star ? '★ ' : ''}${esc(d.badge[lang])}</span>
              <h3>${esc(d.name)}</h3>
              <p>${esc(d.text[lang])}</p>
            </div>
          </article>`).join('')}
        <div class="mexico">
          ${photo('burrito-guacamole', 'Burrito & guacamole')}
          ${photo('quesadilla', 'Quesadilla')}
        </div>
        <p class="mexico-text">🌮 ${esc(t.mexico)}</p>
      </section>

      <section class="vibe">
        ${photo('interieur-deco', '', 'vibe-img')}
        <div class="vibe-body">
          <p class="kicker">${ic('music', 'ic-sm')} ${esc(t.vibeKicker)}</p>
          <h2>${esc(t.vibeTitle)}</h2>
          <p>${esc(t.vibeText)}</p>
          <ul class="chips">${t.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        </div>
      </section>
      <div class="strip">
        ${photo('facade', 'Façade, 31 rue Saint-Jacques')}
        ${photo('empanadas', 'Empanadas')}
      </div>

      <section class="block reviews">
        <p class="kicker">${esc(t.reviewsKicker)}</p>
        <div class="reviews-head">
          <h2>${esc(t.reviewsTitle)}</h2>
          <div class="score"><b>${lang === 'en' ? '4.4' : '4,4'}</b>${STARS(4)}<span>${esc(t.reviewsCount)}</span></div>
        </div>
        <div class="review-row">
          ${REVIEWS.map((r) => `
            <figure class="review">
              ${STARS(r.stars)}
              <blockquote>${esc(r.text[lang])}</blockquote>
              <figcaption><span class="avatar">${esc(r.who[0])}</span><span><b>${esc(r.who)}</b> · ${esc(r.from[lang])}<small>${esc(r.when[lang])}</small></span></figcaption>
            </figure>`).join('')}
        </div>
        <p class="sample">${esc(t.sample)}</p>
      </section>

      <section class="block wa-block">
        <p class="kicker">${esc(t.waKicker)}</p>
        <h2>${esc(t.waTitle)}</h2>
        <p>${esc(t.waText)}</p>
        <div class="wa-preview" data-a="wa" role="button" tabindex="0" aria-label="${esc(t.book)}">
          <div class="msg out"><div class="bubble">${esc(t.waChat[0])}<span class="meta">20:41${TICKS.replace('ticks', 'ticks read')}</span></div></div>
          <div class="msg in"><div class="bubble">${esc(t.waChat[1])}<span class="meta">20:41</span></div></div>
          <p class="wa-preview-note">${ic('clock', 'ic-sm')} ${esc(t.waChat[2])}</p>
        </div>
        <button class="btn btn-wa btn-block" data-a="wa">${WA_LOGO}${esc(t.book)}</button>
      </section>

      <section class="block info">
        <p class="kicker">${esc(t.infoKicker)}</p>
        <h2>${esc(t.infoTitle)}</h2>
        <ul class="hours">
          ${[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const [a, b] = HOURS(d)
            return `<li class="${d === today ? 'is-today' : ''}"><span>${esc(dayName(d, lang))}${d === today ? ` <em>${esc(t.today)}</em>` : ''}</span><span>${hhmm(a, lang)} – ${hhmm(b, lang)}</span></li>`
          }).join('')}
        </ul>
        <a class="map" href="${MAPS}" target="_blank" rel="noopener">
          <img src="img/mapa.webp" alt="" loading="lazy" decoding="async" width="800" height="440">
          <span class="map-pin">${ic('pin')}</span>
          <span class="map-label">${esc(t.mapOpen)} ${ic('arrow', 'ic-sm')}</span>
        </a>
        <ul class="facts">
          <li>${ic('pin')}<span><b>31 rue Saint-Jacques, 75005 Paris</b><small>${esc(t.walk)}</small></span></li>
          <li>${ic('train')}<span><b>Maubert–Mutualité · Cluny–La Sorbonne</b><small>Métro 10 · RER B/C Saint-Michel</small></span></li>
          <li>${ic('phone')}<span><b><a href="tel:+33143544156">${PHONE}</a></b><small>${esc(t.call)}</small></span></li>
        </ul>
      </section>

      <footer class="site-foot">
        <p class="brand">${SUN('sun')}<span>El Sol <i>&amp;</i> La Luna</span></p>
        <p>${esc(t.footer)}</p>
        <p class="credits">${esc(t.credits)}</p>
        <p class="credits">${esc(t.demo)}</p>
      </footer>

      <div class="sticky-cta" id="sticky-cta">
        <button class="btn btn-wa btn-block" data-a="wa">${WA_LOGO}${esc(t.book)}</button>
      </div>`
    watchHero()
  }

  // El botón fijo de abajo aparece pasado el héroe y se esconde mientras haya otro botón de reserva
  // a la vista (el de la sección de WhatsApp): nunca dos botones verdes a la vez.
  let heroObs = null
  function watchHero() {
    heroObs?.disconnect()
    const cta = $web.querySelector('#sticky-cta')
    const hero = $web.querySelector('.hero-ctas')
    const others = [hero, ...$web.querySelectorAll('.wa-block .btn-wa')]
    if (!('IntersectionObserver' in window)) return cta.classList.add('on')
    const seen = new Map()
    let passedHero = false
    heroObs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        seen.set(e.target, e.isIntersecting)
        if (e.target === hero) passedHero = !e.isIntersecting && e.boundingClientRect.top < 0
      }
      cta.classList.toggle('on', passedHero && ![...seen.values()].some(Boolean))
    }, { root: $web })
    others.forEach((el) => heroObs.observe(el))
  }

  // ——— Chat ———
  let run = 0 // sube con cada escena nueva: los pasos de la anterior dejan de pintar
  let skip = null // resuelve la espera en curso (tocar el chat adelanta)
  let fast = false
  const sleep = (ms) => new Promise((resolve) => {
    const done = () => { clearTimeout(timer); if (skip === done) skip = null; resolve() }
    const timer = setTimeout(done, reduced ? Math.min(ms, 250) : ms)
    skip = done
  })

  function renderChat(id) {
    const sc = SCENES[id]
    $chat.lang = sc.lang
    $chat.innerHTML = `
      <div class="wa">
        <header class="wa-head">
          <button class="wa-back" data-a="scene" data-v="web" aria-label="Volver a la web">${ic('back')}</button>
          <span class="wa-avatar">${SUN('sun')}</span>
          <div class="wa-who"><b>El Sol &amp; La Luna</b><span id="wa-status">${esc(sc.online)}</span></div>
          <span class="wa-icons">${ic('video')}${ic('phone')}</span>
        </header>
        <div class="wa-body" id="wa-body" data-a="skip">
          <div class="wa-thread" id="wa-thread" aria-live="polite"></div>
        </div>
        <div class="wa-end" id="wa-end" hidden>
          <button class="end-btn" data-a="replay">${ic('replay', 'ic-sm')} Repetir</button>
          <button class="end-btn end-next" data-a="scene" data-v="${sc.next}">${esc(SCENE_LIST.find((s) => s.id === sc.next).label)} ${ic('arrow', 'ic-sm')}</button>
        </div>
        <footer class="wa-compose">
          <div class="wa-field">${ic('smile', 'ic-sm muted')}<span id="wa-input" class="wa-input is-empty">${esc(sc.placeholder)}</span>${ic('camera', 'ic-sm muted')}</div>
          <span class="wa-send" id="wa-send">${ic('mic')}</span>
        </footer>
        <div class="sheet-root" id="sheet"></div>
      </div>`
    play(id)
  }

  async function play(id) {
    const my = ++run
    const sc = SCENES[id]
    const $body = document.getElementById('wa-body')
    const $thread = document.getElementById('wa-thread')
    const $status = document.getElementById('wa-status')
    const $input = document.getElementById('wa-input')
    const $send = document.getElementById('wa-send')
    let lastSide = null
    const alive = () => my === run

    const scroll = () => $body.scrollTo({ top: $body.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
    const add = (html, side) => {
      const el = document.createElement('div')
      el.className = side ? `msg ${side}${side === lastSide ? ' cont' : ''}` : 'sys'
      el.innerHTML = html
      $thread.appendChild(el)
      lastSide = side || null
      requestAnimationFrame(scroll)
      return el
    }
    const meta = (at, out) => `<span class="meta">${at}${out ? TICKS : ''}</span>`
    const bubbleIn = (inner, at, cls = '') => add(`<div class="bubble ${cls}">${inner}${meta(at)}</div>`, 'in')

    async function typingIn(len) {
      $thread.querySelectorAll('.msg.out .ticks').forEach((t) => t.classList.add('read'))
      $status.textContent = sc.typing
      $status.classList.add('is-typing')
      const dots = add('<div class="bubble typing"><i></i><i></i><i></i></div>', 'in')
      await sleep(Math.max(900, Math.min(2600, 600 + len * 14)))
      dots.remove()
      lastSide = $thread.lastElementChild?.classList.contains('in') ? 'in' : $thread.lastElementChild?.classList.contains('out') ? 'out' : null
      $status.textContent = sc.online
      $status.classList.remove('is-typing')
    }

    async function typeOut(text) {
      $input.classList.remove('is-empty')
      $send.innerHTML = SEND
      const chars = [...text]
      const per = Math.min(32, 1400 / chars.length)
      for (let i = 1; i <= chars.length; i++) {
        if (fast || !alive()) break
        $input.textContent = chars.slice(0, i).join('')
        await sleep(per)
      }
      if (!alive()) return
      await sleep(260)
      $input.textContent = sc.placeholder
      $input.classList.add('is-empty')
      $send.innerHTML = ic('mic')
    }

    for (const step of sc.steps) {
      if (!alive()) return
      fast = false
      if (step.k === 'pill') add(`<span class="pill">${esc(step.t)}</span>`)
      else if (step.k === 'note') {
        await sleep(500)
        add(`<p class="demo-note"><span>${ic('sparkle', 'ic-sm')} Demo</span>${esc(step.t)}</p>`)
        await sleep(1400)
      } else if (step.k === 'c') {
        await typeOut(step.t)
        if (!alive()) return
        add(`<div class="bubble">${wa(step.t)}${meta(step.at, true)}</div>`, 'out')
        await sleep(700)
      } else if (step.k === 'a') {
        await typingIn(step.t.length)
        if (!alive()) return
        if (step.buttons) {
          add(`<div class="stack"><div class="bubble">${wa(step.t)}${meta(step.at)}</div>
            <div class="qr">${step.buttons.map((b) => `<span class="qr-btn">${esc(b)}</span>`).join('')}</div></div>`, 'in')
        } else bubbleIn(wa(step.t), step.at)
        await sleep(900)
      } else if (step.k === 'tap') {
        const btn = [...$thread.querySelectorAll('.qr-btn')].find((b) => b.textContent === step.t)
        await sleep(1200)
        if (!alive()) return
        btn?.classList.add('tapped')
        btn?.closest('.qr').classList.add('used')
        await sleep(450)
        if (!alive()) return
        add(`<div class="bubble">${esc(step.t)}${meta(step.at, true)}</div>`, 'out')
        await sleep(600)
      } else if (step.k === 'card') {
        await typingIn(step.lead.length + 60)
        if (!alive()) return
        bubbleIn(wa(step.lead), step.at)
        await sleep(350)
        bubbleIn(bookingCard(step.card), step.at, 'bubble-card')
        await sleep(1100)
      } else if (step.k === 'loc') {
        await typingIn(20)
        if (!alive()) return
        bubbleIn(`<a class="loc" href="${MAPS}" target="_blank" rel="noopener">
            <span class="loc-map"><img src="img/mapa.webp" alt="" width="800" height="440"><span class="map-pin">${ic('pin')}</span></span>
            <span class="loc-txt"><b>El Sol &amp; La Luna</b><span>31 Rue Saint-Jacques, 75005 Paris</span></span>
          </a>`, step.at, 'bubble-loc')
        await sleep(1100)
      } else if (step.k === 'sum') {
        await sleep(700)
        if (!alive()) return
        add(`<div class="sum">
          <p class="sum-k">${ic('sparkle', 'ic-sm')} Resumen para Wilson</p>
          <h4>${esc(step.title)}</h4>
          <div class="sum-grid">${step.items.map(([b, t]) => `<div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('')}</div>
          <p class="sum-foot">${esc(step.foot)}</p>
        </div>`)
      } else if (step.k === 'owner') {
        await sleep(900)
        if (!alive()) return
        await ownerSheet(my)
        if (!alive()) return
        add(`<span class="pill pill-soft">10 min plus tard</span>`)
      }
    }
    if (!alive()) return
    await sleep(400)
    document.getElementById('wa-end').hidden = false
  }

  function bookingCard(c) {
    return `<div class="bk bk-${c.state}">
      <div class="bk-head">${ic(c.state === 'ok' ? 'check' : 'hourglass', 'ic-sm')}${esc(c.head)}</div>
      <ul>${c.rows.map(([i, v]) => `<li>${ic(i, 'ic-sm')}<span>${esc(v)}</span></li>`).join('')}</ul>
      <div class="bk-foot">${SUN('sun')} El Sol &amp; La Luna · 31 rue Saint-Jacques</div>
    </div>${c.ics ? `<button class="bk-btn" data-a="ics" data-dow="${c.ics.dow}" data-at="${c.ics.at}" data-who="${esc(c.rows.find((r) => r[0] === 'user')[1])}">${ic('calendar', 'ic-sm')} ${esc(c.ics.label)}</button>` : ''}`
  }

  /** Lo que le llega a Wilson por WhatsApp, en castellano. Sigue cuando toca «Confirmar». */
  function ownerSheet(my) {
    const $sheet = document.getElementById('sheet')
    $sheet.innerHTML = `
      <div class="sheet-backdrop"></div>
      <div class="sheet" role="dialog" aria-label="El WhatsApp de Wilson">
        <p class="sheet-kicker">${ic('bell', 'ic-sm')} Mientras tanto, en el WhatsApp de Wilson</p>
        <div class="owner-chat">
          <div class="owner-head"><span class="wa-avatar small">${SUN('sun')}</span><b>Asistente · El Sol &amp; La Luna</b></div>
          <div class="owner-thread" id="owner-thread">
            <div class="msg in"><div class="bubble">${wa('🔔 *Grupo para confirmar*\nViernes · 20:30 · *12 personas*\nA nombre de Camille Martin (escribe en francés)\nCumpleaños: traen torta · 2 vegetarianos\n\nEse viernes por la noche ya hay 26 personas reservadas.')}<span class="meta">10:42</span></div></div>
            <div class="owner-actions" id="owner-actions">
              <button class="owner-btn is-main" data-a="owner-ok">${ic('check', 'ic-sm')} Confirmar</button>
              <button class="owner-btn" data-a="owner-other">${ic('clock', 'ic-sm')} Proponer otra hora</button>
            </div>
            <p class="owner-hint" id="owner-hint" hidden>En la versión real, Wilson elige la hora y el asistente se la propone a Camille. Para la demo, toca «Confirmar».</p>
          </div>
        </div>
      </div>`
    requestAnimationFrame(() => $sheet.classList.add('on'))
    return new Promise((resolve) => {
      ownerDone = async () => {
        ownerDone = null
        const $actions = document.getElementById('owner-actions')
        const $t = document.getElementById('owner-thread')
        $actions.remove()
        document.getElementById('owner-hint').hidden = true
        const out = document.createElement('div')
        out.className = 'msg out'
        out.innerHTML = `<div class="bubble">✅ Confirmar<span class="meta">10:52${TICKS.replace('ticks', 'ticks read')}</span></div>`
        $t.appendChild(out)
        await sleep(900)
        if (my !== run) return resolve()
        const reply = document.createElement('div')
        reply.className = 'msg in'
        reply.innerHTML = `<div class="bubble">${wa('Listo 👍 Le aviso a Camille en francés y queda en la agenda.')}<span class="meta">10:52</span></div>`
        $t.appendChild(reply)
        await sleep(1700)
        $sheet.classList.remove('on')
        await sleep(350)
        $sheet.innerHTML = ''
        resolve()
      }
    })
  }
  let ownerDone = null

  // ——— La agenda de Wilson ———
  function renderAgenda() {
    const total = AGENDA.reduce((n, d) => n + d.rows.length, 0)
    const people = AGENDA.reduce((n, d) => n + d.rows.reduce((m, r) => m + r.n, 0), 0)
    $chat.lang = 'es'
    $chat.innerHTML = `
      <div class="agenda">
        <header class="ag-head">
          <button class="wa-back" data-a="scene" data-v="web" aria-label="Volver a la web">${ic('back')}</button>
          <span class="wa-avatar">${SUN('sun')}</span>
          <div class="wa-who"><b>Reservas · El Sol &amp; La Luna</b><span>Lo que entró por WhatsApp</span></div>
        </header>
        <div class="ag-body">
          <div class="ag-stats">
            <div><b>${total}</b><span>reservas</span></div>
            <div><b>${people}</b><span>personas</span></div>
            <div><b>3</b><span>fuera de horario</span></div>
          </div>
          ${AGENDA.map((d) => `
            <h3 class="ag-day">${esc(d.day)} <span>${d.rows.reduce((m, r) => m + r.n, 0)} pers.</span></h3>
            <ul class="ag-list">
              ${d.rows.map((r) => `
                <li class="ag-row ${r.from ? 'is-demo' : ''}">
                  <span class="ag-time">${r.at}</span>
                  <span class="ag-main">
                    <b>${esc(r.who)} <span class="flag">${r.flag}</span></b>
                    <span class="ag-meta">${ic('users', 'ic-sm')} ${r.n} · ${WA_LOGO} WhatsApp${r.state ? ` · ${esc(r.state)}` : ''}</span>
                    ${r.tags.length ? `<span class="ag-tags">${r.tags.map((t) => `<em>${esc(t)}</em>`).join('')}</span>` : ''}
                  </span>
                  ${r.from ? `<button class="ag-chat" data-a="scene" data-v="${r.from}">Ver chat ${ic('arrow', 'ic-sm')}</button>` : ''}
                </li>`).join('')}
            </ul>`).join('')}
          <p class="demo-note ag-note"><span>${ic('sparkle', 'ic-sm')} Demo</span>Datos de ejemplo. Cada reserva llega con el idioma del cliente, sus notas y el chat completo. Las dos marcadas salen de los chats que acabas de ver.</p>
          <button class="btn btn-wa btn-block" data-a="scene" data-v="web">${ic('back', 'ic-sm')} Volver a la web</button>
        </div>
      </div>`
  }

  /** «Agregar al calendario»: un .ics con la próxima fecha de ese día de la semana, dos horas. */
  function downloadIcs({ dow, at, who }) {
    const { dow: today } = parisNow()
    const d = new Date()
    d.setDate(d.getDate() + (((+dow - today + 7) % 7) || 7))
    const [h, m] = at.split(':').map(Number)
    const stamp = (hh, mm) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//El Sol & La Luna//Demo//FR', 'BEGIN:VEVENT',
      `UID:${Date.now()}@el-sol-la-luna`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=Europe/Paris:${stamp(h, m)}`, `DTEND;TZID=Europe/Paris:${stamp(h + 2, m)}`,
      `SUMMARY:El Sol & La Luna · ${who}`, 'LOCATION:31 Rue Saint-Jacques\\, 75005 Paris', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    a.download = 'el-sol-la-luna.ics'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  // ——— Escenas ———
  function renderNav() {
    $bar.innerHTML = SCENE_LIST.map((s) => `<button data-a="scene" data-v="${s.id}" aria-pressed="${s.id === scene}">${esc(s.short)}</button>`).join('')
    $pitch.innerHTML = SCENE_LIST.map((s, i) => `<button class="scene-btn" data-a="scene" data-v="${s.id}" aria-pressed="${s.id === scene}"><span class="n">${i + 1}</span><span><b>${esc(s.label)}</b><small>${esc(s.sub)}</small></span></button>`).join('')
  }

  function setScene(id) {
    scene = id
    run++
    ownerDone = null
    renderNav()
    syncUrl()
    const isWeb = id === 'web'
    $web.hidden = !isWeb
    $chat.hidden = isWeb
    if (isWeb) { $chat.innerHTML = ''; $web.focus({ preventScroll: true }) } else if (id === 'agenda') renderAgenda()
    else renderChat(id)
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]')
    if (!el) return
    const a = el.dataset.a
    if (a === 'lang') {
      lang = el.dataset.v
      store.set('lang', lang)
      renderWeb()
      syncUrl()
    } else if (a === 'top') {
      e.preventDefault()
      $web.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    } else if (a === 'wa') setScene(lang === 'fr' ? 'grupo' : 'turista')
    else if (a === 'scene') setScene(el.dataset.v)
    else if (a === 'replay') setScene(scene)
    else if (a === 'skip') { fast = true; skip?.() }
    else if (a === 'owner-ok') ownerDone?.()
    else if (a === 'ics') downloadIcs(el.dataset)
    else if (a === 'owner-other') document.getElementById('owner-hint').hidden = false
  })

  // La vista previa del chat de la web es un div con role=button: Enter y espacio también la abren.
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"][data-a]')) { e.preventDefault(); e.target.click() }
  })

  renderWeb()
  setScene(scene)
})()
