/**
 * Service worker de PariSabor: la segunda visita no vuelve a descargar nada y, sin cobertura (el
 * metro, los datos del turista agotados), la web abre igual. Al worker le basta con tener el HTML,
 * el JS, las tipografías y las fotos. Las fechas del ateliê van en el HTML, que es red primero:
 * un despliegue con fechas nuevas se ve al instante.
 *
 * Reglas por tipo de recurso, porque no todos envejecen igual:
 * - `/assets/*` lleva hash en el nombre: si el contenido cambia, cambia la URL. Caché primero y
 *   sin preguntar; el tope solo evita que se amontonen los ficheros de despliegues viejos.
 * - `/fonts/*`, `/icons/*` y el favicon: pocos, pequeños y fijos. Caché primero, sin tope.
 * - `/img/*` y `/media/*`: caché primero con tope. Las de `/media/` (subidas desde el panel) se
 *   llaman como el hash de su contenido y no cambian nunca. Las de `/img/` tienen nombre fijo:
 *   si se sustituye una foto por otra con el mismo nombre, hay que subir VERSION.
 * - El HTML sí cambia en cada despliegue: red primero, y el caché solo como red de seguridad si
 *   no hay conexión o la red no contesta a tiempo. Así un despliegue nuevo se ve al instante.
 * - `/api/*` jamás: carta, horario, huecos libres y reservas tienen que ser los de este momento.
 *   Una reserva hecha contra una copia vieja del horario es peor que un error de conexión.
 */
// v3: logo nuevo en el arranque y en los iconos; al subir la versión se tiran las copias viejas,
// que si no un visitante de siempre seguiría viendo la ola antigua en la pestaña.
// v4: el panel tiene su propio manifiesto; fuera las copias de /admin que llevaban el de la web.
// parisabor-v1: la web del ateliê sustituye a la plantilla; nada de lo guardado antes sirve.
// parisabor-v2: fotos nuevas en AVIF y a resolución completa, con los mismos nombres que las viejas.
const VERSION = 'parisabor-v2'
const PAGES = `${VERSION}-pages`
const ASSETS = `${VERSION}-assets`
const STATIC = `${VERSION}-static`
const MEDIA = `${VERSION}-media`

/**
 * Una copia por dirección. Cada página tiene su propio HTML desde el build —su título, su
 * descripción y su canónico— así que no vale guardar una sola y servirla para todas.
 */
const PAGES_LIMIT = 16
/** Un despliegue deja una decena de ficheros: caben varios sin que el caché crezca sin fin. */
const ASSETS_LIMIT = 120
/** Las fotos del ateliê en todos sus tamaños, con margen. */
const MEDIA_LIMIT = 250
/**
 * Con una copia guardada, lo que la red tiene para contestar la página. Con una rayita de
 * cobertura el navegador se quedaría esperando medio minuto a un servidor que no llega; pasado
 * el tope se enseña la copia y la respuesta, si llega, se guarda para la próxima.
 */
const NETWORK_TIMEOUT = 4000

/** Lo mínimo para abrir sin red aunque la primera visita no llegara a pasar de la portada. */
const PRECACHE = [
  ['/', PAGES],
  ['/favicon.svg', STATIC],
]

/** Solo se guardan respuestas completas y buenas del propio dominio; un error se reintentaría mal en cada visita. */
const storable = (response) => Boolean(response) && response.status === 200 && response.type === 'basic' && !response.redirected

/** Deja el caché en el tope borrando lo más antiguo que entró. */
const trim = async (cache, limit) => {
  const keys = await cache.keys()
  if (keys.length <= limit) return
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)))
}

const put = async (cacheName, key, response, limit) => {
  try {
    const cache = await caches.open(cacheName)
    await cache.put(key, response)
    if (limit) await trim(cache, limit)
  } catch (error) {
    // Teléfono sin espacio: fuera las fotos, que es lo que más ocupa y lo más fácil de volver a pedir.
    if (error && error.name === 'QuotaExceededError') await caches.delete(MEDIA).catch(() => {})
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Cada fichero va por su lado y un fallo no tumba la instalación: el worker sigue siendo útil
    // para lo demás, y la portada ya se guardará en la próxima navegación.
    await Promise.all(PRECACHE.map(async ([path, cacheName]) => {
      try {
        // `reload`: la copia de la caché HTTP podría ser de un despliegue anterior.
        const response = await fetch(new Request(path, { cache: 'reload' }))
        if (storable(response)) await put(cacheName, path, response)
      } catch {
        /* sin red durante la instalación: no pasa nada */
      }
    }))
    // El worker nuevo entra en servicio sin esperar a que se cierren las pestañas viejas.
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    // Al subir VERSION se tira todo lo de la versión anterior de una vez. Con el guion final:
    // si no, `parisabor-v1` se tomaría por prefijo de `parisabor-v10` y sobreviviría.
    await Promise.all(names.filter((name) => !name.startsWith(`${VERSION}-`)).map((name) => caches.delete(name)))
    // El navegador pide la página a la vez que despierta al worker, en vez de esperar a que
    // arranque: en un Android modesto son un par de décimas menos en cada visita.
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {})
    await self.clients.claim()
  })())
})

/** Todas las variantes de una dirección (`?lang=de`, `?source=pwa`, `/carta/`) comparten copia. */
const pageKey = (url) => url.pathname.replace(/\/+$/, '') || '/'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Último recurso sin red ni copia: al menos, el teléfono para reservar. */
const offlinePage = () =>
  new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2f2590"><title>Sin conexión · Restaurante El Puerto</title><style>
body{margin:0;min-height:100vh;display:grid;place-content:center;padding:24px max(16px,env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:#2f2590;color:#fff;text-align:center;font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
h1{margin:0 0 8px;font:700 30px/1.1 Georgia,serif}p{margin:0 auto 18px;max-width:300px;color:rgba(255,255,255,.86)}
a,button{display:flex;align-items:center;justify-content:center;min-height:48px;margin:0 auto 12px;padding:0 24px;border:0;border-radius:999px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
a{background:#f2a93b;color:#141038}button{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.5)}
</style></head><body><main><h1>Sin conexión</h1><p>Ahora mismo no hay internet. Para reservar mesa, llámanos.</p><p lang="en">You are offline. To book a table, give us a call.</p><a href="tel:+34971850942">971 85 09 42</a><button type="button" onclick="location.reload()">Reintentar</button></main></body></html>`,
    { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  )

const page = async (key, network) => {
  const cache = await caches.open(PAGES)
  const cached = await cache.match(key, { ignoreVary: true })
  try {
    const response = cached ? await Promise.race([network, wait(NETWORK_TIMEOUT)]) : await network
    // Se acabó el tope: la copia, y la respuesta de la red se guardará cuando llegue.
    if (!response) return cached
    // Un 502 a mitad de despliegue no es motivo para enseñar una página de error si hay copia buena.
    if (response.status >= 500) return cached || (await cache.match('/', { ignoreVary: true })) || response
    return response
  } catch {
    // Sin conexión. Si esta página nunca se abrió, vale la portada: es la misma aplicación y el
    // router pinta la página pedida con la carta que ya tiene guardada.
    return cached || (await cache.match('/', { ignoreVary: true })) || offlinePage()
  }
}

const cacheFirst = async (event, cacheName, limit) => {
  const { request } = event
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request, { ignoreVary: true })
  if (hit) return hit
  const response = await fetch(request)
  // Se guarda por detrás: la foto empieza a pintarse mientras baja, sin esperar a que se escriba en disco.
  if (storable(response)) event.waitUntil(put(cacheName, request, response.clone(), limit))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  // Fallo conocido de Chrome: las DevTools piden `only-if-cached` fuera de su modo y el fetch revienta.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return
  const url = new URL(request.url)
  // Solo lo que sirve este dominio; nada de interceptar terceros (mapas, redes sociales).
  if (url.origin !== self.location.origin) return
  // El propio worker nunca se cachea: si no, no habría forma de actualizarlo.
  if (url.pathname === '/sw.js') return
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return
  // El control de precios es otra aplicación y enseña datos que cambian al guardar: siempre de la
  // red, nunca de la caché (una copia vieja mostraría los precios de antes de la última carga).
  if (url.pathname === '/precios' || url.pathname.startsWith('/precios/')) return
  // Las peticiones a trozos (vídeo) no caben en el caché, que solo guarda respuestas enteras.
  if (request.headers.has('range')) return
  // Las reservas se hacen fuera (Restoo) y el servidor redirige: de esto se encarga el navegador.
  // Una respuesta redirigida no se puede devolver a una navegación desde aquí, y además no hay
  // nada que guardar.
  if (/^\/(?:(?:es|en|de|fr)\/)?reserva(?:r|s)?$/i.test(pageKey(url))) return

  if (request.mode === 'navigate') {
    const key = pageKey(url)
    // Con navigation preload la petición ya salió mientras arrancaba el worker.
    const network = (async () => (await event.preloadResponse) || fetch(request))()
    // La copia se clona aquí, antes de que `page` entregue la respuesta y el navegador lea el
    // cuerpo; y el worker sigue vivo hasta guardarla aunque haya contestado la copia vieja.
    const saved = network.then((response) => (storable(response) ? put(PAGES, key, response.clone(), PAGES_LIMIT) : undefined))
    event.waitUntil(saved.catch(() => {}))
    return event.respondWith(page(key, network))
  }
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(event, ASSETS, ASSETS_LIMIT))
  if (url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico' || /^\/(fonts|icons)\//.test(url.pathname)) return event.respondWith(cacheFirst(event, STATIC))
  if (/^\/(img|media)\//.test(url.pathname)) return event.respondWith(cacheFirst(event, MEDIA, MEDIA_LIMIT))
})
