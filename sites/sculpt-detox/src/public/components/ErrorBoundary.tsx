import { Component, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { langOfPath } from '../../shared/routing'
import { BUSINESS, whatsappUrl } from '../business'
import { textsFor } from '../content'
import { WhatsAppIcon } from './Brand'

type Props = { children: ReactNode }
type State = { failed: boolean }

/**
 * Red de seguridad: si algo revienta, el visitante no se queda mirando una pantalla en blanco.
 * Ve el WhatsApp de Michele, que es lo único que de verdad necesita para pedir cita, y un botón
 * para reintentar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[web]', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    const t = textsFor(langOfPath(window.location.pathname))
    return (
      <div className="crash">
        <h1>{t.error.title}</h1>
        <p>{t.error.text}</p>
        <div className="crash-actions">
          <a className="btn btn-primary btn-lg" href={whatsappUrl(t.wa.generic)}><WhatsAppIcon size={19} /> {BUSINESS.phone}</a>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}><RotateCcw size={18} /> {t.error.retry}</button>
        </div>
      </div>
    )
  }
}
