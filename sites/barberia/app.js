/*
 * App de turnos (demo). Sin framework: cada cambio vuelve a pintar la vista con plantillas de texto
 * y los clics se resuelven por delegación con `data-a="acción"`.
 */
(function () {
  const { pad, key, parse, addDays, hm, dow, weekStart } = DB.util
  const $app = document.getElementById('app')
  const $modal = document.getElementById('modal-root')
  const $toasts = document.getElementById('toasts')
  const $tip = document.getElementById('tip')

  let S = DB.load()
  let ses = null
  try { ses = JSON.parse(localStorage.getItem('barberia:sesion')) } catch (e) {}
  // Enlace directo para mostrar la demo: ?como=dueno o ?como=facu
  const sinTilde = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const params = new URLSearchParams(location.search)
  // ?barberia=T%20y%20E muestra la demo con el nombre del cliente
  if (params.get('barberia')) { S.config.nombre = params.get('barberia').slice(0, 40); DB.save(S) }
  const como = sinTilde(params.get('como') || '')
  if (como) {
    const b = S.barberos.find((x) => x.activo && sinTilde(x.nombre) === como)
    if (como === 'dueno') ses = { rol: 'dueno' }
    else if (b) ses = { rol: 'barbero', bid: b.id }
    try { localStorage.setItem('barberia:sesion', JSON.stringify(ses)) } catch (e) {}
  }
  const hoy0 = DB.now().day
  const ui = {
    view: new URLSearchParams(location.search).get('ver'), // ?ver=reportes abre esa vista

    agenda: { modo: innerWidth >= 960 ? 'semana' : 'dia', fecha: hoy0, filtro: 'todos' },
    rep: { modo: new URLSearchParams(location.search).get('rango') === 'mes' ? 'mes' : 'semana', semana: weekStart(hoy0) },
    act: { filtro: 'todos', n: 50 },
    dia: { fecha: hoy0 },
  }
  let modal = null

  // ——— Utilidades ———
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`
  const money = (n) => '$' + Math.round(n).toLocaleString('es-AR')
  const moneyK = (n) => n >= 1e6 ? '$' + (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + ' mil' : money(n)
  const fmt = (k, o) => parse(k).toLocaleDateString('es-AR', o)
  const fLargo = (k) => fmt(k, { weekday: 'long', day: 'numeric', month: 'long' })
  const fCorto = (k) => `${fmt(k, { weekday: 'short' }).replace('.', '')} ${parse(k).getDate()}/${parse(k).getMonth() + 1}`
  const fDM = (k) => `${pad(parse(k).getDate())}/${pad(parse(k).getMonth() + 1)}`
  const fTs = (ts) => { const [k, h] = ts.split(' '); return `${fDM(k)} ${h}` }
  const absMin = (k, min) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / 60000 + min }
  const tsAbs = (ts) => { const [k, h] = ts.split(' '); const [hh, mm] = h.split(':').map(Number); return absMin(k, hh * 60 + mm) }
  const iniciales = (n) => n.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const corto = (n) => { if (!n) return 'Sin nombre'; const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] }
  const plural = (n, s, p) => `${n} ${n === 1 ? s : p || s + 's'}`

  const B = (id) => S.barberos.find((b) => b.id === id) || { nombre: '—', color: '#777' }
  const SV = (id) => S.servicios.find((s) => s.id === id) || { nombre: '—', precio: 0, dur: 30 }
  const activos = () => S.barberos.filter((b) => b.activo)
  const total = (t) => t.precio + t.extras.reduce((s, e) => s + e.p, 0)
  const av = (b, cls = '') => `<span class="av ${cls}" style="--c:${b.color}">${esc(iniciales(b.nombre))}</span>`
  const abierto = (k) => S.config.dias.includes(dow(k))

  let NOW = DB.now()
  const isPast = (t) => t.fecha < NOW.day || (t.fecha === NOW.day && t.hora + t.dur <= NOW.min)
  const enCurso = (t) => t.fecha === NOW.day && t.hora <= NOW.min && NOW.min < t.hora + t.dur
  const vis = (t) => t.estado !== 'pendiente' ? t.estado : isPast(t) ? 'sincargar' : enCurso(t) ? 'encurso' : 'pendiente'
  const LBL = { pendiente: 'Pendiente', atendido: 'Atendido', novino: 'No vino', cancelado: 'Cancelado', sincargar: 'Sin cargar', encurso: 'En curso' }
  const ICO = { pendiente: 'clock', atendido: 'circle-check', novino: 'user-x', cancelado: 'ban', sincargar: 'triangle-alert', encurso: 'scissors' }
  const pill = (st) => `<span class="pill st-${st}">${ic(ICO[st])}${LBL[st]}</span>`

  const delDia = (k, bid) => S.turnos.filter((t) => t.fecha === k && (!bid || t.barberoId === bid)).sort((a, b) => a.hora - b.hora)
  const sinCargar = (bid) => S.turnos.filter((t) => t.estado === 'pendiente' && isPast(t) && (!bid || t.barberoId === bid)).sort((a, b) => (a.fecha + pad(a.hora)).localeCompare(b.fecha + pad(b.hora)))
  const enRango = (from, to, bid) => S.turnos.filter((t) => t.fecha >= from && t.fecha <= to && (!bid || t.barberoId === bid))
  const atendidos = (ts) => ts.filter((t) => t.estado === 'atendido')
  const sum = (ts) => ts.reduce((s, t) => s + total(t), 0)
  const clientes = () => { const m = new Map(); for (const t of S.turnos) if (t.cliente && !m.has(t.cliente)) m.set(t.cliente, t.tel); return m }
  const waLink = (tel, text) => `https://wa.me/549${String(tel).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`

  const actor = () => (ses.rol === 'dueno' ? 'dueno' : ses.bid)
  const save = () => DB.save(S)
  function log(t, tipo, detalle) {
    const e = { id: 'a' + (++S.aid), ts: DB.stamp(), actor: actor(), tipo, turnoId: t.id, cliente: t.cliente, servicio: SV(t.hechoId || t.servicioId).nombre, total: total(t), detalle: detalle || '' }
    S.actividad.unshift(e)
    return e
  }

  // ——— Toasts y tooltip ———
  let undoFn = null
  function toast(msg, undo, icon = 'circle-check') {
    undoFn = undo || null
    const el = document.createElement('div')
    el.className = 'toast'
    el.innerHTML = `${ic(icon)}<span>${msg}</span>${undo ? '<button data-a="undo">Deshacer</button>' : ''}`
    $toasts.replaceChildren(el)
    clearTimeout(toast.t)
    toast.t = setTimeout(() => { el.remove(); undoFn = null }, 5000)
  }
  function tipAt(el, x, y) {
    $tip.textContent = el.dataset.tip
    $tip.classList.add('on')
    const r = $tip.getBoundingClientRect()
    $tip.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x + 14)) + 'px'
    $tip.style.top = Math.max(8, y - r.height - 12) + 'px'
  }
  document.addEventListener('pointermove', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) tipAt(el, e.clientX, e.clientY); else $tip.classList.remove('on') })
  document.addEventListener('scroll', () => $tip.classList.remove('on'), { passive: true })

  // ——— Cambios de estado ———
  function snapshot(t) { return JSON.parse(JSON.stringify(t)) }
  function marcar(t, estado) {
    const antes = snapshot(t)
    t.estado = estado
    if (estado === 'atendido' && !t.hechoId) { t.hechoId = t.servicioId; t.precio = SV(t.servicioId).precio }
    if (estado === 'pendiente') { t.cargadoEn = null; t.cargadoPor = null } else { t.cargadoEn = DB.stamp(); t.cargadoPor = actor() }
    const e = log(t, estado)
    save()
    const msg = { atendido: `${esc(corto(t.cliente))} · atendido`, novino: `${esc(corto(t.cliente))} · no vino`, cancelado: 'Turno cancelado', pendiente: 'Volvió a pendiente' }[estado]
    toast(msg, () => { Object.assign(t, antes); S.actividad = S.actividad.filter((x) => x !== e); save(); render() }, estado === 'novino' ? 'user-x' : estado === 'cancelado' ? 'ban' : 'circle-check')
  }

  // ═══════════ Vistas ═══════════
  function render() {
    NOW = DB.now()
    if (NOW.day !== S.dia) { S = DB.load(); ui.dia.fecha = ui.agenda.fecha = NOW.day; ui.rep.semana = weekStart(NOW.day) }
    if (!ses || (ses.rol === 'barbero' && !S.barberos.some((b) => b.id === ses.bid && b.activo))) { ses = null; $app.innerHTML = vLogin(); return }
    const views = ses.rol === 'dueno' ? OWNER : BARBER
    if (!views.some((v) => v.id === ui.view)) ui.view = views[0].id
    const keepX = [...document.querySelectorAll('.cal-scroll')].map((el) => el.scrollLeft)
    const body = { hoy: vHoy, agenda: vAgenda, reportes: vReportes, actividad: vActividad, config: vConfig, dia: vMiDia, resumen: vResumen }[ui.view]()
    $app.innerHTML = shell(views, body)
    document.querySelectorAll('.cal-scroll').forEach((el, i) => { if (keepX[i] != null) el.scrollLeft = keepX[i] })
    if (S.renovado) { S.renovado = false; save(); toast('Datos de demo renovados para hoy', null, 'sparkles') }
  }

  const OWNER = [
    { id: 'hoy', icon: 'house', label: 'Hoy' },
    { id: 'agenda', icon: 'calendar-days', label: 'Agenda' },
    { id: 'reportes', icon: 'chart-column', label: 'Reportes' },
    { id: 'actividad', icon: 'history', label: 'Actividad' },
    { id: 'config', icon: 'settings', label: 'Ajustes', long: 'Configuración' },
  ]
  const BARBER = [
    { id: 'dia', icon: 'scissors', label: 'Mi día' },
    { id: 'resumen', icon: 'wallet', label: 'Mi resumen' },
  ]

  function shell(views, body) {
    const pend = ses.rol === 'dueno' ? sinCargar().length : sinCargar(ses.bid).length
    const badgeOn = ses.rol === 'dueno' ? 'hoy' : 'dia'
    const me = ses.rol === 'dueno' ? `<span class="av av-owner">${ic('crown', 'ic-sm')}</span>` : av(B(ses.bid))
    const logo = `<div class="logo"><span class="logo-mark">${ic('scissors')}</span><div><b>${esc(S.config.nombre)}</b><small>${ses.rol === 'dueno' ? 'Panel del dueño' : 'Barbero · ' + esc(B(ses.bid).nombre)}</small></div></div>`
    return `<div class="shell">
      <nav class="sidenav">${logo}
        ${views.map((v) => `<button class="nav ${ui.view === v.id ? 'on' : ''}" data-a="nav" data-v="${v.id}">${ic(v.icon)}${v.long || v.label}${v.id === badgeOn && pend ? `<span class="badge">${pend}</span>` : ''}</button>`).join('')}
        <div class="foot">Demo · datos de ejemplo</div>
      </nav>
      <div>
        <header class="topbar">${logo}
          <span class="clock"><i class="dot"></i><span class="num">${hm(NOW.min)}</span> hora AR</span>
          <button class="me" data-a="cuenta" aria-label="Cuenta">${me}</button>
        </header>
        <main class="view">${ses.rol === 'barbero' && ses.desdeDueno ? `<div class="banner">${ic('eye')}<span class="grow">Estás viendo la app de <b>${esc(B(ses.bid).nombre)}</b>, tal como la usa en el celular.</span><button class="btn btn-sm" data-a="volverDueno">${ic('crown', 'ic-sm')}Volver al panel</button></div>` : ''}${body}</main>
      </div>
      <nav class="bottomnav">${views.map((v) => `<button class="${ui.view === v.id ? 'on' : ''}" data-a="nav" data-v="${v.id}">${ic(v.icon, 'ic-lg')}${v.label}${v.id === badgeOn && pend ? `<span class="badge">${pend}</span>` : ''}</button>`).join('')}</nav>
    </div>`
  }

  // ——— Login ———
  function vLogin() {
    return `<div class="login"><div class="login-card">
      <div class="brand-mark">${ic('scissors')}</div>
      <h1>${esc(S.config.nombre)}</h1>
      <p class="sub">Turnos, control y facturación desde el celular</p>
      <h2>Entrá como</h2>
      <button class="role role-owner" data-a="login" data-rol="dueno"><span class="crown">${ic('crown')}</span><div><strong>Dueño</strong><span>Ve toda la barbería, reportes y actividad</span></div><span class="go">${ic('chevron-right')}</span></button>
      <h2>Barberos</h2>
      ${activos().map((b) => `<button class="role" data-a="login" data-rol="barbero" data-b="${b.id}">${av(b, 'av-lg')}<div><strong>${esc(b.nombre)}</strong><span>${delDia(NOW.day, b.id).filter((t) => t.estado !== 'cancelado').length} turnos hoy · carga lo que atiende</span></div><span class="go">${ic('chevron-right')}</span></button>`).join('')}
      <p class="demo-note">Demo sin contraseña. Los cambios quedan guardados en este dispositivo.</p>
    </div></div>`
  }

  // ——— Hoy (dueño) ———
  // Pensada para una barbería donde la mayoría entra sin reserva: lo que importa es que cada
  // cliente quede cargado. Un barbero que no carga nada hace rato es la señal de control.
  const QUIETO = 75 // minutos sin cargar nada con la barbería abierta
  const minDe = (ts) => { const [, h] = ts.split(' '); const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm }
  const haceTxt = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + pad(m % 60) : ''}`)

  function vHoy() {
    const k = NOW.day
    const ts = delDia(k).filter((t) => t.estado !== 'cancelado')
    const at = atendidos(ts)
    const walk = at.filter((t) => t.sinReserva).sort((a, b) => b.hora - a.hora)
    const res = at.filter((t) => !t.sinReserva)
    const sc = ts.filter((t) => vis(t) === 'sincargar')
    const fact = sum(at)
    const viejos = sinCargar()
    const abiertoAhora = abierto(k) && NOW.min >= S.config.abre && NOW.min < S.config.cierra

    // Por barbero: cuánto cargó y hace cuánto que no carga nada
    const filas = activos().map((b) => {
      const mine = ts.filter((t) => t.barberoId === b.id)
      const cargas = mine.filter((t) => t.cargadoEn && t.cargadoEn.startsWith(k) && t.cargadoPor === b.id).map((t) => t.cargadoEn).sort()
      const ultimo = cargas.length ? cargas[cargas.length - 1] : null
      const desde = NOW.min - (ultimo ? minDe(ultimo) : S.config.abre)
      return {
        b, mine, ultimo, desde,
        quieto: abiertoAhora && desde >= QUIETO,
        wk: walk.filter((t) => t.barberoId === b.id),
        rs: mine.filter((t) => !t.sinReserva),
        ahora: mine.find((t) => enCurso(t) && t.estado !== 'novino'),
        prox: mine.find((t) => t.estado === 'pendiente' && t.hora > NOW.min),
      }
    })
    const quietos = filas.filter((f) => f.quieto)

    // El que no carga va primero: en el celular es lo primero que se ve
    const cards = [...filas].sort((a, b) => b.quieto - a.quieto).map((f) => {
      const { b } = f
      const nAt = f.mine.filter((t) => t.estado === 'atendido')
      const estado = f.quieto ? `<span class="pill st-sincargar">${ic('triangle-alert')}Sin cargar hace ${haceTxt(f.desde)}</span>` : f.ahora ? pill('encurso') : abiertoAhora ? `<span class="pill st-pendiente">${ic('clock')}Libre</span>` : `<span class="pill st-cancelado">${ic('store')}Cerrado</span>`
      return `<article class="card live-card ${f.quieto ? 'is-quieto' : ''}" data-a="verAgenda" data-b="${b.id}">
        <div class="live-top">${av(b, 'av-lg')}<div style="min-width:0"><div class="name">${esc(b.nombre)}</div><div class="sub">${f.ultimo ? `Última carga ${f.ultimo.slice(11)} · ${f.desde < 1 ? 'recién' : 'hace ' + haceTxt(f.desde)}` : 'Todavía no cargó nada hoy'}</div></div>${estado}</div>
        <div class="mini3">
          <div><span>Sin reserva</span><b class="num">${f.wk.length}</b></div>
          <div><span>Con turno</span><b class="num">${f.rs.filter((t) => t.estado === 'atendido').length}<small>/${f.rs.length}</small></b></div>
          <div><span>Facturó</span><b class="num">${moneyK(sum(nAt))}</b></div>
        </div>
        ${f.quieto ? `<div class="live-now warnbox">${ic('triangle-alert', 'ic-sm')}<div class="c"><b>Puede estar atendiendo sin cargar</b><small>La barbería está abierta y no registró ningún cliente en ${haceTxt(f.desde)}.</small></div></div>` : f.ahora ? `<div class="live-now"><span class="t">${hm(f.ahora.hora)}</span><div class="c"><span class="k">Atendiendo ahora</span><b>${esc(corto(f.ahora.cliente))}</b><small>${esc(SV(f.ahora.hechoId || f.ahora.servicioId).nombre)}${f.ahora.sinReserva ? ' · sin reserva' : ''}</small></div></div>` : ''}
        ${f.prox ? `<div class="live-foot"><span>Próxima reserva <b>${hm(f.prox.hora)}</b> · ${esc(corto(f.prox.cliente))}</span></div>` : ''}
      </article>`
    }).join('')

    // Clientes sin reserva por hora: hoy contra el promedio del mismo día las 3 semanas anteriores
    const horas = []
    for (let h = S.config.abre / 60; h < S.config.cierra / 60; h++) horas.push(h)
    const prevs = [7, 14, 21].map((n) => addDays(k, -n)).filter((d) => delDia(d).length)
    const cnt = (d, h) => delDia(d).filter((t) => t.sinReserva && t.estado === 'atendido' && Math.floor(t.hora / 60) === h).length
    const hoyH = horas.map((h) => cnt(k, h))
    const promH = horas.map((h) => (prevs.length ? prevs.reduce((acc, d) => acc + cnt(d, h), 0) / prevs.length : 0))
    const maxH = Math.max(1, ...hoyH, ...promH)
    const pico = horas[promH.indexOf(Math.max(...promH))]
    const diaNombre = fmt(k, { weekday: 'long' })
    const porHora = `<div class="hours">${horas.map((h, i) => {
      const futuro = k === NOW.day && h * 60 > NOW.min
      return `<div class="hcol" data-tip="${esc(`${h}:00 a ${h + 1}:00\nHoy: ${futuro ? '—' : hoyH[i]} sin reserva\nPromedio de los ${diaNombre}: ${promH[i].toFixed(1).replace('.', ',')}`)}">
        <div class="hbars2"><i class="avg" style="height:${(promH[i] / maxH) * 100}%"></i>${futuro ? '' : `<i class="now" style="height:${Math.max(hoyH[i] ? 4 : 0, (hoyH[i] / maxH) * 100)}%"></i>`}</div>
        <span class="${h === pico ? 'pico' : ''}">${h}</span></div>`
    }).join('')}</div>
      <div class="hours-legend"><span><i class="now"></i>Hoy</span><span><i class="avg"></i>Promedio de los ${diaNombre}</span>${prevs.length ? `<span class="muted">Hora pico: ${pico} a ${pico + 1} hs</span>` : ''}</div>`

    const feed = walk.length
      ? `<div class="card">${walk.slice(0, 8).map((t) => { const b = B(t.barberoId); return `<button class="row" data-a="ver" data-id="${t.id}"><span class="num" style="font-weight:600;min-width:44px">${hm(t.hora)}</span>${av(b, 'av-sm')}<div class="grow"><b>${esc(t.cliente || 'Sin nombre')}</b><small>${esc(b.nombre)} · ${esc(SV(t.hechoId).nombre)}${t.extras.length ? ' + ' + t.extras.map((e) => esc(e.n)).join(', ') : ''}</small></div><b class="num">${money(total(t))}</b></button>` }).join('')}
        ${walk.length > 8 ? `<button class="row" data-a="verActividad" style="justify-content:center;color:var(--accent);font-weight:600">Ver los ${walk.length}${ic('arrow-right', 'ic-sm')}</button>` : ''}</div>`
      : `<div class="card empty">${ic('door-open')}<div>Todavía no entró nadie sin reserva hoy</div></div>`

    const porB = activos().map((b) => ({ b, ts: viejos.filter((t) => t.barberoId === b.id) })).filter((x) => x.ts.length).sort((a, b) => b.ts.length - a.ts.length)
    const alertaReservas = viejos.length
      ? `<section class="alert" style="margin-top:0">
          <div class="alert-head"><span class="alert-icon">${ic('calendar-days')}</span><div><h3>${plural(viejos.length, 'reserva pasada', 'reservas pasadas')} sin cargar</h3><p>Clientes con turno: ya pasó la hora y el barbero no marcó si vino o no.</p></div></div>
          <div class="alert-rows">${porB.map(({ b, ts }) => `<button class="alert-row" data-a="sincargar" data-b="${b.id}">${av(b)}<div class="who"><b>${esc(b.nombre)}</b><small>${ts[0].fecha === k ? 'De hoy' : 'La más vieja: ' + fCorto(ts[0].fecha)} · ${money(sum(ts))} sin confirmar</small></div><span class="count num">${ts.length}</span>${ic('chevron-right', 'faint')}</button>`).join('')}</div>
        </section>`
      : `<section class="alert ok" style="margin-top:0"><div class="alert-head"><span class="alert-icon">${ic('circle-check')}</span><div><h3>Reservas al día</h3><p>Todos los turnos reservados que ya pasaron tienen estado.</p></div></div></section>`

    // Semana en curso contra la anterior hasta la misma hora
    const ws = weekStart(k), wsPrev = addDays(ws, -7)
    const mismoDia = addDays(k, -7)
    const sem = atendidos(enRango(ws, k)), prev = atendidos(enRango(wsPrev, mismoDia)).filter((t) => t.fecha < mismoDia || t.hora + t.dur <= NOW.min)
    const d = prev.length ? (sum(sem) - sum(prev)) / sum(prev) : 0
    const semWalk = sem.filter((t) => t.sinReserva)

    return `<div class="page-head"><div><h1>Hoy</h1><p>${fLargo(k)}</p></div><button class="btn btn-gold" data-a="nuevo">${ic('plus')}Nuevo turno</button></div>
      <div class="kpis">
        <div class="kpi money"><div class="lbl">${ic('banknote')}Facturado hoy</div><div class="val num">${money(fact)}</div><div class="hint">Sin reserva ${money(sum(walk))} · Con turno ${money(sum(res))}</div></div>
        <div class="kpi accent"><div class="lbl">${ic('door-open')}Sin reserva</div><div class="val num">${walk.length}</div><div class="hint">${at.length ? Math.round((walk.length / at.length) * 100) : 0}% de los clientes</div></div>
        <div class="kpi"><div class="lbl" style="color:var(--ok)">${ic('circle-check')}Clientes atendidos</div><div class="val num">${at.length}</div><div class="hint">${res.length} con turno</div></div>
        <div class="kpi"><div class="lbl">${ic('receipt')}Ticket promedio</div><div class="val num">${money(at.length ? fact / at.length : 0)}</div><div class="hint">Por cliente</div></div>
        <div class="kpi ${quietos.length ? 'warn' : ''}"><div class="lbl" style="color:var(--warn)">${ic('triangle-alert')}Sin cargar hace rato</div><div class="val num">${quietos.length}</div><div class="hint">${quietos.length ? quietos.map((f) => esc(f.b.nombre)).join(', ') : 'Todos cargando'}</div></div>
      </div>
      <h2 class="sec">${ic('users', 'ic-sm')}Por barbero<span class="right muted">${hm(NOW.min)} · hora de Argentina</span></h2>
      <div class="live">${cards}</div>
      <div class="grid-2" style="margin-top:4px">
        <div><h2 class="sec">${ic('door-open', 'ic-sm')}Entraron sin reserva hoy<span class="right muted">${plural(walk.length, 'cliente')}</span></h2>${feed}</div>
        <div><h2 class="sec">${ic('clock', 'ic-sm')}Por hora</h2><div class="card chart-card">${porHora}</div></div>
      </div>
      <h2 class="sec">${ic('calendar-days', 'ic-sm')}Reservas</h2>
      ${alertaReservas}
      <h2 class="sec">${ic('eye', 'ic-sm')}La app de los barberos</h2>
      <div class="card pad"><p class="muted" style="margin:0 0 12px;font-size:14px">Mirá lo que ve cada barbero en su celular: el botón para cargar a cada cliente que entra, sus reservas y su resumen.</p>
        <div class="verComo">${activos().map((b) => `<button class="role" data-a="verComo" data-b="${b.id}">${av(b)}<div><strong>${esc(b.nombre)}</strong><span>${plural(walk.filter((t) => t.barberoId === b.id).length, 'cliente')} sin reserva hoy</span></div><span class="go">${ic('chevron-right')}</span></button>`).join('')}</div>
      </div>
      <h2 class="sec">${ic('trending-up', 'ic-sm')}Esta semana<span class="right"><button class="btn btn-ghost btn-sm" data-a="nav" data-v="reportes">Ver reportes${ic('arrow-right', 'ic-sm')}</button></span></h2>
      <div class="week-strip">
        <div class="kpi"><div class="lbl">Facturado</div><div class="val num">${moneyK(sum(sem))}</div><div class="hint">${prev.length ? `<span class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))}%</span> vs. sem. pasada` : '&nbsp;'}</div></div>
        <div class="kpi"><div class="lbl">Sin reserva</div><div class="val num">${semWalk.length}</div><div class="hint">${sem.length ? Math.round((semWalk.length / sem.length) * 100) : 0}% · ${moneyK(sum(semWalk))}</div></div>
        <div class="kpi"><div class="lbl">Clientes</div><div class="val num">${sem.length}</div><div class="hint">Ticket ${money(sem.length ? sum(sem) / sem.length : 0)}</div></div>
      </div>`
  }

  // ——— Agenda ———
  function vAgenda() {
    const a = ui.agenda
    const bs = activos().filter((b) => a.filtro === 'todos' || a.filtro === b.id)
    const ws = weekStart(a.fecha)
    const dias = a.modo === 'dia' ? [a.fecha] : [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(ws, i)).filter((k) => abierto(k) || delDia(k).length)
    const label = a.modo === 'dia' ? fLargo(a.fecha) : `${fDM(dias[0] || ws)} al ${fDM(dias[dias.length - 1] || addDays(ws, 6))}`
    const head = `<div class="page-head"><div><h1>Agenda</h1><p class="hide-m">Tocá un horario libre para agendar, o un turno para ver el detalle.</p></div><button class="btn btn-gold" data-a="nuevo">${ic('plus')}Nuevo turno</button></div>
      <div class="toolbar">
        <div class="seg"><button class="${a.modo === 'dia' ? 'on' : ''}" data-a="agModo" data-m="dia">Día</button><button class="${a.modo === 'semana' ? 'on' : ''}" data-a="agModo" data-m="semana">Semana</button></div>
        <div class="datenav"><button class="icon-btn" data-a="agMover" data-d="-1" aria-label="Anterior">${ic('chevron-left')}</button><span class="lbl">${label}</span><button class="icon-btn" data-a="agMover" data-d="1" aria-label="Siguiente">${ic('chevron-right')}</button></div>
        ${(a.modo === 'dia' ? a.fecha !== NOW.day : ws !== weekStart(NOW.day)) ? '<button class="btn btn-sm" data-a="agHoy">Hoy</button>' : ''}
      </div>
      <div class="chips" style="margin-bottom:10px"><button class="chip plain ${a.filtro === 'todos' ? 'on' : ''}" data-a="agFiltro" data-b="todos">${ic('users', 'ic-sm')}Todos</button>${activos().map((b) => `<button class="chip ${a.filtro === b.id ? 'on' : ''}" data-a="agFiltro" data-b="${b.id}">${av(b, 'av-sm')}${esc(b.nombre)}</button>`).join('')}</div>
      <div class="legend">${['pendiente', 'encurso', 'atendido', 'novino', 'sincargar', 'cancelado'].map((s) => `<span><i class="st-${s}" style="background:currentColor;opacity:.85"></i>${LBL[s]}</span>`).join('')}</div>`

    if (a.modo === 'dia' && !abierto(a.fecha) && !delDia(a.fecha).length) return head + `<div class="card closed"><div>${ic('store', 'ic-lg')}<p><b>Cerrado</b><br>La barbería abre de martes a sábado, de ${hm(S.config.abre)} a ${hm(S.config.cierra)}.</p><button class="btn" data-a="agMover" data-d="1">Ir al día siguiente${ic('chevron-right', 'ic-sm')}</button></div></div>`

    const semana = a.modo === 'semana'
    const px = semana ? 1.05 : 1.5
    const H = (S.config.cierra - S.config.abre) * px
    const lane = semana ? (bs.length === 1 ? 'minmax(130px,1fr)' : 'minmax(46px,1fr)') : 'minmax(128px,1fr)'
    const cols = ['52px']
    let hdr = `<div class="cal-hcell gutter"></div>`
    let sub = ''
    let body = `<div class="cal-times" style="height:${H}px">${hours().map((h) => `<div style="top:${(h - S.config.abre) * px}px">${h === S.config.abre || h === S.config.cierra ? '' : hm(h)}</div>`).join('')}</div>`
    for (const k of dias) {
      const n = delDia(k).filter((t) => t.estado !== 'cancelado' && bs.some((b) => b.id === t.barberoId)).length
      if (semana) hdr += `<div class="cal-hcell day ${k === NOW.day ? 'today' : ''}" style="grid-column:span ${bs.length}" data-a="agDia" data-f="${k}"><span style="text-transform:capitalize">${fCorto(k)}</span><small>${plural(n, 'turno')}</small></div>`
      bs.forEach((b, i) => {
        cols.push(lane)
        if (!semana) hdr += `<div class="cal-hcell">${av(b, 'av-sm')}<div>${esc(b.nombre)}<small>${plural(delDia(k, b.id).filter((t) => t.estado !== 'cancelado').length, 'turno')}</small></div></div>`
        else if (bs.length > 1) sub += `<div class="cal-hcell" style="padding:6px 0;justify-content:center;${i ? 'border-left-style:dashed' : ''}" title="${esc(b.nombre)}">${av(b, 'av-xs')}</div>`
        body += `<div class="cal-col ${semana && i ? 'lane' : ''} ${semana && !i ? 'first' : ''} ${k < NOW.day ? 'past' : ''}" style="height:${H}px;--hour:${60 * px}px" data-a="slot" data-b="${b.id}" data-f="${k}" data-px="${px}">
          ${delDia(k, b.id).map((t) => evento(t, px, semana && bs.length > 1)).join('')}
          ${k === NOW.day && NOW.min >= S.config.abre && NOW.min <= S.config.cierra ? `<div class="nowline" style="top:${(NOW.min - S.config.abre) * px}px"></div>` : ''}
        </div>`
      })
    }
    if (sub) sub = `<div class="cal-hcell gutter" style="padding:6px 0"></div>` + sub
    return head + `<div class="cal"><div class="cal-scroll"><div class="cal-grid" style="grid-template-columns:${cols.join(' ')}">${hdr}${sub}${body}</div></div></div>`
  }
  const hours = () => { const r = []; for (let h = S.config.abre; h <= S.config.cierra; h += 60) r.push(h); return r }

  function evento(t, px, angosto) {
    const st = vis(t)
    const h = t.dur * px - 2
    const b = B(t.barberoId)
    const serv = SV(t.hechoId || t.servicioId).nombre
    const tip = `${hm(t.hora)}–${hm(t.hora + t.dur)} · ${t.cliente || 'Sin nombre'}\n${serv} · ${money(total(t))}\n${b.nombre} · ${LBL[st]}`
    const inner = angosto
      ? `<span class="t">${hm(t.hora)}</span>${h > 34 ? `<span>${esc(corto(t.cliente).split(' ')[0])}</span>` : ''}`
      : h < 34 ? `<b><span class="t" style="display:inline">${hm(t.hora)}</span> ${esc(corto(t.cliente))}</b>` : `<span class="t">${hm(t.hora)}</span><b>${esc(t.cliente || 'Sin nombre')}</b>${h > 52 ? `<span>${esc(serv)}</span>` : ''}`
    return `<button class="ev e-${st === 'encurso' ? 'pendiente' : st} ${angosto ? 'tiny' : ''}" style="top:${(t.hora - S.config.abre) * px + 1}px;height:${h}px;--bc:${b.color}${st === 'encurso' ? ';box-shadow:0 0 0 2px var(--accent)' : ''}" data-a="ver" data-id="${t.id}" data-tip="${esc(tip)}">${['atendido', 'novino', 'sincargar'].includes(st) ? ic(ICO[st], 'mark') : ''}${inner}</button>`
  }

  // ——— Reportes ———
  function rango() {
    const r = ui.rep
    if (r.modo === 'mes') { const primero = S.turnos.reduce((m, t) => (t.fecha < m ? t.fecha : m), NOW.day); const d = addDays(NOW.day, -29); return { from: d > primero ? d : primero, to: NOW.day, label: 'Últimos 30 días' } }
    const to = addDays(r.semana, 6)
    return { from: r.semana, to: to > NOW.day ? NOW.day : to, label: r.semana === weekStart(NOW.day) ? 'Esta semana' : `Semana del ${fDM(addDays(r.semana, 1))} al ${fDM(addDays(r.semana, 5))}` }
  }
  function statsDe(ts) {
    const at = atendidos(ts), nv = ts.filter((t) => t.estado === 'novino')
    const cuenta = {}
    for (const t of at) cuenta[t.hechoId] = (cuenta[t.hechoId] || 0) + 1
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]
    const sr = at.filter((t) => t.sinReserva)
    return { sr: sr.length, srFact: sum(sr), at: at.length, fact: sum(at), ticket: at.length ? sum(at) / at.length : 0, ns: at.length + nv.length ? nv.length / (at.length + nv.length) : 0, nv: nv.length, top: top ? SV(top[0]).nombre : '—', cuenta }
  }
  function vReportes() {
    const r = ui.rep
    const { from, to, label } = rango()
    const all = enRango(from, to)
    const tot = statsDe(all)
    const minWeek = weekStart(S.turnos.reduce((m, t) => (t.fecha < m ? t.fecha : m), NOW.day))
    const filas = activos().map((b) => ({ b, ...statsDe(all.filter((t) => t.barberoId === b.id)) })).sort((a, b) => b.fact - a.fact)
    const maxF = Math.max(1, ...filas.map((f) => f.fact))
    const medal = ['p1', '', '', '']

    // Torta de servicios: orden fijo del catálogo, color por servicio
    const servs = S.servicios.filter((s) => tot.cuenta[s.id])
    const nServ = servs.reduce((s, x) => s + tot.cuenta[x.id], 0)
    const C = 2 * Math.PI * 54
    let acc = 0
    const arcs = servs.map((s) => {
      const i = S.servicios.indexOf(s)
      const n = tot.cuenta[s.id], len = (n / nServ) * C
      const out = `<circle r="54" cx="80" cy="80" fill="none" stroke="var(--s${(i % 6) + 1})" stroke-width="24" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 80 80)" data-tip="${esc(`${s.nombre}\n${n} servicios · ${Math.round((n / nServ) * 100)}%`)}" style="cursor:pointer"/>`
      acc += len
      return out
    }).join('')

    return `<div class="page-head"><div><h1>Reportes</h1><p>${r.modo === 'mes' ? `${fDM(from)} al ${fDM(to)}` : 'Turnos atendidos y facturación por barbero'}</p></div></div>
      <div class="toolbar">
        <div class="seg"><button class="${r.modo === 'semana' ? 'on' : ''}" data-a="repModo" data-m="semana">Semana</button><button class="${r.modo === 'mes' ? 'on' : ''}" data-a="repModo" data-m="mes">Mes</button></div>
        ${r.modo === 'semana' ? `<div class="datenav"><button class="icon-btn" data-a="repMover" data-d="-7" ${r.semana <= minWeek ? 'disabled style="opacity:.35"' : ''} aria-label="Semana anterior">${ic('chevron-left')}</button><span class="lbl">${label}</span><button class="icon-btn" data-a="repMover" data-d="7" ${r.semana >= weekStart(NOW.day) ? 'disabled style="opacity:.35"' : ''} aria-label="Semana siguiente">${ic('chevron-right')}</button></div>` : ''}
      </div>
      <div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <div class="kpi money" style="grid-column:auto"><div class="lbl">${ic('banknote')}Facturación</div><div class="val num">${money(tot.fact)}</div></div>
        <div class="kpi"><div class="lbl">${ic('circle-check')}Atendidos</div><div class="val num">${tot.at}</div></div>
        <div class="kpi accent"><div class="lbl">${ic('door-open')}Sin reserva</div><div class="val num">${tot.sr}</div><div class="hint">${tot.at ? Math.round((tot.sr / tot.at) * 100) : 0}% · ${money(tot.srFact)}</div></div>
        <div class="kpi"><div class="lbl">${ic('receipt')}Ticket promedio</div><div class="val num">${money(tot.ticket)}</div></div>
        <div class="kpi"><div class="lbl">${ic('user-x')}No-show</div><div class="val num">${Math.round(tot.ns * 100)}%</div><div class="hint">${plural(tot.nv, 'cliente')} ${tot.nv === 1 ? 'no vino' : 'no vinieron'}</div></div>
      </div>
      <h2 class="sec">${ic('trophy', 'ic-sm')}Ranking de barberos</h2>
      <div class="card rank">${filas.map((f, i) => `<div class="rank-item"><span class="rank-pos ${medal[i] || ''}">${i === 0 ? ic('crown') : i + 1}</span>${av(f.b, 'av-lg')}<div class="rank-main"><div class="top"><b>${esc(f.b.nombre)}</b><span class="money">${money(f.fact)}</span></div><div class="stats"><span>Atendidos <b>${f.at}</b></span><span>Sin reserva <b>${f.sr}</b></span><span>Ticket <b>${money(f.ticket)}</b></span><span>No-show <b>${Math.round(f.ns * 100)}%</b></span><span>Más hecho <b>${esc(f.top)}</b></span></div></div></div>`).join('')}</div>
      <div class="grid-2" style="margin-top:12px">
        <div class="card chart-card"><h3>Facturación por barbero</h3><p class="cap">Solo turnos atendidos</p>
          <div class="hbars">${filas.map((f) => `<div class="hbar"><span class="n"><i style="background:${f.b.color}"></i>${esc(f.b.nombre)}</span><div class="track"><div class="fill" style="width:${(f.fact / maxF) * 100}%;background:${f.b.color}" data-tip="${esc(`${f.b.nombre}\n${money(f.fact)} · ${f.at} atendidos`)}"></div></div><span class="v">${money(f.fact)}</span></div>`).join('')}</div>
        </div>
        <div class="card chart-card"><h3>Servicios</h3><p class="cap">${plural(nServ, 'servicio hecho', 'servicios hechos')}</p>
          ${nServ ? `<div class="donut-wrap"><svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Servicios hechos">${arcs}<text x="80" y="76" text-anchor="middle" style="font:600 22px var(--font);fill:var(--ink)">${nServ}</text><text x="80" y="96" text-anchor="middle" style="font:12px var(--font);fill:var(--muted)">servicios</text></svg>
          <div class="donut-legend">${servs.map((s) => { const i = S.servicios.indexOf(s); const n = tot.cuenta[s.id]; return `<div><i style="background:var(--s${(i % 6) + 1})"></i><span>${esc(s.nombre)}</span><b>${n}</b><em>${Math.round((n / nServ) * 100)}%</em></div>` }).join('')}</div></div>` : '<div class="empty">Sin servicios en este rango</div>'}
        </div>
      </div>
      <div class="card chart-card" style="margin-top:12px"><h3>Facturación diaria</h3><p class="cap">Total de turnos atendidos por día</p>${linea(from, to)}</div>
      <h2 class="sec">${ic('clipboard-list', 'ic-sm')}Detalle</h2>
      <div class="card" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px">
        <thead><tr style="color:var(--muted);text-align:left">${['Barbero', 'Atendidos', 'Sin reserva', 'Facturación', 'Ticket', 'No vino', 'No-show', 'Más hecho'].map((h, i) => `<th style="padding:12px 14px;font-weight:600;${i ? 'text-align:right' : ''}">${h}</th>`).join('')}</tr></thead>
        <tbody>${filas.map((f) => `<tr style="border-top:1px solid var(--line)"><td style="padding:10px 14px"><span style="display:flex;align-items:center;gap:8px">${av(f.b, 'av-sm')}${esc(f.b.nombre)}</span></td><td class="num" style="text-align:right;padding:10px 14px">${f.at}</td><td class="num" style="text-align:right;padding:10px 14px">${f.sr}</td><td class="num" style="text-align:right;padding:10px 14px;font-weight:600">${money(f.fact)}</td><td class="num" style="text-align:right;padding:10px 14px">${money(f.ticket)}</td><td class="num" style="text-align:right;padding:10px 14px">${f.nv}</td><td class="num" style="text-align:right;padding:10px 14px">${Math.round(f.ns * 100)}%</td><td style="text-align:right;padding:10px 14px">${esc(f.top)}</td></tr>`).join('')}</tbody>
      </table></div>`
  }

  function linea(from, to) {
    const dias = []
    for (let k = from; k <= to; k = addDays(k, 1)) if (abierto(k) || delDia(k).length) dias.push(k)
    if (!dias.length) return '<div class="empty">Sin datos</div>'
    const vals = dias.map((k) => sum(atendidos(delDia(k))))
    // Ancho real del contenedor: el texto del eje se ve igual en el celular y en la compu
    const W = Math.round(Math.max(300, Math.min(1376, (innerWidth >= 960 ? innerWidth - 236 - 64 : innerWidth - 32) - 34))), H = 220, L = 46, R = 10, T = 12, Bt = 28
    const max = niceMax(Math.max(...vals, 1))
    const x = (i) => L + (dias.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (dias.length - 1))
    const y = (v) => T + (1 - v / max) * (H - T - Bt)
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    const step = Math.ceil(dias.length / Math.max(3, Math.floor(W / 80)))
    const colW = (W - L - R) / Math.max(1, dias.length - 1)
    return `<svg class="line-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Facturación diaria">
      <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${[0, 0.25, 0.5, 0.75, 1].map((f) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text class="axis" x="${L - 8}" y="${y(max * f) + 4}" text-anchor="end">${moneyK(max * f).replace(' mil', 'k')}</text>`).join('')}
      <path d="M${pts[0]} L${pts.join(' L')} L${x(dias.length - 1)},${y(0)} L${x(0)},${y(0)} Z" fill="url(#lg)"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dias.map((k, i) => (i % step === 0 || i === dias.length - 1) && !(i !== dias.length - 1 && dias.length - 1 - i < step) ? `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${fCorto(k)}</text>` : '').join('')}
      ${dias.map((k, i) => `<g class="col"><line class="cross" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${y(0)}"/><circle class="pt" cx="${x(i)}" cy="${y(vals[i])}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/><rect class="hz" x="${x(i) - colW / 2}" y="${T}" width="${colW}" height="${H - T - Bt}" data-tip="${esc(`${fLargo(k)}\n${money(vals[i])} · ${atendidos(delDia(k)).length} atendidos`)}"/></g>`).join('')}
    </svg>`
  }
  const niceMax = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v) }

  // ——— Actividad ———
  const TXT = {
    atendido: (e) => `marcó como atendido a <b>${esc(corto(e.cliente))}</b>`,
    novino: (e) => `marcó que <b>${esc(corto(e.cliente))}</b> no vino`,
    cancelado: (e) => `canceló el turno de <b>${esc(corto(e.cliente))}</b>`,
    sinreserva: (e) => e.cliente ? `cargó a <b>${esc(corto(e.cliente))}</b> sin reserva` : 'cargó un cliente <b>sin reserva</b>',
    ajuste: (e) => `ajustó el turno de <b>${esc(corto(e.cliente))}</b>`,
    creado: (e) => `agendó a <b>${esc(corto(e.cliente))}</b>`,
    editado: (e) => `modificó el turno de <b>${esc(corto(e.cliente))}</b>`,
    pendiente: (e) => `volvió a pendiente el turno de <b>${esc(corto(e.cliente))}</b>`,
  }
  const FEEDIC = { atendido: ['circle-check', 'ok'], sinreserva: ['door-open', 'ok'], novino: ['user-x', 'bad'], cancelado: ['ban', 'off'], ajuste: ['pencil', 'pend'], creado: ['calendar-plus', 'pend'], editado: ['pencil', 'pend'], pendiente: ['undo-2', 'off'] }
  function vActividad() {
    const f = ui.act.filtro
    const lista = S.actividad.filter((e) => f === 'todos' || e.actor === f)
    const items = lista.slice(0, ui.act.n)
    const porTurno = new Map(S.turnos.map((t) => [t.id, t]))
    let html = '', dia = ''
    for (const e of items) {
      const k = e.ts.slice(0, 10)
      if (k !== dia) { if (dia) html += '</div>'; dia = k; html += `<div class="feed-day">${k === NOW.day ? 'Hoy' : k === addDays(NOW.day, -1) ? 'Ayer' : fLargo(k)}</div><div class="card">` }
      const who = e.actor === 'dueno' ? { nombre: 'Dueño' } : B(e.actor)
      const [icn, c] = FEEDIC[e.tipo] || ['info', 'pend']
      const t = porTurno.get(e.turnoId)
      const tarde = t && ['atendido', 'novino'].includes(e.tipo) ? tsAbs(e.ts) - absMin(t.fecha, t.hora + t.dur) : 0
      html += `<div class="feed-item" data-a="ver" data-id="${e.turnoId}">
        ${e.actor === 'dueno' ? `<span class="av av-sm av-owner">${ic('crown', 'ic-sm')}</span>` : av(who, 'av-sm')}
        <div class="txt"><b>${esc(who.nombre)}</b> ${TXT[e.tipo] ? TXT[e.tipo](e) : esc(e.tipo)}<small><span class="feed-icon st-${c === 'ok' ? 'atendido' : c === 'bad' ? 'novino' : c === 'off' ? 'cancelado' : 'pendiente'}" style="display:inline-grid;width:18px;height:18px;border-radius:5px;vertical-align:-4px;margin-right:6px">${ic(icn, 'ic-sm')}</span>${esc(e.servicio)}${e.tipo !== 'novino' && e.tipo !== 'cancelado' ? ' · ' + money(e.total) : ''}${e.detalle ? ' · ' + esc(e.detalle) : ''}${t ? ` · turno ${t.fecha === k ? '' : fCorto(t.fecha) + ' '}${hm(t.hora)}` : ''}</small></div>
        <div class="when">${e.ts.slice(11)}${tarde > 90 ? `<span class="late">${tarde >= 1440 ? Math.round(tarde / 1440) + ' d' : Math.round(tarde / 60) + ' h'} tarde</span>` : ''}</div>
      </div>`
    }
    if (dia) html += '</div>'
    return `<div class="page-head"><div><h1>Actividad</h1><p>Todo lo que cargó cada barbero, con la hora en que lo hizo.</p></div></div>
      <div class="chips" style="margin-bottom:6px"><button class="chip plain ${f === 'todos' ? 'on' : ''}" data-a="actFiltro" data-b="todos">Todos</button>${S.barberos.map((b) => `<button class="chip ${f === b.id ? 'on' : ''}" data-a="actFiltro" data-b="${b.id}">${av(b, 'av-sm')}${esc(b.nombre)}</button>`).join('')}<button class="chip ${f === 'dueno' ? 'on' : ''}" data-a="actFiltro" data-b="dueno"><span class="av av-sm av-owner">${ic('crown', 'ic-sm')}</span>Dueño</button></div>
      ${html || `<div class="card empty">${ic('history')}<div>Todavía no hay actividad</div></div>`}
      ${lista.length > ui.act.n ? `<div style="text-align:center;margin-top:16px"><button class="btn" data-a="actMas">Ver más (${lista.length - ui.act.n})</button></div>` : ''}`
  }

  // ——— Configuración ———
  function vConfig() {
    const tema = document.documentElement.dataset.theme
    return `<div class="page-head"><div><h1>Configuración</h1><p>Barbería, equipo y precios</p></div></div>
      <h2 class="sec">${ic('store', 'ic-sm')}Barbería</h2>
      <div class="card pad">
        <div class="field" style="margin:0"><label for="cfg-nombre">Nombre de la barbería</label><div style="display:flex;gap:8px"><input class="input" id="cfg-nombre" value="${esc(S.config.nombre)}" maxlength="40"><button class="btn btn-gold" style="height:46px" data-a="cfgNombre">Guardar</button></div></div>
        <p class="muted" style="font-size:13px;margin:12px 0 0">Horario: martes a sábado, de ${hm(S.config.abre)} a ${hm(S.config.cierra)} hs (hora de Argentina).</p>
      </div>
      <h2 class="sec">${ic('users', 'ic-sm')}Barberos<span class="right"><button class="btn btn-sm" data-a="barberoForm">${ic('plus', 'ic-sm')}Agregar</button></span></h2>
      <div class="card">${S.barberos.map((b) => `<div class="cfg-row ${b.activo ? '' : 'inactive'}">${av(b)}<div class="grow"><b>${esc(b.nombre)}</b><small>${b.tel ? esc(b.tel) + ' · ' : ''}${b.activo ? 'Activo' : 'Inactivo: no aparece en la agenda'}</small></div><button class="icon-btn" data-a="barberoForm" data-b="${b.id}" aria-label="Editar">${ic('pencil', 'ic-sm')}</button><button class="switch ${b.activo ? 'on' : ''}" data-a="barberoToggle" data-b="${b.id}" aria-label="Activo"></button></div>`).join('')}</div>
      <h2 class="sec">${ic('scissors', 'ic-sm')}Servicios y precios<span class="right"><button class="btn btn-sm" data-a="servForm">${ic('plus', 'ic-sm')}Agregar</button></span></h2>
      <div class="card">${S.servicios.map((s) => `<div class="cfg-row ${s.activo ? '' : 'inactive'}"><div class="grow"><b>${esc(s.nombre)}</b><small>${s.dur} min${s.activo ? '' : ' · No se ofrece'}</small></div><b class="num" style="font-size:16px">${money(s.precio)}</b><button class="icon-btn" data-a="servForm" data-s="${s.id}" aria-label="Editar">${ic('pencil', 'ic-sm')}</button><button class="switch ${s.activo ? 'on' : ''}" data-a="servToggle" data-s="${s.id}" aria-label="Activo"></button></div>`).join('')}</div>
      <h2 class="sec">${ic('palette', 'ic-sm')}Apariencia</h2>
      <div class="card"><div class="cfg-row">${ic(tema === 'light' ? 'sun' : 'moon')}<div class="grow"><b>Modo oscuro</b><small>Pensado para mirar desde el celular</small></div><button class="switch ${tema !== 'light' ? 'on' : ''}" data-a="tema" aria-label="Modo oscuro"></button></div></div>
      <h2 class="sec">${ic('sparkles', 'ic-sm')}Demo</h2>
      <div class="card"><div class="cfg-row"><div class="grow"><b>Restablecer datos de demo</b><small>Vuelve a cargar los turnos de ejemplo y borra tus cambios</small></div><button class="btn btn-danger" data-a="resetAsk">${ic('rotate-ccw', 'ic-sm')}Restablecer</button></div>
      <div class="cfg-row"><div class="grow"><b>Cambiar de usuario</b><small>Entrar como dueño o como barbero</small></div><button class="btn" data-a="logout">${ic('log-out', 'ic-sm')}Salir</button></div></div>`
  }

  // ——— Mi día (barbero) ———
  function tarjeta(t, opts = {}) {
    const st = vis(t)
    const hecho = t.hechoId && t.hechoId !== t.servicioId
    const puede = t.estado === 'pendiente' && (isPast(t) || t.fecha < NOW.day || (t.fecha === NOW.day && t.hora <= NOW.min + 15))
    return `<article class="card turno ${st === 'sincargar' ? 'is-sincargar' : ''} ${st === 'encurso' ? 'is-encurso' : ''} ${['atendido', 'novino', 'cancelado'].includes(st) ? 'is-done' : ''}" ${t.estado === 'cancelado' ? 'style="opacity:.55"' : ''}>
      <div class="turno-top">
        <div class="hora">${hm(t.hora)}<small>${opts.fecha ? fCorto(t.fecha) : 'hasta ' + hm(t.hora + t.dur)}</small></div>
        <div class="info"><b>${esc(t.cliente || 'Sin nombre')}</b><div class="serv">${hecho ? `<s>${esc(SV(t.servicioId).nombre)}</s>${ic('arrow-right', 'ic-sm')}` : ''}${esc(SV(t.hechoId || t.servicioId).nombre)} · ${money(total(t))}</div>${t.extras.length ? `<div class="serv" style="font-size:13px">+ ${t.extras.map((e) => esc(e.n)).join(', ')}</div>` : ''}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">${pill(st)}${t.tel ? `<a class="wa" href="${waLink(t.tel)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('message-circle', 'ic-sm')}</a>` : ''}</div>
      </div>
      ${t.nota ? `<div class="note">${ic('sticky-note')}<span>${esc(t.nota)}</span></div>` : ''}
      ${puede ? `<div class="actions"><button class="act act-ok" data-a="marcar" data-e="atendido" data-id="${t.id}">${ic('check')}Atendido</button><button class="act act-bad" data-a="marcar" data-e="novino" data-id="${t.id}">${ic('user-x')}No vino</button></div><button class="btn btn-ghost btn-sm" data-a="ajuste" data-id="${t.id}" style="align-self:flex-start">${ic('pencil', 'ic-sm')}Hice otro servicio / agregar extra o nota</button>` : ''}
      ${['atendido', 'novino'].includes(t.estado) ? `<div class="done-row"><span class="grow muted" style="font-size:12.5px;white-space:nowrap">${ic('check', 'ic-sm')} ${t.cargadoEn ? fTs(t.cargadoEn).slice(t.cargadoEn.slice(0, 10) === t.fecha ? 6 : 0) : ''}</span>${t.estado === 'atendido' ? `<button class="btn btn-sm" data-a="ajuste" data-id="${t.id}">${ic('pencil', 'ic-sm')}Ajustar</button>` : ''}<button class="btn btn-sm btn-ghost" data-a="marcar" data-e="pendiente" data-id="${t.id}">${ic('undo-2', 'ic-sm')}Deshacer</button></div>` : ''}
    </article>`
  }

  function vMiDia() {
    const b = B(ses.bid), k = ui.dia.fecha
    const ts = delDia(k, b.id)
    const hoyTs = delDia(NOW.day, b.id).filter((t) => t.estado !== 'cancelado')
    const sem = atendidos(enRango(weekStart(NOW.day), NOW.day, b.id))
    const viejos = sinCargar(b.id).filter((t) => t.fecha < NOW.day)
    const orden = [...ts.filter((t) => t.estado !== 'cancelado'), ...ts.filter((t) => t.estado === 'cancelado')]
    return `<div class="page-head"><div><h1>Hola, ${esc(b.nombre)}</h1><p>${fLargo(NOW.day)}</p></div></div>
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi"><div class="lbl">Hoy</div><div class="val num">${atendidos(hoyTs).length}<span class="faint" style="font-size:16px">/${hoyTs.length}</span></div><div class="hint">atendidos</div></div>
        <div class="kpi"><div class="lbl">Facturé hoy</div><div class="val num" style="font-size:22px">${moneyK(sum(atendidos(hoyTs)))}</div></div>
        <div class="kpi"><div class="lbl">Semana</div><div class="val num" style="font-size:22px">${moneyK(sum(sem))}</div><div class="hint">${plural(sem.length, 'cliente')}</div></div>
      </div>
      ${viejos.length ? `<button class="alert" style="display:block;width:100%;text-align:left" data-a="sincargar" data-b="${b.id}"><div class="alert-head"><span class="alert-icon">${ic('triangle-alert')}</span><div style="flex:1"><h3>${plural(viejos.length, 'turno', 'turnos')} de días anteriores sin cargar</h3><p>Marcá si los atendiste o si no vinieron. El dueño lo ve.</p></div>${ic('chevron-right', 'faint')}</div></button>` : ''}
      <div class="toolbar" style="margin-top:18px">
        <div class="datenav grow"><button class="icon-btn" data-a="diaMover" data-d="-1" aria-label="Día anterior">${ic('chevron-left')}</button><span class="lbl">${k === NOW.day ? 'Hoy' : k === addDays(NOW.day, -1) ? 'Ayer' : k === addDays(NOW.day, 1) ? 'Mañana' : fCorto(k)}</span><button class="icon-btn" data-a="diaMover" data-d="1" aria-label="Día siguiente">${ic('chevron-right')}</button></div>
        ${k !== NOW.day ? '<button class="btn btn-sm" data-a="diaHoy">Volver a hoy</button>' : `<span class="muted" style="font-size:13px">${plural(ts.filter((t) => t.estado !== 'cancelado').length, 'turno')}</span>`}
      </div>
      ${k === NOW.day ? `<button class="btn btn-gold btn-lg btn-block" style="margin-bottom:12px" data-a="walkin">${ic('door-open')}Cargar cliente sin reserva</button>` : ''}
      <div class="list">${orden.length ? orden.map((t) => tarjeta(t)).join('') : `<div class="card empty">${ic('calendar')}<div>${abierto(k) ? 'No tenés turnos este día' : 'La barbería está cerrada'}</div></div>`}</div>`
  }

  function vResumen() {
    const b = B(ses.bid)
    const ws = weekStart(NOW.day)
    const sem = enRango(ws, NOW.day, b.id), semAt = atendidos(sem)
    const mes = enRango(addDays(NOW.day, -29), NOW.day, b.id), mesSt = statsDe(mes)
    const st = statsDe(sem)
    const dias = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(ws, i)).filter((k) => abierto(k) || delDia(k, b.id).length)
    const vals = dias.map((k) => sum(atendidos(delDia(k, b.id))))
    const max = Math.max(1, ...vals)
    return `<div class="page-head"><div><h1>Mi resumen</h1><p>Lo que atendiste y facturaste</p></div></div>
      <div class="kpis" style="grid-template-columns:repeat(2,1fr)">
        <div class="kpi money" style="grid-column:1/-1"><div class="lbl">${ic('banknote')}Facturé esta semana</div><div class="val num">${money(sum(semAt))}</div><div class="hint">${plural(semAt.length, 'cliente atendido', 'clientes atendidos')} · ticket ${money(st.ticket)}</div></div>
        <div class="kpi"><div class="lbl">Últimos 30 días</div><div class="val num" style="font-size:22px">${moneyK(mesSt.fact)}</div><div class="hint">${mesSt.at} atendidos</div></div>
        <div class="kpi"><div class="lbl">No vinieron</div><div class="val num" style="font-size:22px">${Math.round(mesSt.ns * 100)}%</div><div class="hint">en 30 días</div></div>
      </div>
      <div class="card chart-card" style="margin-top:12px"><h3>Esta semana, día por día</h3><p class="cap">Facturación de turnos atendidos</p>
        <div style="display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:18px">${dias.map((k, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end"><span class="num" style="font-size:11.5px;color:var(--muted)">${vals[i] ? moneyK(vals[i]).replace(' mil', 'k') : ''}</span><div data-tip="${esc(`${fLargo(k)}\n${money(vals[i])}`)}" style="width:100%;max-width:44px;height:${Math.max(2, (vals[i] / max) * 100)}%;background:${k === NOW.day ? 'var(--accent)' : b.color};border-radius:4px 4px 0 0;opacity:${k > NOW.day ? .25 : 1}"></div><span style="font-size:12px;color:${k === NOW.day ? 'var(--accent)' : 'var(--muted)'};text-transform:capitalize">${fmt(k, { weekday: 'short' }).replace('.', '')}</span></div>`).join('')}</div>
      </div>
      <h2 class="sec">Servicios de la semana</h2>
      <div class="card">${S.servicios.filter((s) => st.cuenta[s.id]).sort((a, c) => st.cuenta[c.id] - st.cuenta[a.id]).map((s) => `<div class="row"><div class="grow"><b>${esc(s.nombre)}</b><small>${money(s.precio)} c/u</small></div><b class="num">× ${st.cuenta[s.id]}</b></div>`).join('') || '<div class="empty">Todavía no atendiste a nadie esta semana</div>'}</div>`
  }

  // ═══════════ Modales ═══════════
  function openModal(m) { modal = m; renderModal() }
  function closeModal() { modal = null; $modal.innerHTML = ''; render() }
  function sheet(title, sub, body, foot = '') {
    return `<div class="overlay" data-a="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grip"></div>
      <div class="sheet-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="icon-btn x" data-a="close" aria-label="Cerrar">${ic('x')}</button></div>
      ${body}<div class="sheet-foot ${foot ? '' : 'empty'}">${foot}</div></div></div>`
  }
  function renderModal() {
    if (!modal) { $modal.innerHTML = ''; return }
    const keepScroll = $modal.querySelector('.sheet')?.scrollTop
    $modal.innerHTML = { detalle: mDetalle, form: mForm, ajuste: mAjuste, walkin: mWalkin, sincargar: mSinCargar, cuenta: mCuenta, barbero: mBarbero, servicio: mServicio, reset: mReset }[modal.type]()
    if (keepScroll) $modal.querySelector('.sheet').scrollTop = keepScroll
  }

  function mDetalle() {
    const t = S.turnos.find((x) => x.id === modal.id)
    if (!t) return sheet('Turno', '', '<div class="empty">Este turno ya no existe.</div>')
    const b = B(t.barberoId), st = vis(t), dueno = ses.rol === 'dueno'
    const tarde = t.cargadoEn && ['atendido', 'novino'].includes(t.estado) ? tsAbs(t.cargadoEn) - absMin(t.fecha, t.hora + t.dur) : 0
    const rows = [
      ['Estado', pill(st)],
      ['Barbero', `<span style="display:inline-flex;align-items:center;gap:8px">${av(b, 'av-xs')}${esc(b.nombre)}</span>`],
      ['Fecha', `<span style="text-transform:capitalize">${fLargo(t.fecha)}</span>`],
      ['Horario', `${hm(t.hora)} a ${hm(t.hora + t.dur)}`],
      [t.hechoId ? 'Servicio reservado' : 'Servicio', t.sinReserva ? 'Sin reserva' : esc(SV(t.servicioId).nombre)],
    ]
    if (t.hechoId) rows.push(['Servicio hecho', esc(SV(t.hechoId).nombre) + (t.hechoId !== t.servicioId ? ' <span class="pill st-encurso" style="height:20px">cambió</span>' : '')])
    if (t.extras.length) rows.push(['Extras', t.extras.map((e) => `${esc(e.n)} ${money(e.p)}`).join('<br>')])
    rows.push(['Precio', `<b class="num">${money(total(t))}</b>`])
    if (t.tel) rows.push(['Teléfono', `<a class="wa" href="${waLink(t.tel)}" target="_blank" rel="noopener">${ic('message-circle', 'ic-sm')}${esc(t.tel)}</a>`])
    rows.push(['Nota del barbero', t.nota ? esc(t.nota) : '<span class="faint">—</span>'])
    rows.push(['Cargado', t.cargadoEn ? `${esc(t.cargadoPor === 'dueno' ? 'Dueño' : B(t.cargadoPor).nombre)} · ${fTs(t.cargadoEn)} hs${tarde > 90 ? `<br><span style="color:var(--warn);font-size:12.5px">${tarde >= 1440 ? Math.round(tarde / 1440) + ' días' : Math.round(tarde / 60) + ' h'} después del turno</span>` : ''}` : st === 'sincargar' ? '<span style="color:var(--warn)">Todavía no lo cargó</span>' : '<span class="faint">—</span>'])

    let foot = ''
    if (modal.confirmar) {
      return sheet('¿Cancelar este turno?', `${esc(t.cliente || 'Sin nombre')} · ${fCorto(t.fecha)} ${hm(t.hora)} con ${esc(b.nombre)}`, '<p class="muted" style="margin:0 0 14px">El horario queda libre para otro cliente. Queda registrado en la actividad.</p>', `<button class="btn" data-a="noConfirmar">Volver</button><button class="btn btn-danger" data-a="cancelarTurno">${ic('ban', 'ic-sm')}Sí, cancelar</button>`)
    }
    if (t.estado === 'pendiente') {
      foot += `<div class="actions" style="width:100%"><button class="act act-ok" data-a="marcar" data-e="atendido" data-id="${t.id}">${ic('check')}Atendido</button><button class="act act-bad" data-a="marcar" data-e="novino" data-id="${t.id}">${ic('user-x')}No vino</button></div>`
      if (dueno) foot += `<button class="btn" data-a="editar" data-id="${t.id}">${ic('pencil', 'ic-sm')}Editar</button><button class="btn btn-danger" data-a="confirmar">${ic('ban', 'ic-sm')}Cancelar turno</button>`
      else foot += `<button class="btn" data-a="ajuste" data-id="${t.id}">${ic('pencil', 'ic-sm')}Otro servicio / nota</button>`
    } else if (t.estado === 'atendido') {
      foot += `<button class="btn" data-a="ajuste" data-id="${t.id}">${ic('pencil', 'ic-sm')}Ajustar servicio o nota</button><button class="btn btn-ghost" data-a="marcar" data-e="pendiente" data-id="${t.id}">${ic('undo-2', 'ic-sm')}Volver a pendiente</button>`
    } else if (t.estado === 'novino') {
      foot += `<button class="btn btn-ghost" data-a="marcar" data-e="pendiente" data-id="${t.id}">${ic('undo-2', 'ic-sm')}Volver a pendiente</button>`
    }
    return sheet(esc(t.cliente || 'Sin nombre'), `${t.sinReserva ? 'Entró sin reserva · ' : ''}${fCorto(t.fecha)} · ${hm(t.hora)} · ${esc(b.nombre)}`, `<div class="detail">${rows.map(([a, v]) => `<div><span>${a}</span><span>${v}</span></div>`).join('')}</div>`, foot)
  }

  // Formulario de turno: los cambios de barbero, servicio o fecha recalculan los horarios libres
  function libres(f) {
    const dur = SV(f.sid).dur
    const ocupados = S.turnos.filter((t) => t.barberoId === f.bid && t.fecha === f.fecha && t.estado !== 'cancelado' && t.id !== f.id)
    const r = []
    for (let h = S.config.abre; h + dur <= S.config.cierra; h += 15) {
      const choca = ocupados.find((t) => h < t.hora + t.dur && t.hora < h + dur)
      const pasada = !f.id && f.fecha === NOW.day && h < NOW.min
      r.push({ h, ok: !choca && !pasada })
    }
    return r
  }
  function syncForm() {
    if (!modal || !modal.f) return
    $modal.querySelectorAll('[data-f]').forEach((el) => { modal.f[el.dataset.f] = el.value })
  }
  function mForm() {
    const f = modal.f
    const servs = S.servicios.filter((s) => s.activo || s.id === f.sid)
    const slots = libres(f)
    const cl = [...clientes().keys()].slice(0, 400)
    return sheet(f.id ? 'Editar turno' : 'Nuevo turno', f.id ? '' : 'Elegí barbero, servicio y horario', `
      ${modal.err ? `<div class="err">${ic('triangle-alert', 'ic-sm')}<span>${modal.err}</span></div>` : ''}
      <div class="field"><span class="lbl">Barbero</span><div class="chips">${activos().map((b) => `<button class="chip ${f.bid === b.id ? 'on' : ''}" data-a="fSet" data-k="bid" data-v="${b.id}">${av(b, 'av-sm')}${esc(b.nombre)}</button>`).join('')}</div></div>
      <div class="field"><label for="f-cli">Cliente</label><input class="input" id="f-cli" data-f="cliente" list="dl-cli" value="${esc(f.cliente)}" placeholder="Nombre y apellido" autocomplete="off"><datalist id="dl-cli">${cl.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="field"><label for="f-tel">Teléfono</label><input class="input" id="f-tel" data-f="tel" inputmode="tel" value="${esc(f.tel)}" placeholder="11 5555-5555"></div>
      <div class="field"><label for="f-serv">Servicio</label><select class="input" id="f-serv" data-f="sid" data-on="fRefresh">${servs.map((s) => `<option value="${s.id}" ${s.id === f.sid ? 'selected' : ''}>${esc(s.nombre)} · ${money(s.precio)} · ${s.dur} min</option>`).join('')}</select></div>
      <div class="field"><label for="f-fecha">Fecha</label><input class="input" type="date" id="f-fecha" data-f="fecha" data-on="fRefresh" value="${f.fecha}"></div>
      <div class="field"><span class="lbl">Horario ${abierto(f.fecha) ? `<span class="faint" style="font-weight:400">· ${slots.filter((s) => s.ok).length} libres con ${esc(B(f.bid).nombre)}</span>` : ''}</span>
        ${abierto(f.fecha) ? `<div class="slots">${slots.map((s) => `<button class="${+f.hora === s.h ? 'on' : ''}" ${s.ok || +f.hora === s.h ? '' : 'disabled'} data-a="fSet" data-k="hora" data-v="${s.h}">${hm(s.h)}</button>`).join('')}</div>` : `<div class="err" style="margin:0">${ic('store', 'ic-sm')}<span>Ese día la barbería está cerrada (abre de martes a sábado).</span></div>`}
      </div>`, `<button class="btn" data-a="close">Cancelar</button><button class="btn btn-gold" data-a="fGuardar">${ic('check', 'ic-sm')}${f.id ? 'Guardar cambios' : 'Agendar turno'}</button>`)
  }

  function mAjuste() {
    const t = S.turnos.find((x) => x.id === modal.id)
    const sid = modal.hechoId
    const tot = SV(sid).precio + DB.EXTRAS.filter((e) => modal.extras.includes(e.n)).reduce((s, e) => s + e.p, 0)
    return sheet('¿Qué le hiciste?', `${esc(t.cliente || 'Sin nombre')} · reservó ${esc(SV(t.servicioId).nombre)}`, `
      <div class="field"><span class="lbl">Servicio hecho</span><div class="opt-grid">${S.servicios.filter((s) => s.activo || s.id === sid).map((s) => `<button class="opt ${s.id === sid ? 'on' : ''}" data-a="ajServ" data-s="${s.id}"><b>${esc(s.nombre)}</b><span>${money(s.precio)}</span></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Extras</span><div class="opt-grid">${DB.EXTRAS.map((e) => `<button class="opt chk ${modal.extras.includes(e.n) ? 'on' : ''}" data-a="ajExtra" data-n="${esc(e.n)}"><b style="font-size:13.5px">${esc(e.n)}</b><span>+${money(e.p)}</span></button>`).join('')}</div></div>
      <div class="field"><label for="aj-nota">Nota</label><textarea class="input" id="aj-nota" placeholder="Ej: quiere volver en 15 días">${esc(modal.nota)}</textarea></div>
      <div class="total-row"><span>Total</span><b>${money(tot)}</b></div>`, `<button class="act act-ok" style="width:100%" data-a="ajGuardar">${ic('check')}${t.estado === 'atendido' ? 'Guardar cambios' : 'Guardar como atendido'}</button>`)
  }

  function mWalkin() {
    const sid = modal.sid
    const tot = SV(sid).precio + DB.EXTRAS.filter((e) => modal.extras.includes(e.n)).reduce((s, e) => s + e.p, 0)
    return sheet('Cliente sin reserva', `Se registra como atendido a las ${hm(NOW.min)}`, `
      <div class="field"><span class="lbl">Servicio</span><div class="opt-grid">${S.servicios.filter((s) => s.activo).map((s) => `<button class="opt ${s.id === sid ? 'on' : ''}" data-a="wkServ" data-s="${s.id}"><b>${esc(s.nombre)}</b><span>${money(s.precio)}</span></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Extras</span><div class="opt-grid">${DB.EXTRAS.map((e) => `<button class="opt chk ${modal.extras.includes(e.n) ? 'on' : ''}" data-a="wkExtra" data-n="${esc(e.n)}"><b style="font-size:13.5px">${esc(e.n)}</b><span>+${money(e.p)}</span></button>`).join('')}</div></div>
      <div class="field"><label for="wk-nom">Nombre <span class="faint" style="font-weight:400">(opcional)</span></label><input class="input" id="wk-nom" value="${esc(modal.cliente)}" placeholder="Ej: Martín" autocomplete="off"></div>
      <div class="total-row"><span>Total</span><b>${money(tot)}</b></div>`, `<button class="act act-ok" style="width:100%" data-a="wkGuardar">${ic('check')}Registrar atendido</button>`)
  }

  function mSinCargar() {
    const b = B(modal.bid)
    const ts = sinCargar(modal.bid).filter((t) => ses.rol === 'dueno' || t.fecha < NOW.day)
    if (ses.rol === 'barbero') {
      return sheet('Turnos sin cargar', 'De días anteriores. Marcá cada uno.', ts.length ? `<div class="list">${ts.map((t) => tarjeta(t, { fecha: true })).join('')}</div>` : `<div class="empty">${ic('circle-check')}<div>¡Listo! Está todo cargado.</div></div>`)
    }
    const msg = `Hola ${b.nombre}! Te quedaron ${ts.length} turnos sin cargar en la app (${[...new Set(ts.map((t) => fCorto(t.fecha)))].join(', ')}). ¿Los cargás cuando puedas? Gracias!`
    return sheet(`${esc(b.nombre)} · sin cargar`, `${plural(ts.length, 'turno')} que ya pasaron y no tienen estado`, ts.length ? `<div class="card" style="margin-bottom:14px">${ts.map((t) => `<button class="row" data-a="ver" data-id="${t.id}"><div class="num" style="font-weight:600;min-width:84px">${fCorto(t.fecha)}<small>${hm(t.hora)}</small></div><div class="grow"><b>${esc(t.cliente || 'Sin nombre')}</b><small>${esc(SV(t.servicioId).nombre)} · ${money(total(t))}</small></div>${ic('chevron-right', 'faint')}</button>`).join('')}</div>` : `<div class="empty">${ic('circle-check')}<div>Todo cargado</div></div>`,
      b.tel && ts.length ? `<a class="btn btn-gold" style="text-decoration:none" href="${waLink(b.tel, msg)}" target="_blank" rel="noopener">${ic('message-circle', 'ic-sm')}Avisarle por WhatsApp</a>` : '')
  }

  function mCuenta() {
    const dueno = ses.rol === 'dueno'
    const tema = document.documentElement.dataset.theme
    return sheet(dueno ? 'Dueño' : esc(B(ses.bid).nombre), esc(S.config.nombre), `<div class="card" style="margin-bottom:14px">
      <div class="cfg-row">${ic(tema === 'light' ? 'sun' : 'moon')}<div class="grow"><b>Modo oscuro</b></div><button class="switch ${tema !== 'light' ? 'on' : ''}" data-a="tema"></button></div>
      <div class="cfg-row">${ic('clock')}<div class="grow"><b>Hora de Argentina</b><small>${fLargo(NOW.day)} · ${hm(NOW.min)}</small></div></div>
    </div>
    ${dueno ? `<div class="field"><span class="lbl">Ver la app de un barbero</span><div class="chips" style="flex-wrap:wrap">${activos().map((b) => `<button class="chip" data-a="verComo" data-b="${b.id}">${av(b, 'av-sm')}${esc(b.nombre)}</button>`).join('')}</div></div>` : ses.desdeDueno ? `<button class="btn btn-block btn-gold" style="margin-bottom:8px" data-a="volverDueno">${ic('crown', 'ic-sm')}Volver al panel del dueño</button>` : ''}`, `<button class="btn btn-block" data-a="logout">${ic('log-out', 'ic-sm')}Cambiar de usuario</button>`)
  }

  const COLORES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9', '#e66767', '#008300']
  function mBarbero() {
    const f = modal.f
    const tiene = f.id && S.turnos.some((t) => t.barberoId === f.id)
    return sheet(f.id ? 'Editar barbero' : 'Nuevo barbero', '', `
      ${modal.err ? `<div class="err">${ic('triangle-alert', 'ic-sm')}<span>${modal.err}</span></div>` : ''}
      <div style="display:flex;justify-content:center;margin-bottom:14px">${av({ nombre: f.nombre || '?', color: f.color }, 'av-lg')}</div>
      <div class="field"><label for="b-nom">Nombre</label><input class="input" id="b-nom" data-f="nombre" value="${esc(f.nombre)}" maxlength="24"></div>
      <div class="field"><label for="b-tel">WhatsApp</label><input class="input" id="b-tel" data-f="tel" inputmode="tel" value="${esc(f.tel)}" placeholder="11 5555-5555"></div>
      <div class="field"><span class="lbl">Color en la agenda</span><div class="colors">${COLORES.map((c) => `<button class="${c === f.color ? 'on' : ''}" style="background:${c}" data-a="bColor" data-c="${c}" aria-label="Color"></button>`).join('')}</div></div>`,
      `${f.id && !tiene ? `<button class="btn btn-danger" data-a="bBorrar">${ic('trash-2', 'ic-sm')}Eliminar</button>` : ''}<button class="btn btn-gold" data-a="bGuardar">${ic('check', 'ic-sm')}Guardar</button>`)
  }
  function mServicio() {
    const f = modal.f
    const usado = f.id && S.turnos.some((t) => t.servicioId === f.id || t.hechoId === f.id)
    return sheet(f.id ? 'Editar servicio' : 'Nuevo servicio', f.id ? 'El precio nuevo vale para los turnos que se carguen desde ahora' : '', `
      ${modal.err ? `<div class="err">${ic('triangle-alert', 'ic-sm')}<span>${modal.err}</span></div>` : ''}
      <div class="field"><label for="s-nom">Nombre</label><input class="input" id="s-nom" data-f="nombre" value="${esc(f.nombre)}" maxlength="32"></div>
      <div class="field-row">
        <div class="field"><label for="s-pre">Precio ($)</label><input class="input" id="s-pre" data-f="precio" inputmode="numeric" value="${esc(f.precio)}"></div>
        <div class="field"><label for="s-dur">Duración</label><select class="input" id="s-dur" data-f="dur">${[10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120].map((d) => `<option value="${d}" ${+f.dur === d ? 'selected' : ''}>${d} min</option>`).join('')}</select></div>
      </div>`, `${f.id && !usado ? `<button class="btn btn-danger" data-a="sBorrar">${ic('trash-2', 'ic-sm')}Eliminar</button>` : ''}<button class="btn btn-gold" data-a="sGuardar">${ic('check', 'ic-sm')}Guardar</button>`)
  }
  function mReset() {
    return sheet('¿Restablecer la demo?', '', '<p class="muted" style="margin:0 0 14px">Se vuelven a cargar los barberos, servicios y turnos de ejemplo. Se pierden los cambios que hiciste.</p>', `<button class="btn" data-a="close">Volver</button><button class="btn btn-danger" data-a="reset">${ic('rotate-ccw', 'ic-sm')}Restablecer</button>`)
  }

  // ═══════════ Acciones ═══════════
  const turno = (id) => S.turnos.find((t) => t.id === id)
  const guardarSesion = () => { try { localStorage.setItem('barberia:sesion', JSON.stringify(ses)) } catch (e) {} }
  const A = {
    login: (el) => { ses = el.dataset.rol === 'dueno' ? { rol: 'dueno' } : { rol: 'barbero', bid: el.dataset.b }; try { localStorage.setItem('barberia:sesion', JSON.stringify(ses)) } catch (e) {} ui.view = null; ui.dia.fecha = NOW.day; scrollTo(0, 0); render() },
    verComo: (el) => { ses = { rol: 'barbero', bid: el.dataset.b, desdeDueno: true }; guardarSesion(); modal = null; $modal.innerHTML = ''; ui.view = null; ui.dia.fecha = NOW.day; scrollTo(0, 0); render() },
    volverDueno: () => { ses = { rol: 'dueno' }; guardarSesion(); modal = null; $modal.innerHTML = ''; ui.view = 'hoy'; scrollTo(0, 0); render() },
    logout: () => { ses = null; try { localStorage.removeItem('barberia:sesion') } catch (e) {} modal = null; $modal.innerHTML = ''; render() },
    nav: (el) => { ui.view = el.dataset.v; scrollTo(0, 0); render() },
    cuenta: () => openModal({ type: 'cuenta' }),
    tema: () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'light' ? 'dark' : 'light'; try { localStorage.setItem('barberia:tema', r.dataset.theme) } catch (e) {} document.querySelector('meta[name=theme-color]').content = r.dataset.theme === 'light' ? '#f4f1ec' : '#0e0f11'; render(); renderModal() },
    undo: () => { if (undoFn) { undoFn(); undoFn = null; $toasts.innerHTML = '' } },
    close: () => closeModal(),
    overlay: (el, e) => { if (e.target === el) closeModal() },

    verActividad: () => { ui.view = 'actividad'; ui.act.filtro = 'todos'; scrollTo(0, 0); render() },
    verAgenda: (el) => { ui.view = 'agenda'; ui.agenda = { ...ui.agenda, modo: 'dia', fecha: NOW.day, filtro: el.dataset.b }; scrollTo(0, 0); render() },
    agModo: (el) => { ui.agenda.modo = el.dataset.m; render() },
    agMover: (el) => { ui.agenda.fecha = addDays(ui.agenda.fecha, +el.dataset.d * (ui.agenda.modo === 'dia' ? 1 : 7)); render() },
    agHoy: () => { ui.agenda.fecha = NOW.day; render() },
    agDia: (el) => { ui.agenda.modo = 'dia'; ui.agenda.fecha = el.dataset.f; render() },
    agFiltro: (el) => { ui.agenda.filtro = el.dataset.b; render() },
    slot: (el, e) => {
      if (e.target !== el) return
      const r = el.getBoundingClientRect()
      const h = S.config.abre + Math.floor((e.clientY - r.top) / +el.dataset.px / 15) * 15
      nuevo({ bid: el.dataset.b, fecha: el.dataset.f, hora: h })
    },
    ver: (el) => openModal({ type: 'detalle', id: el.dataset.id }),
    nuevo: () => nuevo({}),
    editar: (el) => { const t = turno(el.dataset.id); openModal({ type: 'form', f: { id: t.id, bid: t.barberoId, cliente: t.cliente, tel: t.tel, sid: t.servicioId, fecha: t.fecha, hora: t.hora } }) },
    confirmar: () => { modal.confirmar = true; renderModal() },
    noConfirmar: () => { modal.confirmar = false; renderModal() },
    cancelarTurno: () => { const t = turno(modal.id); marcar(t, 'cancelado'); closeModal() },
    marcar: (el) => {
      const t = turno(el.dataset.id)
      marcar(t, el.dataset.e)
      renderModal()
      render()
    },
    sincargar: (el) => openModal({ type: 'sincargar', bid: el.dataset.b }),

    fSet: (el) => { syncForm(); modal.f[el.dataset.k] = el.dataset.k === 'hora' ? +el.dataset.v : el.dataset.v; modal.err = ''; renderModal() },
    fGuardar: () => {
      syncForm()
      const f = modal.f, s = SV(f.sid), cli = f.cliente.trim()
      const err = (m) => { modal.err = m; renderModal(); $modal.querySelector('.sheet').scrollTop = 0 }
      if (!cli) return err('Poné el nombre del cliente.')
      if (!abierto(f.fecha)) return err('Ese día la barbería está cerrada (abre de martes a sábado).')
      if (f.hora === '' || f.hora == null) return err('Elegí un horario.')
      const h = +f.hora
      if (h < S.config.abre || h + s.dur > S.config.cierra) return err(`El turno tiene que terminar antes de las ${hm(S.config.cierra)}.`)
      const choca = S.turnos.find((t) => t.barberoId === f.bid && t.fecha === f.fecha && t.estado !== 'cancelado' && t.id !== f.id && h < t.hora + t.dur && t.hora < h + s.dur)
      if (choca) return err(`Se superpone con ${esc(corto(choca.cliente))} (${hm(choca.hora)}–${hm(choca.hora + choca.dur)}) en la agenda de ${esc(B(f.bid).nombre)}.`)
      if (f.id) {
        const t = turno(f.id)
        const cambios = []
        if (t.barberoId !== f.bid) cambios.push(`${B(t.barberoId).nombre} → ${B(f.bid).nombre}`)
        if (t.fecha !== f.fecha || t.hora !== h) cambios.push(`${fCorto(f.fecha)} ${hm(h)}`)
        if (t.servicioId !== f.sid) cambios.push(s.nombre)
        Object.assign(t, { barberoId: f.bid, cliente: cli, tel: f.tel.trim(), servicioId: f.sid, fecha: f.fecha, hora: h, dur: s.dur, precio: s.precio })
        log(t, 'editado', cambios.join(' · '))
        toast('Turno actualizado')
      } else {
        const t = { id: 't' + (++S.seq), barberoId: f.bid, fecha: f.fecha, hora: h, dur: s.dur, cliente: cli, tel: f.tel.trim(), servicioId: f.sid, hechoId: null, precio: s.precio, extras: [], estado: 'pendiente', nota: '', cargadoEn: null, cargadoPor: null, sinReserva: false, creadoEn: DB.stamp() }
        S.turnos.push(t)
        log(t, 'creado', `con ${B(f.bid).nombre} · ${fCorto(f.fecha)} ${hm(h)}`)
        toast(`Agendado: ${esc(corto(cli))} con ${esc(B(f.bid).nombre)}, ${fCorto(f.fecha)} ${hm(h)}`, null, 'calendar-check')
        if (ui.view === 'agenda' && ui.agenda.modo === 'dia') ui.agenda.fecha = f.fecha
      }
      save(); closeModal()
    },

    ajuste: (el) => { const t = turno(el.dataset.id); openModal({ type: 'ajuste', id: t.id, hechoId: t.hechoId || t.servicioId, extras: t.extras.map((e) => e.n), nota: t.nota, volver: modal && ['sincargar', 'detalle'].includes(modal.type) ? modal : null }) },
    ajServ: (el) => { modal.nota = $modal.querySelector('#aj-nota').value; modal.hechoId = el.dataset.s; renderModal() },
    ajExtra: (el) => { modal.nota = $modal.querySelector('#aj-nota').value; const n = el.dataset.n; modal.extras = modal.extras.includes(n) ? modal.extras.filter((x) => x !== n) : [...modal.extras, n]; renderModal() },
    ajGuardar: () => {
      const t = turno(modal.id), antes = snapshot(t)
      const era = t.estado
      const nota = $modal.querySelector('#aj-nota').value.trim()
      const cambios = []
      if ((t.hechoId || t.servicioId) !== modal.hechoId) cambios.push(`${SV(t.hechoId || t.servicioId).nombre} → ${SV(modal.hechoId).nombre}`)
      const nuevosExtras = DB.EXTRAS.filter((e) => modal.extras.includes(e.n))
      if (nuevosExtras.length && JSON.stringify(nuevosExtras) !== JSON.stringify(t.extras)) cambios.push('+' + nuevosExtras.map((e) => e.n).join(', +'))
      if (nota && nota !== t.nota) cambios.push('nota')
      Object.assign(t, { hechoId: modal.hechoId, precio: SV(modal.hechoId).precio, extras: nuevosExtras, nota, estado: 'atendido' })
      if (era !== 'atendido') { t.cargadoEn = DB.stamp(); t.cargadoPor = actor() }
      const e = log(t, era === 'atendido' ? 'ajuste' : 'atendido', cambios.join(' · '))
      save()
      const volver = modal.volver
      modal = volver || null
      renderModal(); render()
      toast(`${esc(corto(t.cliente))} · ${money(total(t))}`, () => { Object.assign(t, antes); S.actividad = S.actividad.filter((x) => x !== e); save(); render(); renderModal() })
    },

    walkin: () => openModal({ type: 'walkin', sid: 's1', extras: [], cliente: '' }),
    wkServ: (el) => { modal.cliente = $modal.querySelector('#wk-nom').value; modal.sid = el.dataset.s; renderModal() },
    wkExtra: (el) => { modal.cliente = $modal.querySelector('#wk-nom').value; const n = el.dataset.n; modal.extras = modal.extras.includes(n) ? modal.extras.filter((x) => x !== n) : [...modal.extras, n]; renderModal() },
    wkGuardar: () => {
      const s = SV(modal.sid), cli = $modal.querySelector('#wk-nom').value.trim()
      const t = { id: 't' + (++S.seq), barberoId: ses.bid, fecha: NOW.day, hora: Math.floor(NOW.min / 5) * 5, dur: s.dur, cliente: cli, tel: '', servicioId: s.id, hechoId: s.id, precio: s.precio, extras: DB.EXTRAS.filter((e) => modal.extras.includes(e.n)), estado: 'atendido', nota: '', cargadoEn: DB.stamp(), cargadoPor: ses.bid, sinReserva: true, creadoEn: DB.stamp() }
      S.turnos.push(t)
      const e = log(t, 'sinreserva')
      save(); modal = null; $modal.innerHTML = ''; render()
      toast(`Sin reserva cargado · ${money(total(t))}`, () => { S.turnos = S.turnos.filter((x) => x !== t); S.actividad = S.actividad.filter((x) => x !== e); save(); render() })
    },

    diaMover: (el) => { ui.dia.fecha = addDays(ui.dia.fecha, +el.dataset.d); render() },
    diaHoy: () => { ui.dia.fecha = NOW.day; render() },
    repModo: (el) => { ui.rep.modo = el.dataset.m; render() },
    repMover: (el) => { ui.rep.semana = addDays(ui.rep.semana, +el.dataset.d); render() },
    actFiltro: (el) => { ui.act.filtro = el.dataset.b; ui.act.n = 50; render() },
    actMas: () => { ui.act.n += 50; render() },

    cfgNombre: () => { const v = document.getElementById('cfg-nombre').value.trim(); if (!v) return; S.config.nombre = v; save(); document.title = `${v} · Turnos`; render(); toast('Nombre guardado') },
    barberoToggle: (el) => {
      const b = B(el.dataset.b)
      if (b.activo && activos().length === 1) return toast('Tiene que quedar al menos un barbero activo', null, 'info')
      b.activo = !b.activo; save(); render()
    },
    barberoForm: (el) => { const b = el.dataset.b && B(el.dataset.b); openModal({ type: 'barbero', f: b ? { id: b.id, nombre: b.nombre, tel: b.tel || '', color: b.color } : { nombre: '', tel: '', color: COLORES[S.barberos.length % COLORES.length] } }) },
    bColor: (el) => { syncForm(); modal.f.color = el.dataset.c; renderModal() },
    bGuardar: () => {
      syncForm()
      const f = modal.f
      if (!f.nombre.trim()) { modal.err = 'Poné un nombre.'; return renderModal() }
      if (f.id) Object.assign(B(f.id), { nombre: f.nombre.trim(), tel: f.tel.trim(), color: f.color })
      else S.barberos.push({ id: 'b' + Date.now().toString(36), nombre: f.nombre.trim(), tel: f.tel.trim(), color: f.color, activo: true })
      save(); closeModal(); toast('Barbero guardado')
    },
    bBorrar: () => { S.barberos = S.barberos.filter((b) => b.id !== modal.f.id); save(); closeModal(); toast('Barbero eliminado', null, 'trash-2') },
    servToggle: (el) => { const s = SV(el.dataset.s); s.activo = !s.activo; save(); render() },
    servForm: (el) => { const s = el.dataset.s && SV(el.dataset.s); openModal({ type: 'servicio', f: s ? { id: s.id, nombre: s.nombre, precio: s.precio.toLocaleString('es-AR'), dur: s.dur } : { nombre: '', precio: '', dur: 30 } }) },
    sGuardar: () => {
      syncForm()
      const f = modal.f
      const precio = parseInt(String(f.precio).replace(/\D/g, ''), 10)
      if (!f.nombre.trim()) { modal.err = 'Poné un nombre.'; return renderModal() }
      if (!precio) { modal.err = 'Poné un precio válido.'; return renderModal() }
      if (f.id) Object.assign(SV(f.id), { nombre: f.nombre.trim(), precio, dur: +f.dur })
      else S.servicios.push({ id: 's' + Date.now().toString(36), nombre: f.nombre.trim(), precio, dur: +f.dur, activo: true })
      save(); closeModal(); toast('Servicio guardado')
    },
    sBorrar: () => { S.servicios = S.servicios.filter((s) => s.id !== modal.f.id); save(); closeModal(); toast('Servicio eliminado', null, 'trash-2') },
    resetAsk: () => openModal({ type: 'reset' }),
    reset: () => { S = DB.reset(); S.renovado = false; save(); ui.agenda.fecha = ui.dia.fecha = NOW.day; modal = null; $modal.innerHTML = ''; document.title = `${S.config.nombre} · Turnos`; render(); toast('Datos de demo restablecidos', null, 'rotate-ccw') },
  }

  function nuevo(pre) {
    const bid = pre.bid || (ui.agenda.filtro !== 'todos' ? ui.agenda.filtro : activos()[0].id)
    let fecha = pre.fecha || (ui.view === 'agenda' ? ui.agenda.fecha : NOW.day)
    if (fecha < NOW.day && !pre.fecha) fecha = NOW.day
    const f = { bid, cliente: '', tel: '', sid: 's1', fecha, hora: pre.hora ?? '' }
    if (pre.hora == null) { const l = libres(f).find((s) => s.ok); f.hora = l ? l.h : '' }
    openModal({ type: 'form', f })
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]')
    if (!el || el.disabled) return
    const fn = A[el.dataset.a]
    if (fn) fn(el, e)
  })
  document.addEventListener('change', (e) => {
    if (e.target.dataset.on === 'fRefresh') { syncForm(); modal.err = ''; renderModal() }
  })
  let rz
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (ui.view === 'reportes' && !modal) render() }, 150) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal) closeModal() })
  document.addEventListener('input', (e) => {
    if (modal && modal.f && e.target.dataset.f === 'cliente') {
      const tel = clientes().get(e.target.value)
      const telEl = $modal.querySelector('[data-f=tel]')
      if (tel && telEl && !telEl.value) telEl.value = tel
    }
  })

  // Reloj: refresca cada 30 s si no hay una hoja abierta
  setInterval(() => { if (!modal && document.visibilityState === 'visible') render() }, 30000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !modal) render() })

  document.title = `${S.config.nombre} · Turnos`
  render()
})()
