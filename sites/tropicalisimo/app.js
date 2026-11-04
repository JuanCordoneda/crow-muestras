/*
 * Tropicalisimo · demo móvil.
 *   #        → la web (ES / FR)
 *   #reserva → chat de WhatsApp en español: mesa para 8, cumpleaños
 *   #menu-fr → chat de WhatsApp en francés: menú del día y precio
 * Los chats se reproducen solos; tocar la conversación adelanta el paso que está esperando.
 */
;(function () {
  'use strict'

  const CONFIG = {
    nombre: 'Tropicalisimo',
    encargada: 'Ana',
    calle: '6 Rue Martre',
    ciudad: '92110 Clichy',
    // Número de WhatsApp del restaurante (+33…). Vacío: los botones abren los chats de la demo.
    whatsapp: '',
    precioMenu: { es: '14,50\u00a0€', fr: '14,50\u00a0€' },
    google: { nota: '4,3', resenas: 216 },
    // [abre, cierra] por día, 0 = domingo. null = cerrado.
    horarios: { 0: [13, 18], 1: [12, 18], 2: [12, 18], 3: null, 4: [12, 22], 5: [12, 22], 6: [12, 22] },
  }

  const params = new URLSearchParams(location.search)
  const $ = (sel, root = document) => root.querySelector(sel)
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const store = {
    get(k) { try { return localStorage.getItem('tropicalisimo:' + k) } catch (e) { return null } },
    set(k, v) { try { localStorage.setItem('tropicalisimo:' + k, v) } catch (e) {} },
  }

  /* ---------- Hora de París (?hora=HH:MM la simula) ---------- */
  function ahora() {
    const p = {}
    for (const { type, value } of new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date())) p[type] = value
    let h = +p.hour, m = +p.minute
    const q = params.get('hora')
    if (q && /^\d{1,2}:\d{2}$/.test(q)) [h, m] = q.split(':').map(Number)
    const fecha = new Date(Date.UTC(+p.year, +p.month - 1, +p.day))
    return { fecha, dow: fecha.getUTCDay(), min: h * 60 + m }
  }
  const masDias = (fecha, n) => new Date(fecha.getTime() + n * 864e5)
  const DIAS = {
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const mes = (fecha, lang) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'es-ES', { timeZone: 'UTC', month: 'long' }).format(fecha)
  const fechaLarga = (fecha, lang) => lang === 'fr'
    ? `${DIAS.fr[fecha.getUTCDay()]} ${fecha.getUTCDate()} ${mes(fecha, 'fr')}`
    : `${DIAS.es[fecha.getUTCDay()]} ${fecha.getUTCDate()} de ${mes(fecha, 'es')}`
  const hora = (h, lang) => (lang === 'fr' ? `${h}h` : `${h}:00`)

  /** Abierto ahora, abre más tarde hoy, o cerrado hasta el próximo día que abre. */
  function estado(n) {
    const hoy = CONFIG.horarios[n.dow]
    if (hoy && n.min >= hoy[0] * 60 && n.min < hoy[1] * 60) return { tipo: 'abierto', hasta: hoy[1] }
    if (hoy && n.min < hoy[0] * 60) return { tipo: 'abre-hoy', desde: hoy[0] }
    for (let i = 1; i <= 7; i++) {
      const h = CONFIG.horarios[(n.dow + i) % 7]
      if (h) return { tipo: 'cerrado', dias: i, desde: h[0], dow: (n.dow + i) % 7 }
    }
  }
  /** El día del menú que se muestra: hoy si todavía abre o está abierto; si no, el próximo día que abre. */
  function diaDelMenu(n) {
    for (let i = 0; i <= 7; i++) {
      const dow = (n.dow + i) % 7, h = CONFIG.horarios[dow]
      if (h && (i > 0 || n.min < h[1] * 60)) return { dias: i, dow, fecha: masDias(n.fecha, i), horario: h }
    }
  }
  const cuando = (dias, dow, lang) => dias === 0
    ? (lang === 'fr' ? 'aujourd’hui' : 'hoy')
    : dias === 1 ? (lang === 'fr' ? 'demain' : 'mañana') : DIAS[lang][dow]

  /* ---------- Íconos ---------- */
  const svg = (body, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`
  const I = {
    wa: svg('<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9.2 8.6c.2-.5.6-.6.9-.6h.5c.2 0 .4.1.5.4l.6 1.5c.1.3 0 .5-.1.7l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.5-.2.7-.1l1.5.6c.3.1.4.3.4.5v.5c0 .3-.1.7-.6.9-.7.4-1.8.4-3-.2a9 9 0 0 1-4.2-4.2c-.6-1.2-.6-2.3-.2-3z" fill="currentColor" stroke="none"/>'),
    star: svg('<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill="currentColor" stroke="none"/>'),
    back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    video: svg('<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    replay: svg('<path d="M3 12a9 9 0 0 1 15.3-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16M8 16H3v5"/>'),
    smile: svg('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'),
    clip: svg('<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 0 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>'),
    camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>'),
    mic: svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>', ' class="ico-mic"'),
    send: svg('<path d="M3.4 20.4 21 12 3.4 3.6v6.4l12 2-12 2z" fill="currentColor" stroke="none"/>', ' class="ico-send"'),
    checks: '<svg viewBox="0 0 16 11" aria-hidden="true"><path fill="currentColor" d="M11.1.7 4.6 8.1 1.9 5.5l-1 1 3.8 3.7 7.4-8.6zm4 0L8.6 8.1l-.8-.8-1 1 1.9 1.9 7.4-8.6z"/></svg>',
    pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    nav: svg('<path d="M3 11l19-9-9 19-2-8z"/>'),
    plate: svg('<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>'),
    users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    ball: svg('<circle cx="12" cy="12" r="10"/><path d="M12 7.5l4.3 3.1-1.6 5H9.3l-1.6-5zM12 7.5V2.2M16.3 10.6l5-1.6M14.7 15.6l3 4.2M9.3 15.6l-3 4.2M7.7 10.6l-5-1.6"/>'),
    bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  }
  const marca = `<svg class="brand-mark" viewBox="0 0 34 34" aria-hidden="true"><clipPath id="mk"><circle cx="17" cy="17" r="17"/></clipPath><g clip-path="url(#mk)"><rect width="34" height="17" fill="#f2b632"/><rect y="17" width="34" height="8.5" fill="#24498a"/><rect y="25.5" width="34" height="8.5" fill="#c8433a"/></g><circle cx="17" cy="11.5" r="5" fill="#fff8ec"/><path d="M17 3.5v1.6M9.5 11.5h1.6M22.9 11.5h1.6M11.7 6.2l1.1 1.1M22.3 6.2l-1.1 1.1" stroke="#fff8ec" stroke-width="1.6" stroke-linecap="round"/></svg>`

  /* ---------- Textos de la web ---------- */
  const T = {
    es: {
      eyebrow: 'Restaurante colombiano · Clichy',
      h1: 'Sabor colombiano y porciones <em>de verdad</em>.',
      lead: 'Menú del día, platos típicos y ambiente familiar. Como comer en casa, pero sin lavar los platos.',
      reservar: 'Reservar por WhatsApp',
      verMenu: 'Ver el menú del día',
      resenas: (g) => `${g.nota} · ${g.resenas} reseñas en Google`,
      estado(e) {
        if (e.tipo === 'abierto') return `Abierto ahora · hasta las ${hora(e.hasta, 'es')}`
        if (e.tipo === 'abre-hoy') return `Abre hoy a las ${hora(e.desde, 'es')}`
        return `Cerrado · abre ${e.dias === 1 ? 'mañana' : 'el ' + DIAS.es[e.dow]} a las ${hora(e.desde, 'es')}`
      },
      platoHero: 'Bandeja paisa',
      menuTitulo: 'Menú del día',
      menuFecha: (d) => d.dias < 2 ? `${cap(cuando(d.dias, d.dow, 'es'))} · ${fechaLarga(d.fecha, 'es')}` : cap(fechaLarga(d.fecha, 'es')),
      menuIncluye: 'Entrada + plato fuerte + jugo natural',
      precioEtiqueta: 'el menú',
      o: 'o',
      cursos: [
        { label: 'Entrada', platos: [{ art: 'empanadas', nombre: 'Empanadas', desc: 'Dos empanadas de carne, bien crocantes, con ají de la casa.' }] },
        { label: 'Plato fuerte · a elegir', platos: [
          { art: 'bandeja', nombre: 'Bandeja paisa', desc: 'Frijoles, arroz, carne molida, chicharrón, huevo frito, maduro, aguacate y arepa.' },
          { art: 'sancocho', nombre: 'Sancocho de gallina', desc: 'Con mazorca, yuca y papa. Viene con arroz y aguacate.' },
        ] },
        { label: 'Bebida', platos: [{ art: 'jugo', nombre: 'Jugo natural', desc: 'De lulo, mora o maracuyá.' }] },
      ],
      menuPie: 'El menú cambia cada día. <b>Pregúntenos el de hoy por WhatsApp</b>',
      porQueKicker: (g) => `${g.nota} ★ en Google`,
      porQue: 'Por qué la gente vuelve',
      razones: [
        { ico: 'plate', t: 'Porciones generosas', d: 'Aquí nadie se queda con hambre.' },
        { ico: 'users', t: 'Ambiente familiar', d: 'Para venir con los niños, los abuelos y los amigos.' },
        { ico: 'ball', t: 'Partidos y eventos', d: 'Vemos el fútbol juntos y organizamos noches especiales. Pregunte por el próximo.' },
      ],
      fiestaT: '¿Cumpleaños, grupo o partido?',
      fiestaD: `Le guardamos la mesa y, si quiere, preparamos la torta y decoramos. ${CONFIG.encargada} y el equipo se encargan de todo.`,
      fiestaBtn: 'Organizar por WhatsApp',
      horariosKicker: 'Horarios',
      horarios: 'Cuándo venir',
      hoy: 'Hoy',
      cerrado: 'Cerrado',
      dondeKicker: 'Dónde estamos',
      donde: 'En Clichy',
      dondeD: `Mesas para familias y grupos. Pregunte por ${CONFIG.encargada}.`,
      comoLlegar: 'Cómo llegar',
      verGoogle: 'Reseñas',
      pie: 'Restaurante colombiano',
    },
    fr: {
      eyebrow: 'Restaurant colombien · Clichy',
      h1: 'La Colombie dans l’assiette, <em>et bien servie</em>.',
      lead: 'Menu du jour, plats typiques et ambiance familiale. Comme à la maison, sans la vaisselle.',
      reservar: 'Réserver sur WhatsApp',
      verMenu: 'Voir le menu du jour',
      resenas: (g) => `${g.nota} · ${g.resenas} avis Google`,
      estado(e) {
        if (e.tipo === 'abierto') return `Ouvert · jusqu’à ${hora(e.hasta, 'fr')}`
        if (e.tipo === 'abre-hoy') return `Ouvre aujourd’hui à ${hora(e.desde, 'fr')}`
        return `Fermé · ouvre ${e.dias === 1 ? 'demain' : DIAS.fr[e.dow]} à ${hora(e.desde, 'fr')}`
      },
      platoHero: 'Bandeja paisa',
      menuTitulo: 'Menu du jour',
      menuFecha: (d) => d.dias < 2 ? `${cap(cuando(d.dias, d.dow, 'fr'))} · ${fechaLarga(d.fecha, 'fr')}` : cap(fechaLarga(d.fecha, 'fr')),
      menuIncluye: 'Entrée + plat + jus naturel',
      precioEtiqueta: 'le menu',
      o: 'ou',
      cursos: [
        { label: 'Entrée', platos: [{ art: 'empanadas', nombre: 'Empanadas', desc: 'Deux empanadas à la viande, bien croustillantes, avec la sauce ají maison.' }] },
        { label: 'Plat au choix', platos: [
          { art: 'bandeja', nombre: 'Bandeja paisa', desc: 'Haricots rouges, riz, bœuf haché, chicharrón (poitrine de porc croustillante), œuf au plat, banane plantain, avocat et arepa.' },
          { art: 'sancocho', nombre: 'Sancocho de gallina', desc: 'Soupe de poule au maïs, manioc et pomme de terre, servie avec riz et avocat.' },
        ] },
        { label: 'Boisson', platos: [{ art: 'jugo', nombre: 'Jus naturel', desc: 'Lulo, mûre ou fruit de la passion.' }] },
      ],
      menuPie: 'Le menu change chaque jour. <b>Demandez celui du jour sur WhatsApp</b>',
      porQueKicker: (g) => `${g.nota} ★ sur Google`,
      porQue: 'Pourquoi on revient',
      razones: [
        { ico: 'plate', t: 'Des assiettes copieuses', d: 'Ici, personne ne repart le ventre vide.' },
        { ico: 'users', t: 'Ambiance familiale', d: 'On vient avec les enfants, les grands-parents et les amis.' },
        { ico: 'ball', t: 'Matchs et soirées', d: 'On regarde le foot ensemble et on organise des soirées. Demandez la prochaine date.' },
      ],
      fiestaT: 'Anniversaire, groupe ou match ?',
      fiestaD: `On vous garde la table et, si vous voulez, on prépare le gâteau et la déco. ${CONFIG.encargada} et l’équipe s’occupent de tout.`,
      fiestaBtn: 'Organiser sur WhatsApp',
      horariosKicker: 'Horaires',
      horarios: 'Quand venir',
      hoy: 'Aujourd’hui',
      cerrado: 'Fermé',
      dondeKicker: 'Nous trouver',
      donde: 'À Clichy',
      dondeD: `Tables pour familles et groupes. Demandez ${CONFIG.encargada}.`,
      comoLlegar: 'Itinéraire',
      verGoogle: 'Avis Google',
      pie: 'Restaurant colombien',
    },
  }

  /* ---------- Enlaces ---------- */
  const direccion = `${CONFIG.calle}, ${CONFIG.ciudad}`
  const mapsBusqueda = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${CONFIG.nombre} ${direccion}`)
  const mapsRuta = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(direccion)
  const facebook = 'https://www.facebook.com/search/top?q=' + encodeURIComponent(`${CONFIG.nombre} Clichy`)
  const waLink = (texto, demo) => CONFIG.whatsapp
    ? `https://wa.me/${CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
    : demo
  const waAttrs = (texto, demo) => `href="${esc(waLink(texto, demo))}"${CONFIG.whatsapp ? ' target="_blank" rel="noopener"' : ''}`

  const demoNav = (activa) => `<nav class="demo" aria-label="Demo">
    <span class="demo-tag">Demo</span>
    <a href="#"${activa === 'web' ? ' aria-current="page"' : ''}>Web</a>
    <a href="#reserva"${activa === 'reserva' ? ' aria-current="page"' : ''}>Chat reserva</a>
    <a href="#menu-fr"${activa === 'menu-fr' ? ' aria-current="page"' : ''}>Chat en francés</a>
  </nav>`

  function banderines() {
    const colores = ['#f2b632', '#c8433a', '#fff8ec', '#8fb0e3']
    let t = ''
    for (let i = 0; i < 13; i++) {
      const x = 14 + i * 28, y = 4 + 9 * Math.sin(Math.PI * x / 364)
      t += `<path d="M${(x - 10).toFixed(1)} ${y.toFixed(1)}h20l-10 20z" fill="${colores[i % 4]}"/>`
    }
    return `<svg class="bunting" viewBox="0 0 364 40" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><path d="M0 2Q182 30 364 2" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>${t}</svg>`
  }

  const mapa = `<svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="360" height="150" fill="#f3ead8"/>
    <path d="M232 -10l70 70-40 40-70-70z" fill="#dcebc6"/>
    <g stroke="#fffdf8" stroke-linecap="round" fill="none">
      <path d="M-10 92L370 54" stroke-width="16"/><path d="M110 -10l40 170" stroke-width="12"/>
      <path d="M-10 30l200 30" stroke-width="8"/><path d="M220 160l40-170" stroke-width="8"/><path d="M0 140l140-26 230 10" stroke-width="8"/>
    </g>
    <text x="196" y="80" font-family="Manrope,sans-serif" font-size="10" font-weight="700" fill="#9b8a76" transform="rotate(-6 196 80)">RUE MARTRE</text>
    <g transform="translate(168 52)"><ellipse cx="0" cy="30" rx="9" ry="3" fill="#2b2017" opacity=".2"/><path d="M0 30s-15-12-15-24a15 15 0 0 1 30 0c0 12-15 24-15 24z" fill="#c8433a"/><circle cx="0" cy="6" r="5.5" fill="#fff8ec"/></g>
  </svg>`

  /* ---------- La web ---------- */
  let lang = (params.get('lang') || store.get('lang') || 'es') === 'fr' ? 'fr' : 'es'

  function renderWeb() {
    const t = T[lang], n = ahora(), e = estado(n), d = diaDelMenu(n)
    const textoReserva = lang === 'fr' ? 'Bonjour, je voudrais réserver une table.' : 'Hola, quisiera reservar una mesa.'
    const textoMenu = lang === 'fr' ? 'Bonjour, quel est le menu du jour ?' : 'Hola, ¿cuál es el menú del día de hoy?'
    const wa = (clase) => `<a class="btn btn-wa ${clase || ''}" ${waAttrs(textoReserva, '#reserva')}>${I.wa}${t.reservar}</a>`
    const semana = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
      const h = CONFIG.horarios[dow], esHoy = dow === n.dow
      return `<li${esHoy ? ' class="today"' : ''}><span class="day">${cap(DIAS[lang][dow])}${esHoy ? `<span class="pill">${t.hoy}</span>` : ''}</span>${h ? `<time>${hora(h[0], lang)} – ${hora(h[1], lang)}</time>` : `<span class="closed">${t.cerrado}</span>`}</li>`
    }).join('')
    const cursos = t.cursos.map((c) => `<div class="course"><p class="course-label">${c.label}</p>${c.platos.map((p, i) => `${i ? `<div class="or">${t.o}</div>` : ''}<div class="dish"><div class="dish-art">${ART[p.art]}</div><div><h3>${p.nombre}</h3><p>${p.desc}</p></div></div>`).join('')}</div>`).join('')

    const web = $('#web')
    document.documentElement.lang = lang
    web.innerHTML = `${demoNav('web')}
    <header class="top">
      <a class="brand" href="#" aria-label="${CONFIG.nombre}">${marca}<span class="brand-name">${CONFIG.nombre}</span></a>
      <div class="lang" role="group" aria-label="Idioma / Langue">
        <button type="button" data-lang="es" aria-pressed="${lang === 'es'}">ES</button>
        <button type="button" data-lang="fr" aria-pressed="${lang === 'fr'}">FR</button>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="hero-art">
          <div class="hero-sun"></div>
          <i class="hero-deco d1"></i><i class="hero-deco d2"></i><i class="hero-deco d3"></i><i class="hero-deco d4"></i>
          <div class="hero-plate">${ART.bandeja}</div>
          <span class="hero-tag">${t.platoHero}</span>
        </div>
        <p class="eyebrow">${t.eyebrow}</p>
        <h1>${t.h1}</h1>
        <p class="lead">${t.lead}</p>
        <div class="ctas" id="ctas">
          ${wa()}
          <button type="button" class="btn btn-ghost" data-ir="menu">${t.verMenu}</button>
        </div>
        <div class="chips">
          <a class="chip" href="${mapsBusqueda}" target="_blank" rel="noopener"><span class="star">${I.star}</span>${t.resenas(CONFIG.google)}</a>
          <span class="chip ${e.tipo === 'abierto' ? 'open' : 'closed'}"><span class="dot"></span>${t.estado(e)}</span>
        </div>
      </section>
      <div class="flag" aria-hidden="true"><i></i><i></i><i></i></div>

      <section class="section" id="menu">
        <div class="menu-card reveal">
          <div class="price"><div><strong>${CONFIG.precioMenu[lang]}</strong><small>${t.precioEtiqueta}</small></div></div>
          <p class="menu-date">${t.menuFecha(d)}</p>
          <h2>${t.menuTitulo}</h2>
          <p class="menu-incl">${t.menuIncluye}</p>
          ${cursos}
          <a class="menu-foot" ${waAttrs(textoMenu, '#menu-fr')}>${I.wa}<span>${t.menuPie}</span></a>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <p class="kicker">${t.porQueKicker(CONFIG.google)}</p>
        <h2 style="margin-bottom:16px">${t.porQue}</h2>
        <div class="why">${t.razones.map((r) => `<div class="why-item reveal"><div class="why-ico">${I[r.ico]}</div><div><h3>${r.t}</h3><p>${r.d}</p></div></div>`).join('')}</div>
      </section>

      <section class="party reveal">
        ${banderines()}
        <h2>${t.fiestaT}</h2>
        <p>${t.fiestaD}</p>
        <a class="btn" ${waAttrs(textoReserva, '#reserva')}>${I.wa}${t.fiestaBtn}</a>
      </section>

      <section class="section">
        <p class="kicker">${t.horariosKicker}</p>
        <h2 style="margin-bottom:16px">${t.horarios}</h2>
        <ul class="hours reveal">${semana}</ul>
      </section>

      <section class="section" style="padding-top:0">
        <p class="kicker">${t.dondeKicker}</p>
        <h2 style="margin-bottom:16px">${t.donde}</h2>
        <div class="place reveal">
          <div class="map">${mapa}</div>
          <div class="place-body">
            <address>${CONFIG.calle}<br>${CONFIG.ciudad}</address>
            <p>${t.dondeD}</p>
            <div class="place-actions">
              <a class="btn btn-blue" href="${mapsRuta}" target="_blank" rel="noopener">${I.nav}${t.comoLlegar}</a>
              <a class="btn btn-ghost" href="${mapsBusqueda}" target="_blank" rel="noopener"><span class="star" style="color:var(--sol)">${I.star}</span>${t.verGoogle}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer class="foot">
      <div class="brand">${marca}<span class="brand-name">${CONFIG.nombre}</span></div>
      <p>${t.pie} · ${esc(direccion)}</p>
      <p><a href="${facebook}" target="_blank" rel="noopener">Facebook</a></p>
    </footer>
    <div class="dock" id="dock">${wa()}</div>`

    web.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.lang === lang) return
      lang = b.dataset.lang
      store.set('lang', lang)
      const y = window.scrollY, yw = web.scrollTop
      renderWeb()
      window.scrollTo(0, y); web.scrollTop = yw
    }))
    web.querySelector('[data-ir="menu"]').addEventListener('click', () => $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' }))

    // Las secciones aparecen al llegar a ellas.
    const reveals = web.querySelectorAll('.reveal')
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
      }), { rootMargin: '0px 0px -8% 0px' })
      reveals.forEach((el) => io.observe(el))
    } else reveals.forEach((el) => el.classList.add('in'))

    // La CTA de abajo aparece cuando los botones del principio ya no se ven.
    const dock = $('#dock')
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => dock.classList.toggle('show', !entry.isIntersecting && entry.boundingClientRect.top < 0)).observe($('#ctas'))
    }
  }

  /* ---------- Chats de WhatsApp ---------- */
  function guion(tipo) {
    const n = ahora()
    if (tipo === 'reserva') {
      const hasta = ((6 - n.dow + 7) % 7) || 7
      const sab = masDias(n.fecha, hasta)
      const fecha = `${sab.getUTCDate()} de ${mes(sab, 'es')}`
      return {
        lang: 'es',
        pasos: [
          { c: 'Hola, buenas 👋 Quería reservar una mesa para 8 personas este sábado. Es para un cumpleaños 🎉' },
          { a: `¡Hola! Qué gusto saludarle 💛 Con mucho gusto le ayudo.\nEl sábado ${fecha} abrimos de 12:00 a 22:00. ¿A qué hora les queda bien?` },
          { c: 'Como a las 8 de la noche' },
          { a: `Perfecto: mesa para 8 el sábado ${fecha} a las 20:00 ✅\n¿A nombre de quién la dejo?` },
          { c: 'Camila Restrepo. Es el cumpleaños de mi mamá, cumple 60 🥳' },
          { a: '¡Qué bonito! Feliz cumpleaños para su mamá 🎂\n¿Quieren que les tengamos algo especial en la mesa?', botones: ['🎂 Torta', '🎈 Decoración', '✨ Las dos'] },
          { toca: 2 },
          { a: '¡Perfecto! La torta de la casa es la *tres leches* 😋 ¿Se la preparamos para las 8 personas?\nY de decoración ponemos globos amarillos, azules y rojos, o algo más sencillo si prefieren.' },
          { c: 'Sí, tres leches para todos. Y globos sí, pero algo sencillo 😅' },
          { c: 'Ah, y vamos con un bebé, ¿tienen silla alta?' },
          { a: `Claro que sí, le dejamos una silla alta lista. Quedó todo anotado:\n\n📅 *Sábado ${fecha}, 20:00*\n👥 8 personas + bebé (silla alta)\n🎂 Cumpleaños de la mamá, 60 años\n🍰 Torta tres leches para 8\n🎈 Globos en la mesa, algo sencillo\n👤 A nombre de Camila Restrepo`, aviso: true },
          { a: `${CONFIG.encargada}, la encargada, le escribe hoy mismo para confirmarle el precio de la torta. ¿Le ayudo con algo más?`, seguido: true },
          { c: 'No, eso era todo. ¡Mil gracias! 🙏' },
          { a: '¡Con mucho gusto, Camila! Los esperamos el sábado para celebrar 🇨🇴' },
        ],
        ficha: { cuando: `${cap(DIAS.es[6])} ${sab.getUTCDate()} ${mes(sab, 'es').slice(0, 3)}. · 20:00` },
        aviso: { titulo: 'Nueva reserva 🎂', texto: `Sáb. ${sab.getUTCDate()} ${mes(sab, 'es').slice(0, 3)}., 20:00 · 8 personas · Camila Restrepo. Cumpleaños con torta y globos.` },
      }
    }
    const d = diaDelMenu(n)
    const dia = cuando(d.dias, d.dow, 'fr')
    const precio = CONFIG.precioMenu.fr
    const menu = `🥟 *Entrée* : 2 empanadas, sauce ají maison\n🍲 *Plat au choix* : bandeja paisa (riz, haricots rouges, viande, chicharrón, œuf, plantain, avocat) ou sancocho (soupe de poule, maïs, manioc)\n🥤 *Boisson* : un jus naturel (lulo, mûre ou passion)`
    const intro = d.dias === 0
      ? `Bonjour et bienvenue chez ${CONFIG.nombre} ☀️\nAujourd’hui, le menu du jour est à *${precio}* :`
      : `Bonjour et bienvenue chez ${CONFIG.nombre} ☀️\nPour aujourd’hui c’est fermé, mais ${dia} le menu du jour est à *${precio}* :`
    return {
      lang: 'fr',
      pasos: [
        { c: 'Bonjour ! C’est quoi le menu du jour aujourd’hui ? Et c’est combien ?' },
        { a: `${intro}\n\n${menu}` },
        { c: 'Top ! Vous fermez à quelle heure ?' },
        { a: `${cap(dia)}, on est ouverts de ${hora(d.horario[0], 'fr')} à ${hora(d.horario[1], 'fr')}. Si vous venez à plusieurs, je peux vous garder une table 😊` },
        { c: 'Parfait, merci !' },
        { a: d.dias === 0 ? 'Avec plaisir, à tout à l’heure ! 🌴' : `Avec plaisir, à ${dia} ! 🌴` },
      ],
    }
  }

  const CHAT_TXT = {
    es: { sub: 'Cuenta de empresa', escribiendo: 'escribiendo…', hoy: 'Hoy', ph: 'Mensaje', reabrir: `Ver lo que le llega a ${CONFIG.encargada}`, nota: `El asistente de ${CONFIG.nombre} responde al instante, a cualquier hora. ${CONFIG.encargada} revisa cada reserva.` },
    fr: { sub: 'Compte professionnel', escribiendo: 'écrit…', hoy: 'Aujourd’hui', ph: 'Message', reabrir: 'Ver el resumen', nota: `L’assistant de ${CONFIG.nombre} répond tout de suite, à toute heure.` },
  }

  function hoja(tipo, g) {
    if (tipo === 'reserva') return `
      <div class="sheet-grip"></div>
      <p class="eyebrow">Así le llega a ${CONFIG.encargada}</p>
      <h2>Todo anotado, sin que ${CONFIG.encargada} tenga que contestar.</h2>
      <div class="ticket">
        <div class="ticket-head"><strong>Nueva reserva</strong><span>Por WhatsApp</span></div>
        <dl>
          <div><dt>Cuándo</dt><dd>${g.ficha.cuando}</dd></div>
          <div><dt>Mesa</dt><dd>8 personas + silla alta</dd></div>
          <div><dt>Nombre</dt><dd>Camila Restrepo</dd></div>
          <div><dt>Motivo</dt><dd>Cumpleaños de la mamá (60)</dd></div>
          <div><dt>Torta</dt><dd>Tres leches para 8</dd></div>
          <div><dt>Decoración</dt><dd>Globos, algo sencillo</dd></div>
        </dl>
        <div class="todo">${I.bell}<span>Pendiente: confirmarle a Camila el precio de la torta.</span></div>
      </div>
      <div class="sheet-actions">
        <button type="button" class="btn btn-blue" data-act="cerrar">Ver la conversación</button>
        <div class="row"><button type="button" class="btn btn-ghost" data-act="repetir">Repetir</button><a class="btn btn-ghost" href="#menu-fr">Chat en francés</a></div>
        <a class="btn btn-ghost" href="#">Volver a la web</a>
      </div>`
    return `
      <div class="sheet-grip"></div>
      <p class="eyebrow">Chat en francés</p>
      <h2>Contestó en francés, con el menú y el horario del día.</h2>
      <p>El asistente usa la misma información que la web: cuando ${CONFIG.encargada} cambia el menú del día, cambia también lo que contesta.</p>
      <div class="sheet-actions">
        <button type="button" class="btn btn-blue" data-act="cerrar">Ver la conversación</button>
        <div class="row"><button type="button" class="btn btn-ghost" data-act="repetir">Repetir</button><a class="btn btn-ghost" href="#reserva">Chat reserva</a></div>
        <a class="btn btn-ghost" href="#">Volver a la web</a>
      </div>`
  }

  let corrida = 0
  let saltar = null
  /** Espera cancelable: tocar el chat la termina antes. */
  const esperar = (ms) => new Promise((res) => {
    const fin = () => { clearTimeout(t); if (saltar === fin) saltar = null; res() }
    const t = setTimeout(fin, ms)
    saltar = fin
  })
  const formato = (texto) => esc(texto).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')

  function abrirChat(tipo) {
    const id = ++corrida
    const g = guion(tipo), tx = CHAT_TXT[g.lang]
    const chat = $('#chat')
    chat.classList.remove('done', 'fin')
    chat.innerHTML = `${demoNav(tipo)}
      <header class="wa-head">
        <a class="wa-icon" href="#" aria-label="Volver a la web">${I.back}</a>
        <div class="wa-avatar">${marca.replace('class="brand-mark"', 'width="40" height="40"').replace(/id="mk"/, 'id="mk2"').replace('url(#mk)', 'url(#mk2)')}</div>
        <div class="wa-who"><strong>${CONFIG.nombre}</strong><span id="wa-sub">${tx.sub}</span></div>
        <span class="wa-icon" aria-hidden="true">${I.video}</span>
        <span class="wa-icon" aria-hidden="true">${I.phone}</span>
        <button type="button" class="wa-icon" data-act="repetir" aria-label="Repetir la conversación" title="Repetir">${I.replay}</button>
      </header>
      <div class="wa-body" id="wa-body" aria-live="polite">
        <div class="wa-day">${tx.hoy}</div>
        <div class="wa-note">${tx.nota}</div>
      </div>
      <div class="wa-input" aria-hidden="true">
        <div class="wa-field">${I.smile}<div class="wa-text" id="wa-text" data-ph="${tx.ph}"></div>${I.clip}${I.camera}</div>
        <div class="wa-send" id="wa-send">${I.mic}${I.send}</div>
      </div>
      <p class="hint" id="hint">Toque la conversación para adelantar</p>
      <button type="button" class="reopen" data-act="abrir">${tx.reabrir}</button>
      ${g.aviso ? `<div class="push" id="push" aria-hidden="true">
        <span class="push-who">En el celular de ${CONFIG.encargada}</span>
        <div class="push-card">${marca.replace('class="brand-mark"', 'class="push-ico"').replace(/id="mk"/, 'id="mk3"').replace('url(#mk)', 'url(#mk3)')}
          <div><p class="push-top"><b>${CONFIG.nombre.toUpperCase()} · RESERVAS</b><span>ahora</span></p><strong>${g.aviso.titulo}</strong><p>${esc(g.aviso.texto)}</p></div>
        </div>
      </div>` : ''}
      <div class="sheet-veil" data-act="cerrar"></div>
      <div class="sheet" role="dialog" aria-label="Resumen">${hoja(tipo, g)}</div>`

    const body = $('#wa-body'), campo = $('#wa-text'), boton = $('#wa-send'), sub = $('#wa-sub')
    const pista = $('#hint')
    const quitarPista = () => pista.classList.add('off')
    setTimeout(quitarPista, 6000)
    body.addEventListener('click', () => { quitarPista(); if (saltar) saltar() })
    chat.querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => {
      const act = el.dataset.act
      if (act === 'repetir') abrirChat(tipo)
      else {
        chat.classList.toggle('done', act === 'abrir')
        bajar()
      }
    }))

    const n = ahora()
    let enviados = 0, ultimo = null
    const horaMsg = () => {
      const m = n.min + Math.floor(enviados / 3)
      return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    }
    const bajar = () => { body.scrollTop = body.scrollHeight }
    function agregar(dir, texto, botones) {
      const el = document.createElement('div')
      el.className = `msg ${dir}${ultimo !== dir ? ' first' : ''}`
      const burbuja = `<div class="bubble">${formato(texto)}<span class="meta">${horaMsg()}${dir === 'out' ? I.checks : ''}</span></div>`
      el.innerHTML = botones
        ? `<div class="stack">${burbuja}<div class="qr">${botones.map((b) => `<span>${esc(b)}</span>`).join('')}</div></div>`
        : burbuja
      body.appendChild(el)
      ultimo = dir
      enviados++
      bajar()
      return el
    }
    // Aviso en el celular de Ana: baja desde arriba y se va solo (no lo corta el "adelantar").
    function avisar() {
      const push = $('#push')
      if (!push) return
      push.classList.add('show')
      setTimeout(() => push.classList.remove('show'), 4200)
    }
    async function tipear(texto) {
      const total = Math.min(1600, 300 + texto.length * 28), inicio = performance.now()
      let raf
      boton.classList.add('has-text')
      const paso = (t) => {
        const k = Math.min(texto.length, Math.ceil(texto.length * (t - inicio) / total))
        campo.textContent = texto.slice(0, k)
        if (k < texto.length) raf = requestAnimationFrame(paso)
      }
      raf = requestAnimationFrame(paso)
      await esperar(total)
      cancelAnimationFrame(raf)
      campo.textContent = texto
      await esperar(250)
      campo.textContent = ''
      boton.classList.remove('has-text')
    }

    ;(async () => {
      await esperar(700)
      let conBotones = null
      for (const p of g.pasos) {
        if (id !== corrida) return
        if (p.toca !== undefined) {
          // El cliente toca uno de los botones del último mensaje.
          await esperar(900)
          if (id !== corrida) return
          const qr = conBotones.querySelector('.qr'), b = qr.children[p.toca]
          b.classList.add('pressed')
          await esperar(450)
          if (id !== corrida) return
          qr.classList.add('used')
          agregar('out', b.textContent)
          await esperar(350)
        } else if (p.c) {
          await tipear(p.c)
          if (id !== corrida) return
          agregar('out', p.c)
          await esperar(350)
        } else {
          await esperar(p.seguido ? 300 : 650)
          if (id !== corrida) return
          body.querySelectorAll('.out .meta').forEach((m) => m.classList.add('read'))
          sub.textContent = tx.escribiendo
          sub.classList.add('typing')
          const dots = document.createElement('div')
          dots.className = `msg in${ultimo !== 'in' ? ' first' : ''}`
          dots.innerHTML = '<div class="bubble"><div class="dots"><i></i><i></i><i></i></div></div>'
          body.appendChild(dots)
          bajar()
          await esperar(Math.max(1000, Math.min(2400, 700 + p.a.length * 8)))
          dots.remove()
          if (id !== corrida) return
          sub.textContent = tx.sub
          sub.classList.remove('typing')
          const el = agregar('in', p.a, p.botones)
          if (p.botones) conBotones = el
          if (p.aviso) avisar()
          await esperar(700)
        }
      }
      if (id !== corrida) return
      await esperar(1400)
      if (id === corrida) chat.classList.add('done', 'fin')
    })()
  }

  /* ---------- Rutas ---------- */
  let vista = null
  let scrollWeb = [0, 0]
  function ruta() {
    const h = location.hash.slice(1)
    const nueva = h === 'reserva' || h === 'menu-fr' ? h : 'web'
    const web = $('#web'), chat = $('#chat')
    if (nueva === 'web') {
      corrida++
      chat.hidden = true
      chat.innerHTML = ''
      web.hidden = false
      if (vista && vista !== 'web') { window.scrollTo(0, scrollWeb[0]); web.scrollTop = scrollWeb[1] }
      if (h === '' && location.href.endsWith('#')) history.replaceState(null, '', location.pathname + location.search)
    } else {
      if (vista === 'web') scrollWeb = [window.scrollY, web.scrollTop]
      web.hidden = true
      chat.hidden = false
      window.scrollTo(0, 0)
      abrirChat(nueva)
    }
    vista = nueva
  }

  /* ---------- En compu grande: explicación y QR para abrirla en el celular ---------- */
  function renderLado() {
    const lado = $('#side')
    if (!lado || !matchMedia('(min-width:1000px)').matches) return
    const url = location.origin + location.pathname
    lado.innerHTML = `
      <div class="brand">${marca.replace(/id="mk"/, 'id="mk4"').replace('url(#mk)', 'url(#mk4)')}<span class="brand-name">${CONFIG.nombre}</span></div>
      <h1>Su web, y un WhatsApp que <em>contesta solo</em>.</h1>
      <p>Demo para ${CONFIG.encargada}: la web en español y francés, y el asistente que contesta y anota las reservas por WhatsApp.</p>
      <ol>
        <li><a href="#"><div>La web<span>Menú del día, horarios y botón de WhatsApp</span></div></a></li>
        <li><a href="#reserva"><div>Reserva por WhatsApp<span>Mesa para 8, cumpleaños con torta</span></div></a></li>
        <li><a href="#menu-fr"><div>Cliente en francés<span>Pregunta el menú y el precio</span></div></a></li>
      </ol>
      <div class="qr-box" id="qr-box" hidden><div id="qr"></div><div><strong>Véala en su celular</strong><p>Apunte la cámara al código.</p></div></div>`
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
    s.onload = () => {
      try {
        const qr = qrcode(0, 'M')
        qr.addData(url)
        qr.make()
        $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })
        $('#qr-box').hidden = false
      } catch (e) {}
    }
    document.head.appendChild(s)
  }

  renderWeb()
  renderLado()
  window.addEventListener('hashchange', ruta)
  ruta()
})()
