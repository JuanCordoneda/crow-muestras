import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../shared/utils'

type Props = {
  id: string
  icon: ReactNode
  title: string
  /** Qué es la tarjeta. Se lee cuando está abierta. */
  lead: string
  /** Lo que hay dentro, dicho en una línea. Es lo que se lee plegada, y muchas veces basta. */
  summary: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

/**
 * Tarjeta plegable de la Carta. El cabezal es el botón: en un móvil, un triángulo de 20 px al
 * borde derecho se falla, y la cabecera entera son 60 px de ancho completo.
 *
 * Plegada no esconde el dato, lo resume: «Abierto · hasta las 22:00», «2 esta semana · 1 este mes».
 * La mitad de las veces el restaurante abre el panel solo para eso y no necesita desplegar nada.
 */
export function PanelCard({ id, icon, title, lead, summary, open, onToggle, children, className }: Props) {
  return (
    <section className={cx('adm-card adm-panel', open && 'is-open', className)} aria-labelledby={`${id}-title`}>
      <h2 className="adm-panel-h2" id={`${id}-title`}>
        <button type="button" className="adm-panel-head" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
          <span className="adm-card-ico" aria-hidden="true">{icon}</span>
          <span className="adm-panel-text">
            <strong>{title}</strong>
            <small>{open ? lead : summary}</small>
          </span>
          <ChevronDown size={22} className="adm-chevron" aria-hidden="true" />
        </button>
      </h2>
      {open && <div className="adm-panel-body" id={`${id}-body`}>{children}</div>}
    </section>
  )
}
