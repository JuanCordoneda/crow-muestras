/**
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  AGENDA DEL ATELIÊ: el único archivo que hay que tocar para cambiar fechas, plazas y precio.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Cada sesión es una línea: el día (`AAAA-MM-DD`), la hora de París (`HH:MM`) y las plazas que
 * quedan libres. Con eso la web pinta la lista de «Próximas datas», el desplegable del formulario
 * y la próxima sesión del héroe y de la página de links.
 *
 * - Las sesiones que ya han pasado desaparecen solas: no hace falta borrarlas el mismo día.
 * - `left: 0` la marca como «Esgotado» y ofrece la lista de espera por WhatsApp.
 * - El orden da igual: se ordenan por fecha.
 * - Tras cambiar algo: `npm run build` y desplegar (con hacer push se despliega).
 *
 * PENDIENTE: las fechas de abajo son de ejemplo (jueves a las 18h30 y sábados a las 11h de las
 * cuatro semanas siguientes a la entrega, octubre-noviembre de 2026). Hay que sustituirlas por las
 * reales de Janaína.
 */
export const SESSIONS: Session[] = [
  { date: '2026-10-29', time: '18:30', left: 3 },
  { date: '2026-10-31', time: '11:00', left: 5 },
  { date: '2026-11-05', time: '18:30', left: 8 },
  { date: '2026-11-07', time: '11:00', left: 2 },
  { date: '2026-11-12', time: '18:30', left: 6 },
  { date: '2026-11-14', time: '11:00', left: 8 },
  { date: '2026-11-19', time: '18:30', left: 4 },
  { date: '2026-11-21', time: '11:00', left: 8 },
]

export const ATELIE = {
  /** Euros por persona. */
  price: 98,
  /** Duración en minutos (sale como «1h30»). */
  duration: 90,
  /** Plazas por sesión: el formulario no deja pedir más. */
  maxPeople: 8,
  /**
   * Botón «Pagar online» bajo el formulario. Apagado hasta tener el enlace de pago de Stripe
   * (Stripe → Payment Links → crear uno de 98 € con cantidad ajustable de 1 a 8). Para
   * encenderlo: pegar el enlace en `url` y poner `enabled: true`.
   */
  payment: {
    enabled: false,
    url: 'https://buy.stripe.com/PLACEHOLDER',
  },
}

/* ───────────────────────── De aquí para abajo no hace falta tocar nada. ───────────────────────── */

export type Session = {
  /** `AAAA-MM-DD`, en el calendario de París. */
  date: string
  /** `HH:MM`, hora de París. */
  time: string
  /** Plazas libres. 0 = esgotado. */
  left: number
}

/** Identificador estable de una sesión: lo que viaja del botón «Reservar» al formulario. */
export const sessionId = (session: Session) => `${session.date}T${session.time}`

/** Ahora mismo en París, como `AAAA-MM-DDTHH:MM`, para compararlo con las sesiones. */
const parisNow = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Las sesiones que aún no han empezado, por orden de fecha. */
export function upcomingSessions(): Session[] {
  const now = parisNow()
  return SESSIONS
    .filter((session) => /^\d{4}-\d{2}-\d{2}$/.test(session.date) && /^\d{2}:\d{2}$/.test(session.time))
    .filter((session) => sessionId(session) > now)
    .sort((a, b) => sessionId(a).localeCompare(sessionId(b)))
}

/** La próxima sesión con plazas: la que se anuncia en el héroe y en la página de links. */
export const nextOpenSession = () => upcomingSessions().find((session) => session.left > 0)

export const findSession = (id: string) => SESSIONS.find((session) => sessionId(session) === id)
