import { Suspense, lazy, useEffect } from 'react'
import { useRoute } from './shared/routing'
import { PublicApp } from './public/PublicApp'
import { ErrorBoundary } from './public/components/ErrorBoundary'

/**
 * El panel va en su propio trozo: quien entra a ver la carta o a reservar no lo descarga.
 * Se pide solo al abrir `/admin`.
 */
const AdminApp = lazy(() => import('./admin/AdminApp').then((module) => ({ default: module.AdminApp })))

/** Router raíz: decide si se pinta la web pública o el panel. */
export default function App() {
  const route = useRoute()

  /**
   * Al cambiar de página se sube arriba, salvo si la dirección pide una sección (`/carta#arroces`):
   * de eso se encarga la propia página, que sabe cuándo ha terminado de pintarla.
   */
  const key = route.area === 'admin' ? `admin:${route.page.view}` : `public:${route.page.view}`
  useEffect(() => {
    if (window.location.hash) return
    try {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    } catch {
      // Navegadores anteriores a 2022 no conocen 'instant'; sin esto el salto se pierde.
      window.scrollTo(0, 0)
    }
  }, [key])

  if (route.area === 'public') {
    return (
      <ErrorBoundary>
        <PublicApp route={route.page} />
      </ErrorBoundary>
    )
  }

  return (
    <Suspense fallback={<div className="route-loading" role="status" aria-live="polite"><span className="route-spinner" /></div>}>
      <AdminApp route={route.page} />
    </Suspense>
  )
}
