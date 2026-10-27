import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CreditCard, Minus, Plus } from 'lucide-react'
import { ATELIE, findSession, sessionId, upcomingSessions } from '../agenda'
import { openWhatsApp, track } from '../business'
import { euros, sessionLabel } from '../format'
import { useSite } from '../site'
import { SITE_LANGS, type SiteLang } from '../../shared/routing'
import { cx } from '../../shared/utils'
import { WhatsAppIcon } from './Brand'

type Gift = '' | 'yes' | 'no'
type Field = 'session' | 'people' | 'name' | 'phone' | 'gift'

/** «Outra data»: quien no encuentra la suya reserva igual y la combina con Janaína. */
const OTHER = 'outra'

/**
 * Nombre y teléfono se recuerdan en el propio teléfono del visitante: quien vuelve para reservar
 * otra fecha (o un vale-presente) no los escribe dos veces. Solo ahí, nunca se envían a ningún sitio.
 */
const CONTACT_KEY = 'parisabor:contato'
const loadContact = (): { name: string; phone: string } | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? 'null')
    return saved && typeof saved.name === 'string' && typeof saved.phone === 'string' ? saved : null
  } catch {
    return null
  }
}
const saveContact = (name: string, phone: string) => {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ name, phone }))
  } catch {
    /* sin almacenamiento (modo privado): la próxima vez se escriben de nuevo */
  }
}

/**
 * La reserva no pasa por ningún servidor: el formulario arma el mensaje y abre WhatsApp con él
 * escrito, en el idioma en que se está leyendo la web. Janaína confirma desde su teléfono.
 */
export function BookingForm() {
  const { t, lang, chosen } = useSite()
  const copy = t.booking
  const sessions = upcomingSessions()
  const [session, setSession] = useState(chosen?.id ?? '')
  const [people, setPeople] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<SiteLang>(lang)
  const [gift, setGift] = useState<Gift>('')
  const [tried, setTried] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  const [remembered, setRemembered] = useState(false)

  /** «Reservar» en una fecha la trae ya elegida. */
  useEffect(() => { if (chosen) setSession(chosen.id) }, [chosen])
  /** Los datos de la última visita se ponen en el navegador, no en el HTML del build. */
  useEffect(() => {
    const saved = loadContact()
    if (!saved) return
    setName((current) => current || saved.name)
    setPhone((current) => current || saved.phone)
    setRemembered(true)
  }, [])

  const picked = session && session !== OTHER ? findSession(session) : undefined
  const tooMany = Boolean(picked) && people > (picked?.left ?? 0)

  const errors: Partial<Record<Field, string>> = {}
  if (!session) errors.session = copy.errors.session
  if (tooMany) errors.people = copy.errors.people
  if (!name.trim()) errors.name = copy.errors.name
  if (phone.replace(/\D/g, '').length < 6) errors.phone = copy.errors.phone
  if (!gift) errors.gift = copy.errors.gift
  const shown = tried ? errors : {}

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    const firstError = (['session', 'people', 'name', 'phone', 'gift'] as Field[]).find((field) => errors[field])
    if (firstError) {
      form.current?.querySelector<HTMLElement>(`[data-field="${firstError}"]`)?.focus()
      return
    }
    const message = copy.message({
      session: picked ? sessionLabel(picked, lang) : copy.otherDate,
      people: String(people),
      name: name.trim(),
      phone: phone.trim(),
      language: copy.langNames[language],
      gift: gift === 'yes' ? copy.yes : copy.no,
    })
    saveContact(name.trim(), phone.trim())
    track('whatsapp_click', { source: 'formulario', session, people: String(people), lang })
    openWhatsApp(message)
  }

  const described = (field: Field) => (shown[field] ? `booking-${field}-error` : undefined)
  const error = (field: Field) => shown[field] && <p className="field-error" id={`booking-${field}-error`}>{shown[field]}</p>

  return (
    <form className="booking-form" ref={form} onSubmit={submit} noValidate>
      <div className={cx('field', shown.session && 'is-invalid')}>
        <label htmlFor="booking-session">{copy.session}</label>
        <select
          id="booking-session"
          data-field="session"
          value={session}
          onChange={(event) => setSession(event.currentTarget.value)}
          aria-invalid={Boolean(shown.session)}
          aria-describedby={described('session')}
        >
          <option value="">{copy.sessionPlaceholder}</option>
          {sessions.map((entry) => (
            <option key={sessionId(entry)} value={sessionId(entry)} disabled={entry.left <= 0}>
              {sessionLabel(entry, lang)}{entry.left <= 0 ? ` (${copy.full})` : ''}
            </option>
          ))}
          <option value={OTHER}>{copy.otherDate}</option>
        </select>
        {error('session')}
        {picked && picked.left > 0 && !shown.session && <p className={cx('field-hint', picked.left <= 3 && 'is-urgent')}>{copy.sessionLeft(picked.left)}</p>}
      </div>

      <div className={cx('field', (shown.people || tooMany) && 'is-invalid')}>
        <span className="field-label" id="booking-people-label">{copy.people}</span>
        <div className="stepper" role="group" aria-labelledby="booking-people-label">
          <button type="button" onClick={() => setPeople((count) => Math.max(1, count - 1))} disabled={people <= 1} aria-label={copy.fewer}><Minus size={18} /></button>
          <output data-field="people" tabIndex={-1} aria-live="polite" aria-describedby={tooMany ? 'booking-people-error' : undefined}>
            {copy.peopleUnit(people)}
          </output>
          <button type="button" onClick={() => setPeople((count) => Math.min(ATELIE.maxPeople, count + 1))} disabled={people >= ATELIE.maxPeople} aria-label={copy.more}><Plus size={18} /></button>
        </div>
        <p className="field-hint">{copy.total(euros(ATELIE.price * people, lang))}</p>
        {tooMany && picked && <p className="field-error" id="booking-people-error">{copy.overLimit(picked.left)}</p>}
        {people >= ATELIE.maxPeople && <p className="field-hint"><a href="#grupos">{copy.groupHint}</a></p>}
      </div>

      <div className={cx('field', shown.name && 'is-invalid')}>
        <label htmlFor="booking-name">{copy.name}</label>
        <input
          id="booking-name"
          data-field="name"
          type="text"
          autoComplete="name"
          placeholder={copy.namePlaceholder}
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.currentTarget.value)}
          aria-invalid={Boolean(shown.name)}
          aria-describedby={described('name')}
        />
        {error('name')}
        {remembered && !shown.name && <p className="field-hint">{copy.remembered}</p>}
      </div>

      <div className={cx('field', shown.phone && 'is-invalid')}>
        <label htmlFor="booking-phone">{copy.phone}</label>
        <input
          id="booking-phone"
          data-field="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={copy.phonePlaceholder}
          value={phone}
          maxLength={30}
          onChange={(event) => setPhone(event.currentTarget.value)}
          aria-invalid={Boolean(shown.phone)}
          aria-describedby={described('phone')}
        />
        {error('phone')}
      </div>

      <fieldset className="field choice">
        <legend>{copy.language}</legend>
        <div className="choice-row is-three">
          {SITE_LANGS.map((code) => (
            <label key={code} className={cx('choice-option', language === code && 'is-on')}>
              <input type="radio" name="language" value={code} checked={language === code} onChange={() => setLanguage(code)} />
              <span>{copy.langNames[code]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={cx('field', 'choice', shown.gift && 'is-invalid')} aria-describedby={described('gift')}>
        <legend>{copy.gift}</legend>
        <div className="choice-row">
          {(['yes', 'no'] as const).map((value, index) => (
            <label key={value} className={cx('choice-option', gift === value && 'is-on')}>
              <input type="radio" name="gift" value={value} checked={gift === value} onChange={() => setGift(value)} data-field={index === 0 ? 'gift' : undefined} />
              <span>{value === 'yes' ? copy.yes : copy.no}</span>
            </label>
          ))}
        </div>
        {error('gift')}
      </fieldset>

      <button type="submit" className="btn btn-primary btn-lg btn-block">
        <WhatsAppIcon size={20} /> {copy.submit}
      </button>
      <p className="booking-note">{copy.note}</p>

      {/* Pago online: apagado hasta que haya enlace de Stripe (`ATELIE.payment` en agenda.ts). */}
      {ATELIE.payment.enabled && (
        <div className="booking-pay">
          <strong>{copy.payTitle}</strong>
          <a className="btn btn-ghost btn-block" href={ATELIE.payment.url} target="_blank" rel="noopener noreferrer" onClick={() => track('pay_click', { session, lang })}>
            <CreditCard size={18} /> {copy.pay}
          </a>
          <small>{copy.payNote}</small>
        </div>
      )}
    </form>
  )
}
