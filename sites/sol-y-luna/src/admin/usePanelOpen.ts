/**
 * Qué tarjetas de la Carta están desplegadas, recordado en este teléfono.
 *
 * El horario y las ofertas van arriba porque son lo que más se mira, pero en un móvil ocupan la
 * pantalla entera y dejan los platos a dos pantallazos de scroll: en pleno servicio, marcar un
 * plato agotado no puede costar eso. Plegadas enseñan su resumen —el estado de hoy, cuántas
 * ofertas salen— y se abren cuando hace falta. Cada teléfono recuerda las suyas, como las
 * secciones de la carta: la cocina y la sala no abren lo mismo.
 */
import { useCallback, useState } from 'react'

const KEY = 'mexiandco:admin-paneles'

export type PanelId = 'horario' | 'ofertas'

/** De fábrica, las dos abiertas: quien entra por primera vez tiene que ver que están ahí. */
const DEFAULT: Record<PanelId, boolean> = { horario: true, ofertas: true }

const read = (): Record<PanelId, boolean> => {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? (JSON.parse(raw) as Partial<Record<PanelId, boolean>>) : null
    if (!data || typeof data !== 'object') return DEFAULT
    return { horario: data.horario ?? DEFAULT.horario, ofertas: data.ofertas ?? DEFAULT.ofertas }
  } catch {
    return DEFAULT
  }
}

export function usePanelOpen() {
  const [open, setOpen] = useState(read)

  const toggle = useCallback((panel: PanelId) => {
    setOpen((previous) => {
      const next = { ...previous, [panel]: !previous[panel] }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* sin almacenamiento, lo recuerda mientras dure la pestaña */
      }
      return next
    })
  }, [])

  return { open, toggle }
}
