import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/styles/base.css'
import App from './App'
import { primeMenu } from './shared/api'
import { hasStoredMenu } from './shared/store'

const mount = () => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

  /**
   * Retira la pantalla de arranque una vez que el navegador ya ha pintado la web.
   * Dos `requestAnimationFrame` para que el relevo caiga sobre un fotograma ya dibujado.
   */
  const boot = document.getElementById('boot')
  if (boot) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      boot.classList.add('is-done')
      boot.addEventListener('transitionend', () => boot.remove(), { once: true })
      setTimeout(() => boot.remove(), 600)
    }))
  }
}

/**
 * Quien ya vino tiene su copia de la carta y la web se pinta al instante. En la primera visita se
 * espera al servidor, pero poco: pasado el tope se pinta con la carta empaquetada y se reemplaza
 * en cuanto llegue la buena. Más de un segundo mirando la pantalla de arranque no lo aguanta nadie.
 */
if (hasStoredMenu()) mount()
else primeMenu(800).then(mount)

/**
 * El service worker deja la segunda visita en caché. Se registra al terminar la carga para no
 * competir por el ancho de banda de la primera, y solo en producción. Bajo una subcarpeta (las
 * muestras comparten dominio) no se registra: su scope `/` se metería en las demás webs.
 */
if (import.meta.env.PROD && import.meta.env.BASE_URL === '/' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin worker la web funciona igual, solo pide más a la red */
    })
  })
}
