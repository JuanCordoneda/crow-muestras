/**
 * Lo que comparten todas las páginas públicas: idioma, textos y la reserva en curso. Va en un
 * contexto para no pasar props por cada componente.
 *
 * Todo lo que se pinta aquí se pinta también en Node, en el build (`scripts/pages.mjs`): nada
 * puede tocar `window` ni `document` fuera de un efecto.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { SiteLang } from '../shared/routing'
import type { Texts } from './content'

export type Site = {
  lang: SiteLang
  t: Texts
  /** El tratamiento que se ha pulsado en «Reservar»: el formulario lo trae ya elegido. */
  chosen: string
  /** Elige un tratamiento y baja hasta el formulario de reserva. */
  book: (treatmentId?: string) => void
}

export const SiteContext = createContext<Site | null>(null)

export function useSite(): Site {
  const site = useContext(SiteContext)
  if (!site) throw new Error('useSite fuera de PublicApp')
  return site
}

/** Se ha bajado de un punto: para la cabecera transparente sobre la portada. */
export function useScrolledPast(offset: number) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setPast(window.scrollY > offset)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [offset])
  return past
}
