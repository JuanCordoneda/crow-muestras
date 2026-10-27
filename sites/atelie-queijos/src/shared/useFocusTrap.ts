import { useEffect, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Mantiene el foco dentro de un panel que tapa la página (una hoja, la galería, el cajón).
 *
 * Sin esto, el tabulador se escapa a los enlaces de detrás: siguen estando ahí, pero tapados por el
 * velo y con la página bloqueada, así que quien navega con teclado acaba moviéndose a ciegas.
 * Al cerrar, el foco vuelve a donde estaba antes de abrir.
 */
export function useFocusTrap(panel: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    const opener = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel.current)?.focus?.()

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const options = [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
      if (!options.length) return
      const edge = event.shiftKey ? options[0] : options[options.length - 1]
      const target = event.shiftKey ? options[options.length - 1] : options[0]
      if (document.activeElement === edge || !panel.current?.contains(document.activeElement)) {
        event.preventDefault()
        target.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // El foco vuelve al botón que abrió el panel, si sigue en la página.
      if (opener?.isConnected) opener.focus()
    }
  }, [panel, active])
}
