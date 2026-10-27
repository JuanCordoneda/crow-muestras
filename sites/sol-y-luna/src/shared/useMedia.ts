import { useEffect, useState } from 'react'

/** Escucha una media query del navegador y devuelve si se cumple ahora mismo. */
export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

/** El punto en el que la web pasa a la disposición de móvil. */
export const useIsMobile = () => useMedia('(max-width: 760px)')

/*
 * Congelar el fondo.
 *
 * `overflow: hidden` en el body no vale: Safari en iPhone lo ignora, y al deslizar dentro de una
 * hoja (la ficha de un plato, el cajón) se desplazaba la página de detrás. Lo que sí respeta es un
 * body fijo, desplazado hacia arriba lo que se había bajado para que no se note el salto.
 *
 * Lleva la cuenta de cuántos lo piden: el «¿descartar los cambios?» es un segundo modal dentro de
 * la ficha, y cuando se cierran los dos a la vez el de dentro se limpia el último. Sin la cuenta,
 * devolvía el body fijado que había guardado y la página se quedaba congelada.
 */
let locks = 0
let saved: { scroll: number; position: string; top: string; width: string } | null = null

const lock = () => {
  locks += 1
  if (locks > 1) return
  const { body } = document
  const scroll = window.scrollY
  saved = { scroll, position: body.style.position, top: body.style.top, width: body.style.width }
  body.style.position = 'fixed'
  body.style.top = `-${scroll}px`
  body.style.width = '100%'
}

const unlock = () => {
  locks = Math.max(0, locks - 1)
  if (locks > 0 || !saved) return
  const { body, documentElement: html } = document
  body.style.position = saved.position
  body.style.top = saved.top
  body.style.width = saved.width
  /*
   * La web desliza suave al saltar a una sección (`scroll-behavior: smooth`); aquí no, o al cerrar
   * cada plato la página viajaría desde arriba hasta donde se estaba. Se vuelve de golpe.
   */
  const behavior = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, saved.scroll)
  html.style.scrollBehavior = behavior
  saved = null
}

/** Congela el fondo mientras `active`: un panel a pantalla completa, una hoja, un modal. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
