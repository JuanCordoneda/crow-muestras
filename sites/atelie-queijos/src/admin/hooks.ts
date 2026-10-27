import { useCallback, useEffect, useRef, useState } from 'react'
import type { Toast } from '../shared/components/Ui'
import { uid } from '../shared/utils'

/**
 * La hora actual, refrescada cada `interval` ms. Hace que «Actualizado hace 2 min» y la marca
 * de «Nueva» caduquen solas aunque no llegue ningún dato nuevo.
 */
export function useNow(interval = 20_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval)
    // Al volver al panel tras un rato en otra app el reloj se pone al día en el acto.
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(Date.now()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [interval])
  return now
}

/**
 * ¿Está abierto el teclado del móvil? Se deduce de la altura visible: si encoge más de un cuarto
 * respecto a la mayor vista, es el teclado. Mirar solo el foco no vale: en Android el botón de
 * atrás cierra el teclado sin quitar el foco, y la barra de pestañas se quedaría escondida.
 */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    let tallest = Math.max(window.innerHeight, viewport.height)
    const update = () => {
      tallest = Math.max(tallest, window.innerHeight, viewport.height)
      const editing = document.activeElement instanceof HTMLElement && document.activeElement.matches('input, textarea, select')
      setOpen(editing && viewport.height < tallest * 0.75)
    }
    // El foco pasa de un campo a otro con un instante sin foco: se mira cuando ya ha llegado.
    let timer = 0
    const later = (delay: number) => { window.clearTimeout(timer); timer = window.setTimeout(update, delay) }
    const onFocus = () => later(60)
    // Al girar el teléfono cambia la referencia de altura.
    const onRotate = () => { tallest = 0; later(300) }
    viewport.addEventListener('resize', update)
    window.addEventListener('orientationchange', onRotate)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onFocus)
    return () => {
      window.clearTimeout(timer)
      viewport.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', onRotate)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onFocus)
    }
  }, [])
  return open
}

export type PushToast = (text: string, tone?: Toast['tone'], onUndo?: () => void) => void

/** Avisos efímeros. Los que se pueden deshacer duran más: hay que tener tiempo de leerlos y reaccionar. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback<PushToast>((text, tone = 'ok', onUndo) => {
    const id = uid()
    // Tres a la vez como mucho: en el móvil más avisos taparían la lista entera.
    setToasts((previous) => [...previous.slice(-2), { id, text, tone, onUndo }])
    timers.current.set(id, window.setTimeout(() => dismiss(id), onUndo ? 7000 : tone === 'error' ? 6000 : 4200))
  }, [dismiss])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return { toasts, push, dismiss }
}
