import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './shared/styles/base.css'
import App from './App'

/**
 * Cada página llega ya pintada en su HTML (`scripts/pages.mjs`): se lee sin esperar al JavaScript,
 * que es lo que mide Google y lo que nota quien entra desde un anuncio. Al arrancar, la app se
 * monta sobre ese mismo HTML y lo reaprovecha; en `npm run dev` el contenedor llega vacío y se
 * pinta de cero.
 */
const root = document.getElementById('root')!
const app = <StrictMode><App /></StrictMode>
// Hidratar es adoptar el HTML tal cual, sin compararlo atributo a atributo: la mitad de trabajo al arrancar.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

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
