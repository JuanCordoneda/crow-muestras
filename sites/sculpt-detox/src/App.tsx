import { useEffect } from 'react'
import { useRoute } from './shared/routing'
import { PublicApp } from './public/PublicApp'
import { ErrorBoundary } from './public/components/ErrorBoundary'

/**
 * Router raíz. La plantilla traía un panel (`/admin`) para la carta de un restaurante; Sculpt
 * Detox no lo usa, así que está desconectado: su código sigue en `src/admin` por si algún día se
 * adapta (precios y fotos desde el móvil), pero no se empaqueta y `/admin` contesta «no
 * encontrada».
 */
export default function App() {
  const route = useRoute()
  const page = route.area === 'public' ? route.page : { view: 'no-encontrada' as const, lang: 'es' as const }

  /**
   * Al cambiar de página se sube arriba, salvo si la dirección pide una sección (`/#reservar`):
   * de eso se encarga la propia página, que sabe cuándo ha terminado de pintarla.
   */
  const key = `${page.view}:${page.lang}`
  useEffect(() => {
    if (window.location.hash) return
    try {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    } catch {
      // Navegadores anteriores a 2022 no conocen 'instant'; sin esto el salto se pierde.
      window.scrollTo(0, 0)
    }
  }, [key])

  return (
    <ErrorBoundary>
      <PublicApp route={page} />
    </ErrorBoundary>
  )
}
