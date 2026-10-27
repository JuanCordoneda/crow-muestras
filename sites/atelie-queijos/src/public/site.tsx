/**
 * Lo que comparten todas las páginas públicas: idioma, textos y la sesión elegida para reservar.
 * Va en un contexto para no pasar props por cada componente.
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
  /**
   * La sesión que se ha pulsado en «Reservar» (`AAAA-MM-DDTHH:MM`): el formulario la trae elegida.
   * Lleva la hora del clic para que pulsar dos veces la misma fecha (tras cambiarla a mano en el
   * desplegable) la vuelva a elegir.
   */
  chosen: { id: string; at: number } | null
  /** Elige una sesión (si se pasa) y baja hasta el formulario de reserva. */
  book: (sessionId?: string) => void
  /** Avisa a la analítica de un clic que abre WhatsApp, con el sitio desde el que se pulsó. */
  onWhatsApp: (source: string) => () => void
}

export const SiteContext = createContext<Site | null>(null)

export function useSite(): Site {
  const site = useContext(SiteContext)
  if (!site) throw new Error('useSite fuera de PublicApp')
  return site
}

/** Se ha bajado de un punto: para la cabecera transparente sobre la portada y la barra de acciones. */
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
