/*
 * INCA fusion latina · demo.
 * - Estado «Ouvert / Fermé» con la hora de París (11:45 a 00:30, todos los días).
 * - Las conversaciones de WhatsApp (#reserver, #emporter, #traiteur) se reproducen solas.
 *   Tocar la conversación salta la espera; los botones de respuesta rápida se pueden tocar.
 *   Al final, la hoja «Lo que recibe el restaurante» (en castellano, para el dueño). En el catering
 *   el dueño escribe su precio y lo manda: el chat sigue con el presupuesto y el sí del cliente.
 * - ?hora=20:15 simula esa hora de París (estado, saludo, hora de retiro).
 */
(() => {
  'use strict'

  const $ = (sel) => document.querySelector(sel)
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const OPEN = 11 * 60 + 45 // 11h45
  const CLOSE = 30 // 0h30

  /* ——— Hora de París ——— */

  /** La fecha y hora de París como un Date en UTC (se lee con getUTC*). */
  function parisNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]))
    const d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute))
    const fake = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(location.search).get('hora') || '')
    if (fake) d.setUTCHours(+fake[1], +fake[2])
    return d
  }
  const minutes = (d) => d.getUTCHours() * 60 + d.getUTCMinutes()
  const addDays = (d, n) => new Date(d.getTime() + n * 864e5)
  const hFr = (m) => `${Math.floor(m / 60) % 24}h${String(m % 60).padStart(2, '0')}`
  const hEs = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const jourFr = (d) => `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
  const diaEs = (d) => `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const isOpen = (m) => m >= OPEN || m < CLOSE
  const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n)

  /* ——— Estado en la cabecera ——— */

  function paintStatus() {
    const el = $('#status')
    const open = isOpen(minutes(parisNow()))
    el.classList.toggle('closed', !open)
    el.lastElementChild.textContent = open ? 'Ouvert · jusqu’à 0h30' : 'Fermé · ouvre à 11h45'
  }
  paintStatus()
  setInterval(paintStatus, 60e3)
  // En el celular se desplaza la página; en la compu, la pantalla del teléfono dibujado.
  const scroller = $('.scroller')
  const onScroll = () => $('#top').classList.toggle('scrolled', Math.max(scrollY, scroller.scrollTop) > 8)
  addEventListener('scroll', onScroll, { passive: true })
  scroller.addEventListener('scroll', onScroll, { passive: true })

  /* ——— Datos de cada conversación ——— */

  function context() {
    const now = parisNow()
    const m = minutes(now)
    const dow = now.getUTCDay()
    const evening = m >= 18 * 60 || m < CLOSE
    const v = {
      salut: evening ? 'Bonsoir' : 'Bonjour',
      bonne: evening ? 'Bonne soirée' : 'Bonne journée',
    }

    // El viernes que viene (si hoy es viernes, el de la semana próxima).
    const friday = addDays(now, ((5 - dow + 7) % 7) || 7)
    v.vendrediDit = dow === 5 ? 'vendredi prochain' : dow >= 1 && dow <= 4 ? 'ce vendredi' : 'vendredi'
    v.vendrediFr = jourFr(friday)
    v.viernesEs = diaEs(friday)

    // Catering: el primer jueves a 10 días o más.
    let jeudi = addDays(now, 10)
    while (jeudi.getUTCDay() !== 4) jeudi = addDays(jeudi, 1)
    v.traiteurFr = jourFr(jeudi)
    v.traiteurEs = diaEs(jeudi)

    // Para llevar: lista en 20 min (redondeado a 5) si llega antes del cierre; si no, a las 12h00.
    const ready = Math.ceil((m + 20) / 5) * 5
    if (m >= OPEN || m + 20 <= CLOSE) {
      v.pret = `Elle sera prête dans 20 minutes, vers ${hFr(ready)}.`
      v.retraitFr = hFr(ready)
      v.retiroEs = hEs(ready)
    } else {
      v.pret = 'Nous ouvrons à 11h45 : elle sera prête à 12h00.'
      v.retraitFr = '12h00'
      v.retiroEs = '12:00'
    }
    v.ppp = 24 // precio por persona del catering; lo cambia el dueño en la demo
    return v
  }

  const NOTICE = 'Vous écrivez à l’assistant d’INCA. L’équipe du restaurant voit toute la conversation.'

  /*
   * Pasos: { me } lo escribe el cliente · { bot, choices?, key? } responde el asistente (con botones
   * de respuesta rápida, lo elegido queda en v[key]) · { later, at } salto en el tiempo: separador
   * con fecha (opcional) y hora fija para los mensajes siguientes · { ask } espera al dueño.
   */
  const SCRIPTS = {
    reserver: {
      steps: [
        { me: (v) => `${v.salut} ! Vous auriez une table pour 4 ${v.vendrediDit} à 20h ?` },
        { bot: (v) => `${v.salut}, et merci de penser à INCA 🙂\nPetite précision : notre salle est petite (une quinzaine de couverts), alors le soir on place les tables par créneaux.` },
        { bot: (v) => `Pour 4 personnes ${v.vendrediFr}, je peux vous proposer :`, choices: ['20h00', '21h30'], key: 'heure' },
        { bot: () => 'Parfait ! À quel nom je note la réservation ?' },
        { me: () => 'Claire Martin' },
        { bot: (v) => `C’est confirmé ✅\n\n*Claire Martin* · 4 personnes\n${cap(v.vendrediFr)} à ${v.heure}\n111 rue Olivier de Serres, Paris 15e\n\nComme la salle est petite, en cas de retard ou de changement, écrivez-moi ici et je libère la table. À vendredi !` },
        { me: () => 'Merci beaucoup, à vendredi !' },
        // El mismo viernes, a media mañana: recordatorio con dos botones.
        { later: (v) => cap(v.vendrediFr), at: () => '11:00' },
        { bot: (v) => `Bonjour Claire 🙂 Petit rappel : ce soir à ${v.heure}, une table pour 4 vous attend chez INCA.\nVous confirmez ?`, choices: ['Je confirme', 'Je dois annuler'], key: 'rappel' },
        { bot: (v) => v.rappel === 'Je confirme' ? 'Merci ! À ce soir 🙂' : 'Pas de souci, j’ai libéré la table. Au plaisir de vous recevoir une autre fois !' },
      ],
      owner: (v) => {
        const late = v.heure === '21h30'
        const ok = v.rappel === 'Je confirme'
        const base = [['19:00', 5], ['20:00', 8], ['21:30', 4], ['22:30', 2]]
        return {
          title: ok ? 'Reserva confirmada sin atender el teléfono' : 'Cancelación avisada: la mesa ya está libre',
          head: 'Claire Martin · 4 personas', badge: ok ? 'Confirmada' : 'Cancelada', wait: !ok,
          rows: [
            ['Día', cap(v.viernesEs)],
            ['Hora', late ? '21:30' : '20:00'],
            ['Recordatorio', `Enviado el viernes 11:00\n${ok ? 'Confirmó ✓' : 'Canceló: mesa liberada'}`],
          ],
          slots: {
            title: `Sala del ${v.viernesEs} · 15 cubiertos`,
            list: base.map(([h, n]) => {
              const mine = ok && h === (late ? '21:30' : '20:00')
              return [h, n + (mine ? 4 : 0), mine]
            }),
          },
          hint: ok
            ? 'El asistente reparte las mesas por turno para no pasarse de 15 cubiertos y recuerda cada reserva el mismo día.'
            : 'Con 15 cubiertos, una mesa vacía se nota: el asistente ya puede ofrecérsela al próximo que escriba.',
        }
      },
    },

    emporter: {
      steps: [
        { me: (v) => `${v.salut} ! Je peux commander à emporter ? Un lomo saltado et un ají de gallina.` },
        { bot: (v) => `${v.salut} ! Bien sûr 🙂\n\n1 × Lomo saltado · 21 €\n1 × Ají de gallina · 17 €\n*Total : 38 €*\n\n${v.pret} À quel nom ?` },
        { me: () => 'Paul' },
        { bot: (v) => `C’est noté, Paul ✅\nVotre commande vous attend à *${v.retraitFr}* au 111 rue Olivier de Serres. Paiement sur place.` },
        { me: () => 'Top, merci !' },
        // Cuando la cocina lo marca listo.
        { later: () => null, at: (v) => v.retiroEs },
        { bot: () => 'Paul, votre commande est prête 🥡\nElle vous attend au comptoir. Bon appétit !' },
      ],
      owner: (v) => ({
        title: 'Pedido para llevar, directo a la cocina',
        head: 'Para llevar · Paul', badge: 'Listo · avisado',
        rows: [
          ['Pedido', '1 lomo saltado\n1 ají de gallina'],
          ['Total', '38 €'],
          ['Retira', v.retiroEs],
          ['Pago', 'En el local'],
        ],
        hint: 'El asistente usa los precios de tu carta y calcula la hora de retiro con tus horarios. Cuando la cocina marca el pedido como listo, al cliente le llega el aviso.',
      }),
    },

    traiteur: {
      steps: [
        { me: (v) => `${v.salut}, vous faites traiteur ? Ce serait pour un déjeuner d’équipe, une vingtaine de personnes.` },
        { bot: (v) => `${v.salut} ! Oui, avec plaisir 🙂 Pour que le chef vous prépare un devis, il me faut trois infos :\n\n1. La date et l’heure\n2. L’adresse de livraison\n3. Le nombre exact de personnes (et s’il y a des végétariens ou des allergies)` },
        { me: (v) => `${cap(v.traiteurFr)} à 12h30, dans nos bureaux au 45 rue Lecourbe. On sera 20, dont 2 végétariens.` },
        { bot: (v) => `Merci, c’est noté :\n\n📅 ${cap(v.traiteurFr)} · 12h30\n📍 45 rue Lecourbe, Paris 15e\n👥 20 personnes, dont 2 végétariens\n\nVous avez des plats en tête ?` },
        { me: () => 'Ceviche et lomo saltado, ce serait parfait.' },
        { bot: () => 'Très bon choix. Je transmets tout au chef : il vous envoie le devis ici même, sur WhatsApp.' },
        // El dueño pone el precio por persona y lo manda.
        { ask: (v) => ({
          title: 'Pedido de catering, listo para presupuestar',
          head: 'Catering · Camille Roche', badge: 'Falta presupuesto', wait: true,
          rows: [
            ['Fecha', `${cap(v.traiteurEs)}, 12:30`],
            ['Lugar', '45 rue Lecourbe, 75015\nEntrega en oficina'],
            ['Personas', '20 (2 vegetarianos)'],
            ['Quiere', 'Ceviche, lomo saltado'],
          ],
          hint: 'Solo falta tu precio. Pruébalo: escríbelo y envíalo, y mira cómo le llega a Camille.',
        }) },
        { bot: (v) => `Voici le devis du chef ✅\n\n*Déjeuner pour 20 personnes*\n${cap(v.traiteurFr)} · 12h30\nCeviche, lomo saltado et causa limeña\nOption végétarienne pour 2 personnes\nLivraison et mise en place incluses\n\n*${eur(v.ppp)} par personne · ${eur(v.ppp * 20)} TTC*\n\nPour valider, répondez simplement ici.`, choices: ['Je valide', 'J’ai une question'], key: 'devis' },
        { bot: (v) => v.devis === 'Je valide'
          ? `Merci Camille ! C’est réservé pour ${v.traiteurFr} à 12h30 ✅\nLe chef vous écrira la veille pour caler l’heure de livraison. ${v.bonne} !`
          : 'Bien sûr, je vous écoute : écrivez votre question ici, le chef vous répond dans la journée.' },
      ],
      owner: (v) => {
        const ok = v.devis === 'Je valide'
        return {
          title: ok ? 'Catering vendido por WhatsApp' : 'Camille tiene una pregunta',
          head: 'Catering · Camille Roche', badge: ok ? 'Aceptado' : 'Pregunta pendiente', wait: !ok,
          rows: [
            ['Fecha', `${cap(v.traiteurEs)}, 12:30`],
            ['Lugar', '45 rue Lecourbe, 75015'],
            ['Personas', '20 (2 vegetarianos)'],
            ['Total', `${eur(v.ppp * 20)}\n${eur(v.ppp)} por persona`],
          ],
          hint: ok
            ? 'Del primer mensaje al sí del cliente, lo único que hiciste fue poner el precio.'
            : 'La pregunta te llega en la misma conversación: respondes tú o el asistente.',
        }
      },
    },
  }

  const OTHERS = { reserver: 'Reserva', emporter: 'Para llevar', traiteur: 'Catering' }

  /* ——— Motor del chat ——— */

  const chat = $('#chat'), log = $('#chat-log'), field = $('#chat-field'), sub = $('#chat-sub'), owner = $('#owner'), page = $('.page')
  let run = 0 // cada reproducción tiene su número; si cambia, la anterior se corta
  let fast = false // tocar la conversación termina el paso en curso al instante
  let wake = null
  let stamp = null // hora fija de los mensajes después de un salto en el tiempo

  const sleep = (ms) => new Promise((resolve) => {
    if (fast) return resolve()
    const done = () => { clearTimeout(t); if (wake === done) wake = null; resolve() }
    const t = setTimeout(done, ms)
    wake = done
  })
  log.addEventListener('click', (e) => {
    if (e.target.closest('.choices')) return
    fast = true
    if (wake) wake()
  })

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const rich = (s) => esc(s).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  const lines = (s) => esc(s).replace(/\n/g, '<br>')
  const clock = () => stamp || hEs(minutes(parisNow()))
  const TICKS = '<svg class="ticks" viewBox="0 0 16 11" aria-label="Lu"><path fill="currentColor" d="M11.07.65a.46.46 0 0 0-.64.07L4.86 7.55 2.45 5.2a.46.46 0 0 0-.64 0 .44.44 0 0 0 0 .63l2.74 2.68c.1.09.22.13.35.13h.03a.46.46 0 0 0 .34-.17l5.88-7.18a.44.44 0 0 0-.08-.64Zm3.9 0a.46.46 0 0 0-.64.07L8.76 7.55l-.6-.59-.62.76.99.97c.09.09.22.13.35.13h.03a.46.46 0 0 0 .34-.17l5.88-7.18a.44.44 0 0 0-.07-.64Z"/></svg>'

  function scrollDown() { log.scrollTop = log.scrollHeight }
  const readAll = () => log.querySelectorAll('.ticks').forEach((t) => t.classList.add('read'))

  function pill(text, cls = '') {
    const el = document.createElement('div')
    el.className = `pill ${cls}`
    el.textContent = text
    log.append(el)
    scrollDown()
  }

  function bubble(side, text) {
    const prev = log.lastElementChild
    const el = document.createElement('div')
    el.className = `msg ${side}`
    if (!prev || !prev.classList.contains(side)) el.classList.add('first')
    el.innerHTML = `${rich(text)}<span class="meta">${clock()}${side === 'out' ? TICKS : ''}</span>`
    log.append(el)
    scrollDown()
    return el
  }

  async function botSays(text, id) {
    readAll()
    await sleep(500)
    if (id !== run) return
    sub.textContent = 'écrit…'
    sub.classList.add('typing')
    const dots = document.createElement('div')
    dots.className = 'typing-bubble'
    dots.innerHTML = '<i></i><i></i><i></i>'
    log.append(dots)
    scrollDown()
    await sleep(Math.min(2600, 900 + text.length * 11))
    dots.remove()
    if (id !== run) return
    sub.textContent = 'en ligne'
    sub.classList.remove('typing')
    bubble('in', text)
  }

  async function clientTypes(text, id) {
    await sleep(900)
    field.classList.add('typing')
    for (let i = 1; i <= text.length; i++) {
      if (id !== run) return
      field.textContent = text.slice(0, i)
      await sleep(26)
    }
    await sleep(250)
    if (id !== run) return
    field.textContent = ''
    field.classList.remove('typing')
    bubble('out', text)
  }

  /** Botones de respuesta rápida: el que toques, o el primero si nadie toca. */
  function pick(options, id) {
    return new Promise((resolve) => {
      const box = document.createElement('div')
      box.className = 'choices live'
      box.innerHTML = options.map((o) => `<button type="button">${esc(o)}</button>`).join('')
      log.append(box)
      scrollDown()
      let chosen = false
      const choose = (btn) => {
        if (chosen) return
        chosen = true
        clearTimeout(auto)
        box.classList.remove('live')
        box.querySelectorAll('button').forEach((b) => { b.disabled = true; b.classList.toggle('picked', b === btn) })
        setTimeout(() => resolve(btn.textContent), 350)
      }
      box.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && id === run) choose(b) })
      const auto = setTimeout(() => { if (id === run) choose(box.querySelector('button')) }, 3800)
    })
  }

  /* ——— Hoja del dueño ——— */

  function ticket(o) {
    const slots = o.slots ? `
      <div class="slots">
        <p>${esc(o.slots.title)}</p>
        ${o.slots.list.map(([h, n, mine]) => `
          <div class="slot${mine ? ' mine' : ''}">
            <span>${h}</span><div class="bar"><i style="width:${Math.round(n / 15 * 100)}%"></i></div><b>${n}/15</b>
          </div>`).join('')}
      </div>` : ''
    return `
      <div class="ticket">
        <header>${esc(o.head)}<span class="${o.wait ? 'wait' : ''}">${esc(o.badge)}</span></header>
        <dl>${o.rows.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${lines(val)}</dd>`).join('')}</dl>
        ${slots}
      </div>`
  }

  function sheet(html) {
    owner.innerHTML = `
      <button class="grip" type="button" data-toggle aria-label="Plegar o desplegar"></button>
      <p class="eyebrow">Lo que recibe el restaurante</p>
      ${html}`
    owner.classList.remove('min')
    owner.hidden = false
    owner.scrollTop = 0
  }

  function showOwner(key, v) {
    const o = SCRIPTS[key].owner(v)
    const others = Object.keys(OTHERS).filter((k) => k !== key)
    sheet(`
      <h3>${esc(o.title)}</h3>
      ${ticket(o)}
      <p class="hint">${esc(o.hint)}</p>
      <div class="actions">
        <button class="btn btn-alt" type="button" data-replay>Volver a ver</button>
        <button class="btn btn-main" type="button" data-close>Volver al sitio</button>
      </div>
      <p class="hint">Otras conversaciones: ${others.map((k) => `<a href="#${k}">${OTHERS[k]}</a>`).join(' · ')}</p>`)
  }

  /** El dueño escribe el precio por persona y lo envía. Devuelve el precio. */
  function ownerQuote(o, v, id) {
    return new Promise((resolve) => {
      sheet(`
        <h3>${esc(o.title)}</h3>
        ${ticket(o)}
        <p class="hint">${esc(o.hint)}</p>
        <form class="quote" novalidate>
          <label for="ppp">Precio por persona</label>
          <div class="quote-row">
            <div class="price-input"><input id="ppp" name="ppp" inputmode="decimal" autocomplete="off" value="${String(v.ppp).replace('.', ',')}"><span>€</span></div>
            <button class="btn btn-main" type="submit">Enviar</button>
          </div>
          <p class="total">Total para 20 personas: <strong id="quote-total">${eur(v.ppp * 20)}</strong></p>
        </form>`)
      const form = owner.querySelector('.quote'), input = form.ppp, total = form.querySelector('#quote-total'), send = form.querySelector('button')
      const price = () => {
        const n = Math.round(parseFloat(input.value.replace(',', '.').replace(/[^\d.]/g, '')) * 2) / 2
        return n >= 5 && n <= 300 ? n : null
      }
      input.addEventListener('input', () => {
        const n = price()
        total.textContent = n ? eur(n * 20) : '—'
        send.disabled = !n
      })
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        const n = price()
        if (!n || id !== run) return
        input.blur()
        owner.hidden = true
        resolve(n)
      })
    })
  }

  owner.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (link) { // otra conversación: reemplaza esta en el historial, así «volver» va al sitio
      e.preventDefault()
      history.replaceState(null, '', link.getAttribute('href'))
      route()
    } else if (e.target.closest('[data-replay]')) play(chat.dataset.key)
    else if (e.target.closest('[data-close]')) closeChat()
    else if (e.target.closest('[data-toggle], .eyebrow, h3')) owner.classList.toggle('min')
  })

  async function play(key) {
    const id = ++run
    const v = context()
    chat.dataset.key = key
    log.innerHTML = ''
    field.textContent = ''
    field.classList.remove('typing')
    owner.hidden = true
    stamp = null
    sub.textContent = 'Compte professionnel'
    sub.classList.remove('typing')
    pill('Aujourd’hui')
    pill(NOTICE, 'notice')
    await sleep(400)
    for (const step of SCRIPTS[key].steps) {
      fast = false
      if (id !== run) return
      if (step.me) await clientTypes(step.me(v), id)
      if (step.later) {
        await sleep(900)
        if (id !== run) return
        readAll()
        const label = step.later(v)
        if (label) pill(label)
        stamp = step.at(v)
        await sleep(500)
      }
      if (step.ask) {
        await sleep(700)
        if (id !== run) return
        readAll()
        v.ppp = await ownerQuote(step.ask(v), v, id)
      }
      if (step.bot) await botSays(step.bot(v), id)
      if (id !== run) return
      if (step.choices) {
        await sleep(300)
        if (id !== run) return
        v[step.key] = await pick(step.choices, id)
        if (id !== run) return
        bubble('out', v[step.key])
      }
    }
    fast = false
    await sleep(700)
    if (id !== run) return
    readAll()
    await sleep(700)
    if (id === run) showOwner(key, v)
  }

  /* ——— Abrir y cerrar (#reserver, #emporter, #traiteur) ——— */

  let fromPage = false // si el chat se abrió desde la página, «volver» es ir atrás en el historial

  function openChat(key) {
    chat.hidden = false
    page.inert = true
    document.body.style.overflow = 'hidden'
    play(key)
  }
  function closeChat() {
    if (fromPage) history.back()
    else { history.replaceState(null, '', location.pathname + location.search); route() }
  }
  function route() {
    const key = location.hash.slice(1)
    document.querySelectorAll('.guide a').forEach((a) => a.classList.toggle('on', a.hash === `#${key}`))
    if (SCRIPTS[key]) return openChat(key)
    run++
    chat.hidden = true
    page.inert = false
    document.body.style.overflow = ''
  }
  $('#chat-back').addEventListener('click', closeChat)
  // Guía (compu): con un chat abierto, cambiar de conversación no suma pasos al historial.
  $('.guide').addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a || chat.hidden) return
    e.preventDefault()
    history.replaceState(null, '', a.hash)
    route()
  })
  addEventListener('hashchange', () => { fromPage = true; route() })
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chat.hidden) closeChat() })
  route()
})()
