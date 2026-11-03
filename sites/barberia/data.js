/*
 * Datos de la demo: fechas en hora de Argentina, datos de ejemplo y guardado en localStorage.
 *
 * Todas las fechas son "de pared" en Argentina: el día va como texto ('2026-11-03') y la hora como
 * minutos desde las 00:00 (600 = 10:00). Así el dueño ve lo mismo desde París que desde Buenos Aires.
 * `?hora=15:30` en la URL simula otra hora (útil para mostrar la demo de noche).
 */
(function () {
  const TZ = 'America/Argentina/Buenos_Aires'
  const STORE = 'barberia:datos'
  const VERSION = 3

  const pad = (n) => String(n).padStart(2, '0')
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d) }
  const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
  const dow = (k) => parse(k).getDay()
  const weekStart = (k) => addDays(k, -((dow(k) + 6) % 7)) // lunes

  // Hora de Argentina, con el desfase de ?hora= si lo hay
  const arParts = () => {
    const p = {}
    for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())) p[x.type] = x.value
    return { day: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute }
  }
  let offset = 0
  const forced = new URLSearchParams(location.search).get('hora')
  if (/^\d{1,2}:\d{2}$/.test(forced || '')) { const [h, m] = forced.split(':').map(Number); offset = h * 60 + m - arParts().min }
  const now = () => {
    const p = arParts()
    let min = p.min + offset, day = p.day
    while (min < 0) { min += 1440; day = addDays(day, -1) }
    while (min >= 1440) { min -= 1440; day = addDays(day, 1) }
    return { day, min }
  }
  const stamp = () => { const n = now(); return `${n.day} ${hm(n.min)}` }

  // ——— Datos de ejemplo ———
  const BARBEROS = [
    { id: 'b1', nombre: 'Matías', color: '#3987e5', tel: '11 5512-3380' },
    { id: 'b2', nombre: 'Lucas', color: '#d95926', tel: '11 6241-0937' },
    { id: 'b3', nombre: 'Nico', color: '#199e70', tel: '11 4478-2215' },
    { id: 'b4', nombre: 'Facu', color: '#c98500', tel: '11 5390-6642' },
  ]
  const SERVICIOS = [
    { id: 's1', nombre: 'Corte', precio: 12000, dur: 30 },
    { id: 's2', nombre: 'Corte + barba', precio: 16000, dur: 45 },
    { id: 's3', nombre: 'Barba', precio: 7000, dur: 20 },
    { id: 's4', nombre: 'Degradé / fade', precio: 14000, dur: 40 },
    { id: 's5', nombre: 'Color / decoloración', precio: 30000, dur: 90 },
    { id: 's6', nombre: 'Corte niño', precio: 9000, dur: 30 },
  ]
  const EXTRAS = [
    { n: 'Lavado', p: 2000 },
    { n: 'Perfilado de cejas', p: 2500 },
    { n: 'Diseño / línea', p: 2000 },
    { n: 'Cera o producto', p: 4500 },
  ]
  const NOMBRES = ['Juan', 'Martín', 'Santiago', 'Tomás', 'Joaquín', 'Agustín', 'Franco', 'Lautaro', 'Ezequiel', 'Gonzalo', 'Federico', 'Leandro', 'Maximiliano', 'Rodrigo', 'Bruno', 'Ignacio', 'Ramiro', 'Emiliano', 'Gastón', 'Sebastián', 'Pablo', 'Diego', 'Hernán', 'Cristian', 'Damián', 'Nahuel', 'Iván', 'Mariano', 'Alejandro', 'Julián', 'Germán', 'Kevin', 'Lucio', 'Enzo', 'Lisandro', 'Ulises', 'Marcos', 'Andrés', 'Fernando', 'Claudio', 'Esteban', 'Gustavo', 'Alan', 'Brian', 'Jonathan']
  const CHICOS = ['Thiago', 'Benjamín', 'Bautista', 'Mateo', 'Ciro', 'Valentino', 'Felipe', 'Benicio', 'Santino', 'Lorenzo']
  const APELLIDOS = ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Giménez', 'Gutiérrez', 'Pereyra', 'Molina', 'Castro', 'Ortiz', 'Silva', 'Núñez', 'Rojas', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Ferreyra', 'Godoy', 'Morales', 'Domínguez', 'Moreno', 'Peralta', 'Vega', 'Carrizo', 'Quiroga', 'Ledesma', 'Paz', 'Ponce', 'Vera', 'Bianchi', 'Rossi', 'Ferrari']
  const NOTAS = ['Quiere mantener el largo arriba', 'Cliente fijo, cada 15 días', 'Pidió degradé bajo, número 1 a los costados', 'Viene con el hijo la próxima', 'Le recomendé cera mate', 'Llegó 10 min tarde', 'Barba en V, bien perfilada', 'Primera vez, vino por Instagram', 'Pagó con transferencia', 'Avisar si se libera un turno temprano']

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function seed() {
    const rnd = mulberry32(20261103)
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
    const chance = (p) => rnd() < p
    const between = (a, b) => a + Math.floor(rnd() * (b - a + 1))
    const weighted = (pairs) => { let r = rnd() * pairs.reduce((s, [, w]) => s + w, 0); for (const [v, w] of pairs) { if ((r -= w) < 0) return v } return pairs[0][0] }
    const tel = () => `11 ${pick(['4', '5', '6'])}${between(100, 999)}-${pad(between(0, 99))}${pad(between(0, 99))}`

    const clientes = []
    for (let i = 0; i < 150; i++) clientes.push({ nombre: `${pick(NOMBRES)} ${pick(APELLIDOS)}`, tel: tel() })
    const chicos = CHICOS.map((n) => ({ nombre: `${n} ${pick(APELLIDOS)}`, tel: tel() }))

    // Cómo carga cada uno: Matías al día, Facu se atrasa (para que se vea el control)
    const perfil = {
      b1: { olvidaPasado: 0.0, olvidaHoy: 0.15, tarde: 0.05, min: 8, max: 10, falta: 0.05 },
      b2: { olvidaPasado: 0.03, olvidaHoy: 0.3, tarde: 0.2, min: 7, max: 9, falta: 0.08 },
      b3: { olvidaPasado: 0.015, olvidaHoy: 0.25, tarde: 0.15, min: 6, max: 9, falta: 0.07 },
      b4: { olvidaPasado: 0.11, olvidaHoy: 0.75, tarde: 0.55, min: 6, max: 8, falta: 0.12 },
    }

    const { day: hoy, min: ahora } = now()
    const desde = addDays(weekStart(hoy), -21)
    const turnos = []
    const actividad = []
    let n = 0
    const id = () => 't' + (++n)

    for (let d = 0; d < 28; d++) {
      const fecha = addDays(desde, d)
      if (![2, 3, 4, 5, 6].includes(dow(fecha)) && fecha !== hoy) continue
      const esPasado = fecha < hoy
      const esHoy = fecha === hoy
      for (const b of BARBEROS) {
        const p = perfil[b.id]
        const meta = between(p.min, p.max)
        const viernesSabado = dow(fecha) >= 5
        let t = 600 + pick([0, 0, 15, 30])
        let hechos = 0
        while (hechos < meta) {
          const sid = weighted([['s1', 30], ['s2', 25], ['s4', 22], ['s3', 10], ['s6', 8], ['s5', 5]])
          const s = SERVICIOS.find((x) => x.id === sid)
          if (t + s.dur > 1200) break
          const fin = t + s.dur
          const pasado = esPasado || (esHoy && fin <= ahora)
          const sinReserva = (esPasado || (esHoy && t <= ahora)) && chance(0.06)
          const cli = sid === 's6' ? pick(chicos) : pick(clientes)
          const turno = {
            id: id(), barberoId: b.id, fecha, hora: t, dur: s.dur,
            cliente: sinReserva && chance(0.4) ? '' : cli.nombre, tel: sinReserva ? '' : cli.tel,
            servicioId: sid, hechoId: null, precio: s.precio, extras: [], estado: 'pendiente',
            nota: '', cargadoEn: null, cargadoPor: null, sinReserva,
            creadoEn: `${addDays(fecha, -between(0, 6))} ${hm(between(9, 22) * 60 + between(0, 59))}`,
          }
          const olvido = esHoy ? p.olvidaHoy : p.olvidaPasado
          if (pasado && !sinReserva && chance(olvido)) {
            // queda pendiente: turno pasado sin cargar
          } else if (pasado || (esHoy && sinReserva && t <= ahora)) {
            const r = rnd()
            if (sinReserva || r < 0.96 - p.falta) {
              turno.estado = 'atendido'
              turno.hechoId = sid
              if (sid === 's1' && chance(0.14)) turno.hechoId = 's2'
              if (sid === 's3' && chance(0.2)) turno.hechoId = 's2'
              const hecho = SERVICIOS.find((x) => x.id === turno.hechoId)
              turno.precio = hecho.precio
              if (chance(0.13)) turno.extras.push(pick(EXTRAS))
              if (chance(0.12)) turno.nota = pick(NOTAS)
            } else if (r < 0.96) {
              turno.estado = 'novino'
              if (chance(0.3)) turno.nota = pick(['No contestó el WhatsApp', 'Avisó tarde que no llegaba', 'Segunda vez que falta'])
            } else {
              turno.estado = 'cancelado'
            }
            let cuando = turno.estado === 'novino' ? t + between(15, 30) : fin + between(1, 18)
            if (chance(p.tarde)) cuando = esPasado ? between(1205, 1250) : Math.max(fin + 40, cuando + between(40, 120))
            if (turno.estado === 'cancelado') { cuando = Math.max(540, t - between(60, 180)) }
            if (esHoy && cuando > ahora) cuando = ahora
            turno.cargadoEn = `${fecha} ${hm(Math.min(cuando, 1439))}`
            turno.cargadoPor = b.id
          } else if (!pasado && chance(0.03)) {
            turno.estado = 'cancelado'
            // Cancelado antes de hoy (o hoy temprano): nunca con una hora futura
            turno.cargadoEn = ahora > 545 ? `${hoy} ${hm(between(540, Math.min(ahora, 1260)))}` : `${addDays(hoy, -1)} ${hm(between(720, 1260))}`
            turno.cargadoPor = b.id
          }
          turnos.push(turno)
          hechos++
          // Sigue: múltiplo de 15 + un hueco (más chico los viernes y sábados)
          t = Math.ceil(fin / 15) * 15 + (viernesSabado ? pick([0, 0, 0, 15, 15, 30]) : pick([0, 0, 15, 15, 30, 45, 60]))
        }
      }
    }

    for (const t of turnos) if (t.cargadoEn) actividad.push(entradaDe(t, t.estado === 'atendido' && t.sinReserva ? 'sinreserva' : t.estado, t.cargadoPor, t.cargadoEn))
    actividad.sort((a, b) => (a.ts < b.ts ? 1 : -1))

    return {
      v: VERSION, dia: hoy, seq: n,
      config: { nombre: 'Barbería Demo', dias: [2, 3, 4, 5, 6], abre: 600, cierra: 1200 },
      barberos: BARBEROS.map((b) => ({ ...b, activo: true })),
      servicios: SERVICIOS.map((s) => ({ ...s, activo: true })),
      turnos, actividad, aid: actividad.length,
    }
  }

  // Lo que se guarda en el registro es una foto: si después cambian nombres o precios, la línea queda igual
  function entradaDe(t, tipo, actor, ts, detalle) {
    const sid = t.hechoId || t.servicioId
    const serv = SERVICIOS.find((s) => s.id === sid) || {}
    return { id: 'a' + Math.random().toString(36).slice(2, 9), ts, actor, tipo, turnoId: t.id, cliente: t.cliente, servicio: serv.nombre, total: t.precio + t.extras.reduce((s, e) => s + e.p, 0), detalle: detalle || '' }
  }

  function load() {
    let data = null
    try { data = JSON.parse(localStorage.getItem(STORE)) } catch (e) {}
    const hoy = now().day
    if (!data || data.v !== VERSION || data.dia !== hoy) {
      const nombre = data && data.config && data.config.nombre
      const renovado = !!data
      data = seed()
      if (nombre) data.config.nombre = nombre
      data.renovado = renovado
      save(data)
    }
    return data
  }
  function save(data) { try { localStorage.setItem(STORE, JSON.stringify(data)) } catch (e) {} }
  function reset() { try { localStorage.removeItem(STORE) } catch (e) {} return load() }

  window.DB = { load, save, reset, now, stamp, EXTRAS, util: { pad, key, parse, addDays, hm, dow, weekStart } }
})()
