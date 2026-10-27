/**
 * Lo que comparten todas las páginas públicas: idioma, textos, ajustes publicados y la hora de
 * París. Va en un contexto para no pasar seis props por cada componente.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang, Menu } from '../shared/types'
import { madridNow, type Now } from '../shared/hours'
import type { Texts } from './content'

export type Site = {
  lang: Lang
  t: Texts
  menu: Menu
  now: Now
  setLang: (lang: Lang) => void
}

export const SiteContext = createContext<Site | null>(null)

export function useSite(): Site {
  const site = useContext(SiteContext)
  if (!site) throw new Error('useSite fuera de PublicApp')
  return site
}

/**
 * La hora de Mallorca, al minuto. Se recalcula al volver a la pestaña: un teléfono que estuvo
 * horas en el bolsillo no puede seguir diciendo «abierto ahora».
 */
export function useMadridNow(): Now {
  const [now, setNow] = useState(madridNow)
  useEffect(() => {
    const tick = () => setNow((previous) => {
      const next = madridNow()
      return next.date === previous.date && next.minutes === previous.minutes ? previous : next
    })
    const timer = window.setInterval(tick, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}

/** Se ha bajado de un punto: para la cabecera transparente sobre la portada y la barra de acciones. */
export function useScrolledPast(offset: number) {
  const [past, setPast] = useState(() => typeof window !== 'undefined' && window.scrollY > offset)
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
