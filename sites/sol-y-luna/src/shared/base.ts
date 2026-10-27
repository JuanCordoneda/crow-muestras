/**
 * La carpeta desde la que se sirve la web: `/` en su propio dominio y, en el monorepo de muestras,
 * `/<sitio>/` (`BASE_PATH` en el build, que Vite expone como `import.meta.env.BASE_URL`).
 * Las rutas de la app se escriben siempre sin ella (`/en`, `/reserver`): se añade al pintar un
 * enlace y se quita al leer la dirección.
 */
const ROOT = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** `/en` → `/sitio/en`; la portada `/` → `/sitio/`. */
export const withBase = (path: string) => (ROOT && path.startsWith('/') ? `${ROOT}${path}` : path)

/** `/sitio/en` → `/en`. Lo que no cuelga de la carpeta se queda igual. */
export const stripBase = (pathname: string) =>
  ROOT && (pathname === ROOT || pathname.startsWith(`${ROOT}/`)) ? pathname.slice(ROOT.length) || '/' : pathname
