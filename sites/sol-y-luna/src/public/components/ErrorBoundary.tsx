import { Component, type ReactNode } from 'react'
import { Phone, RotateCcw } from 'lucide-react'
import { detectLang } from '../../shared/i18n'
import { EL_SOL } from '../venues'
import { telLink } from '../../shared/utils'
import { textsFor } from '../content'

type Props = { children: ReactNode }
type State = { failed: boolean }

/**
 * Red de seguridad: si algo revienta, el visitante no se queda mirando una pantalla en blanco.
 * Ve el teléfono del restaurante, que es lo único que de verdad necesita, y un botón para reintentar.
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
    const t = textsFor(detectLang())
    const phone = EL_SOL.phone ?? ''
    return (
      <div className="crash">
        <h1>{t.error.title}</h1>
        <p>{t.error.text}</p>
        <div className="crash-actions">
          <a className="btn btn-primary btn-lg" href={telLink(phone)}><Phone size={19} /> {phone}</a>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}><RotateCcw size={18} /> {t.error.retry}</button>
        </div>
      </div>
    )
  }
}
