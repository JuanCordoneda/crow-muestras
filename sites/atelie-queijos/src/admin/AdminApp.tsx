/**
 * Panel de El Puerto. Lo usan el dueño y la sala desde el móvil, muchas veces en pleno servicio:
 * todo está pensado para una mano, pantalla de 360 px y cobertura irregular.
 *
 * Dos pestañas (Carta y Ajustes) en una barra abajo, donde llega el pulgar; en el ordenador la
 * misma navegación pasa a una columna a la izquierda.
 *
 * La agenda de reservas está apagada: las reservas las lleva Restoo, fuera de esta web, así que el
 * panel solo enseñaba las que alguien apuntase a mano. Está comentada, no borrada —la vista, el
 * hook y la API siguen en el repositorio—, para poder encenderla el día que las reservas vuelvan
 * aquí: se descomentan los trozos marcados con «AGENDA» y se devuelve `'reservas'` a `AdminRoute`.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Check, CloudOff, ExternalLink, LoaderCircle, LogOut, EllipsisVertical, RefreshCw, Settings as SettingsIcon, TriangleAlert, UtensilsCrossed,
} from 'lucide-react'
// AGENDA: import { CalendarDays } from 'lucide-react'
// AGENDA: import type { Reservation } from '../shared/types'
import { checkSession, signOut, type Session } from '../shared/api'
import { ConfirmDialog, Dropdown, Toasts, type ConfirmRequest } from '../shared/components/Ui'
// AGENDA: import { madridNow } from '../shared/hours'
import { adminRoute, linkTo, navigate, publicRoute, type AdminRoute } from '../shared/routing'
import { cx } from '../shared/utils'
import { Brand } from './components/Brand'
import { Login } from './components/Login'
import { withTimeout } from './helpers'
// AGENDA: import { dayLabel } from './helpers'
import { useKeyboardOpen, useToasts } from './hooks'
import { useGoogleHours } from './useGoogleHours'
import { useMenuSync, type SaveState } from './useMenuSync'
import { clearReservationCache } from './useReservations'
// AGENDA: import { useReservations } from './useReservations'
import { GoogleHoursModal } from './components/GoogleHoursModal'
import { MenuView } from './views/MenuView'
// AGENDA: import { ReservationsView } from './views/ReservationsView'
import { SettingsView } from './views/SettingsView'
import './admin.css'

type Gate = 'checking' | 'login' | 'open'

const TITLES: Record<AdminRoute['view'], string> = { carta: 'Carta', ajustes: 'Ajustes' }

const SAVE_TEXT: Record<Exclude<SaveState, 'idle'>, { short: string; long: string }> = {
  saving: { short: 'Guardando…', long: 'Guardando…' },
  saved: { short: 'Guardado', long: 'Guardado' },
  offline: { short: 'Sin conexión', long: 'Sin conexión · se guardará al volver' },
  error: { short: 'Error al guardar', long: 'Error al guardar' },
}

function SaveStatus({ state, pending, long }: { state: SaveState; pending: boolean; long?: boolean }) {
  if (state === 'idle') return null
  const text = SAVE_TEXT[state]
  const icon = state === 'saving' ? <LoaderCircle size={16} className="adm-spin" /> : state === 'saved' ? <Check size={16} /> : state === 'offline' ? <CloudOff size={16} /> : <TriangleAlert size={16} />
  // «se guardará al volver» solo tiene sentido si de verdad hay algo esperando.
  const label = state === 'offline' && !pending ? 'Sin conexión' : long ? text.long : text.short
  return (
    <span className={cx('adm-save', `is-${state}`)} title={state === 'offline' && pending ? text.long : label}>
      {icon}
      <span className="adm-save-text">{label}</span>
    </span>
  )
}

export function AdminApp({ route }: { route: AdminRoute }) {
  const [gate, setGate] = useState<Gate>('checking')
  const [session, setSession] = useState<Session | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const { toasts, push: toast, dismiss } = useToasts()
  const keyboard = useKeyboardOpen()

  /** La contraseña guardada dejó de valer (la cambiaron en el servidor): se vuelve a pedir. */
  const onUnauthorized = useCallback(() => {
    signOut()
    setGate('login')
  }, [])

  /* AGENDA: el aviso de reserva nueva, con su zumbido — el teléfono suele estar en el bolsillo.
  const onArrival = useCallback((reservation: Reservation) => {
    const today = madridNow().date
    toast(`Nueva reserva: ${reservation.name || 'sin nombre'}, ${dayLabel(reservation.date, today).toLowerCase()} ${reservation.time}`)
    try {
      navigator.vibrate?.(200)
    } catch {
      /* hay navegadores que lo exponen y lo prohíben *\/
    }
  }, [toast])
  */

  const menuSync = useMenuSync({ enabled: gate === 'open', onUnauthorized })
  /** Cambiar el horario aquí no lo cambia en la ficha de Google: el aviso está para que no se olvide. */
  const google = useGoogleHours({ settings: menuSync.menu.settings, ready: menuSync.ready })
  // AGENDA: const reservations = useReservations({ enabled: gate === 'open', onUnauthorized, onArrival })

  /**
   * ¿Hace falta contraseña? Si el servidor no contesta se entra igual con los datos de este
   * teléfono: en plena cena es mejor ver la carta de hace un rato que una pantalla de error.
   * Si luego resulta que la pide, la primera petición con 401 trae de vuelta la puerta.
   */
  useEffect(() => {
    let cancelled = false
    withTimeout(checkSession(), 8000)
      .then((result) => {
        if (cancelled) return
        setSession(result)
        setGate(result.required && !result.ok ? 'login' : 'open')
      })
      .catch(() => { if (!cancelled) setGate('open') })
    return () => { cancelled = true }
  }, [])

  /**
   * El panel no se indexa, se ve en el color de la marca en la barra del sistema y lleva el
   * título de la pestaña: con la web y el panel abiertos a la vez hay que distinguirlos.
   */
  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousTheme = theme?.content
    if (theme) theme.content = '#2f2590'
    // El acceso directo arranca donde dice el manifiesto: con el de la web, abriría la portada.
    // El servidor ya lo sirve cambiado en /admin; esto cubre llegar aquí sin recargar la página.
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const previousManifest = manifest?.getAttribute('href')
    manifest?.setAttribute('href', '/admin.webmanifest')
    const appTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')
    const previousAppTitle = appTitle?.content
    if (appTitle) appTitle.content = 'Panel'
    const previousTitle = document.title
    const previousLang = document.documentElement.lang
    document.documentElement.lang = 'es'
    return () => {
      robots.remove()
      if (theme && previousTheme !== undefined) theme.content = previousTheme
      if (manifest && previousManifest) manifest.setAttribute('href', previousManifest)
      if (appTitle && previousAppTitle !== undefined) appTitle.content = previousAppTitle
      document.title = previousTitle
      document.documentElement.lang = previousLang
    }
  }, [])

  useEffect(() => {
    document.title = `${TITLES[route.view]} · Panel de El Puerto`
  }, [route.view])

  const doSignOut = () => {
    signOut()
    clearReservationCache()
    setSession(null)
    setGate('login')
  }

  const retry = () => {
    // AGENDA: void reservations.refresh(true)
    menuSync.retry()
  }

  if (gate === 'checking') {
    return <div className="route-loading" role="status" aria-live="polite"><span className="route-spinner" /><span className="sr-only">Abriendo el panel…</span></div>
  }
  if (gate === 'login') {
    return <Login restaurant={menuSync.menu.settings.name} onDone={() => { setSession({ required: true, ok: true }); setGate('open') }} />
  }

  const offline = menuSync.state === 'offline'
  const saveError = menuSync.state === 'error'

  const tabs: { view: AdminRoute['view']; label: string; icon: ReactNode; badge?: number }[] = [
    // AGENDA: { view: 'reservas', label: 'Reservas', icon: <CalendarDays size={24} aria-hidden="true" />, badge: pendingCount },
    { view: 'carta', label: 'Carta', icon: <UtensilsCrossed size={24} aria-hidden="true" /> },
    { view: 'ajustes', label: 'Ajustes', icon: <SettingsIcon size={24} aria-hidden="true" /> },
  ]

  return (
    <div className={cx('adm', `adm-on-${route.view}`, keyboard && 'is-typing')}>
      <header className="adm-top">
        <a className="adm-top-brand" {...linkTo(adminRoute({ view: 'carta' }))} aria-label="El Puerto · Panel: ir a la carta"><Brand /></a>
        <SaveStatus state={menuSync.state} pending={menuSync.pending} />
        <Dropdown className="adm-icon-btn adm-top-menu" align="right" label={<><EllipsisVertical size={22} aria-hidden="true" /><span className="sr-only">Menú</span></>}>
          {(close) => (
            <>
              <button type="button" onClick={() => { close(); retry() }}><RefreshCw size={18} /> Actualizar datos</button>
              <button type="button" onClick={() => { close(); navigate(publicRoute({ view: 'inicio' })) }}><ExternalLink size={18} /> Ver la web</button>
              {session?.required !== false && (
                <button type="button" onClick={() => { close(); navigate(adminRoute({ view: 'ajustes' })); window.setTimeout(() => document.getElementById('ajustes-sesion')?.scrollIntoView({ block: 'start' }), 60) }}>
                  <LogOut size={18} /> Cerrar sesión…
                </button>
              )}
            </>
          )}
        </Dropdown>
      </header>

      <nav className="adm-nav" aria-label="Secciones del panel">
        <div className="adm-nav-brand"><Brand /></div>
        <ul>
          {tabs.map((tab) => (
            <li key={tab.view}>
              <a className={cx('adm-tab', route.view === tab.view && 'is-on')} aria-current={route.view === tab.view ? 'page' : undefined} {...linkTo(adminRoute({ view: tab.view }))}>
                <span className="adm-tab-icon">
                  {tab.icon}
                  {tab.badge ? <span className="adm-badge">{tab.badge > 99 ? '99+' : tab.badge}<span className="sr-only"> pendientes</span></span> : null}
                </span>
                <span className="adm-tab-label">{tab.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="adm-nav-foot">
          <SaveStatus state={menuSync.state} pending={menuSync.pending} long />
          <a className="adm-nav-link" {...linkTo(publicRoute({ view: 'inicio' }))}><ExternalLink size={18} aria-hidden="true" /> Ver la web</a>
        </div>
      </nav>

      <main className="adm-main">
        {(offline || saveError) && (
          <div className={cx('adm-banner', saveError && !offline && 'is-error')} role="status">
            {saveError && !offline ? <TriangleAlert size={20} aria-hidden="true" /> : <CloudOff size={20} aria-hidden="true" />}
            <p>
              {saveError && !offline
                ? 'Error al guardar la carta. Los cambios siguen en este teléfono.'
                : menuSync.pending
                  ? 'Sin conexión · los cambios de la carta se guardarán al volver. Estás viendo los últimos datos de este teléfono.'
                  : 'Sin conexión con el servidor. Estás viendo los últimos datos guardados en este teléfono.'}
            </p>
            <button type="button" className="btn btn-white btn-sm" onClick={retry}>Reintentar</button>
          </div>
        )}

        {/* AGENDA:
        {route.view === 'reservas' && (
          <ReservationsView api={reservations} menu={menuSync.menu} date={date} onDate={setDate} toast={toast} confirm={setConfirmRequest} />
        )}
        */}
        {route.view === 'carta' && (
          <MenuView menu={menuSync.menu} ready={menuSync.ready} commit={menuSync.commit} toast={toast} confirm={setConfirmRequest} google={google} />
        )}
        {route.view === 'ajustes' && (
          <SettingsView
            menu={menuSync.menu}
            ready={menuSync.ready}
            commit={menuSync.commit}
            saveState={menuSync.state}
            pendingChanges={menuSync.pending}
            session={session}
            toast={toast}
            confirm={setConfirmRequest}
            onSignOut={doSignOut}
          />
        )}
      </main>

      {google.asking && google.pending && (
        <GoogleHoursModal pending={google.pending} settings={menuSync.menu.settings} onDone={google.done} onLater={google.later} />
      )}
      {confirmRequest && <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
