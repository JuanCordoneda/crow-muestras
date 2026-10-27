/**
 * Una página HTML por dirección y por idioma, ya pintada.
 *
 * WhatsApp, Instagram, Facebook y el resto de los que enseñan la miniatura de un enlace **no
 * ejecutan JavaScript**, y Google lo ejecuta tarde y no siempre. Así que aquí se escribe, en el
 * build, el HTML completo de cada página: el contenido entero (pintado en Node con los mismos
 * componentes que usa el navegador), su título, su descripción, su canónico, sus idiomas
 * alternativos (hreflang: pt, fr, en y x-default), su miniatura y la ficha de Google (schema.org).
 * Quien entra desde la bio de Instagram ve la página al instante, sin esperar al JavaScript; luego
 * la app se monta encima.
 *
 * - `/links` (la de la bio) lleva `noindex`: es un atajo, no una página que tenga que posicionar.
 * - La precarga de la foto del héroe se queda solo en la portada, que es la única que la enseña.
 * - `404.html`, `fr/404.html` y `en/404.html` son la página de «no encontrada».
 * - Las sesiones del ateliê salen de `src/public/agenda.ts` al pintar: las pasadas no se escriben.
 *
 * Corre sola después de `npm run build` (`postbuild`).
 */
import { build } from 'esbuild'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SITIO = 'https://atelie.parisabor.com'
const LANGS = ['pt', 'fr', 'en']
const HTML_LANG = { pt: 'pt-BR', fr: 'fr', en: 'en' }
const HREFLANG = { pt: 'pt-BR', fr: 'fr', en: 'en' }
const LOCALE = { pt: 'pt_BR', fr: 'fr_FR', en: 'en_GB' }
const NOINDEX = new Set(['links'])
const raiz = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url))
const dist = raiz('dist')

/*
 * Los componentes se compilan para Node con React de verdad (`react-dom/server`), que ya viene
 * con el proyecto. El temporal va dentro del proyecto: Node solo encuentra `react` si el fichero
 * está bajo esta carpeta.
 */
const cache = raiz('node_modules/.cache')
await mkdir(cache, { recursive: true })
const dir = await mkdtemp(join(cache, 'parisabor-pages-'))
let app
try {
  const outfile = join(dir, 'prerender.mjs')
  await build({
    entryPoints: [raiz('src/public/prerender.tsx')],
    outfile, bundle: true, format: 'esm', platform: 'node', target: 'node18', logLevel: 'warning',
    jsx: 'automatic', loader: { '.css': 'empty' },
    external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
    define: { 'import.meta.env.PROD': 'true', 'import.meta.env.BASE_URL': JSON.stringify(process.env.BASE_PATH || '/') },
  })
  app = await import(pathToFileURL(outfile).href)
} finally {
  await rm(dir, { recursive: true, force: true })
}

/** Sustituye el contenido de una etiqueta suelta, sin tocar el resto del HTML. */
const setMeta = (html, match, value) => {
  const found = html.match(match)
  if (!found) throw new Error(`no encontrada la etiqueta ${match}`)
  return html.replace(match, found[0].replace(/content="[^"]*"/, `content="${value}"`))
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
/** El JSON dentro de un <script>: `</` partido para que nadie pueda cerrar la etiqueta desde un texto. */
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c')
const absolute = (path) => `${SITIO}${path === '/' ? '/' : path}`

const HERO = /\n\s*<!--\s*\n\s*La foto de la portada[\s\S]*?-->\s*\n\s*<link\s+rel="preload"[\s\S]*?\/>\n/
const ALTERNATE_LOCALES = /(\s*<meta property="og:locale:alternate"[^>]*>)+/

const source = await readFile(join(dist, 'index.html'), 'utf8')
if (!source.includes('<!--app-->') || !source.includes('<!--jsonld-->')) throw new Error('index.html sin las marcas <!--app--> y <!--jsonld-->')

const page = ({ path, view, lang, index = true, alternates = null, notFound = false }) => {
  const meta = app.metaFor(view, lang)
  const url = absolute(path)
  const title = escape(meta.title)
  const description = escape(meta.description)
  let html = source

  html = html.replace('<html lang="pt-BR">', `<html lang="${HTML_LANG[lang]}">`)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = setMeta(html, /<meta name="description"[^>]*>/, description)
  html = setMeta(html, /<meta name="robots"[^>]*>/, index ? 'index, follow, max-image-preview:large' : 'noindex, follow')
  html = setMeta(html, /<meta property="og:title"[^>]*>/, title)
  html = setMeta(html, /<meta property="og:description"[^>]*>/, description)
  html = setMeta(html, /<meta id="og-url"[^>]*>/, url)
  html = setMeta(html, /<meta property="og:image:alt"[^>]*>/, escape(app.ogImageAlt(lang)))
  html = setMeta(html, /<meta property="og:locale"[^>]*>/, LOCALE[lang])
  html = html.replace(ALTERNATE_LOCALES, LANGS.filter((code) => code !== lang).map((code) => `\n    <meta property="og:locale:alternate" content="${LOCALE[code]}" />`).join(''))
  html = setMeta(html, /<meta name="twitter:title"[^>]*>/, title)
  html = setMeta(html, /<meta name="twitter:description"[^>]*>/, description)

  if (notFound) {
    html = html.replace(/\n\s*<link id="canonical"[^>]*>/, '')
  } else {
    html = html.replace(/(<link id="canonical" rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  }
  // Los idiomas alternativos van junto al canónico, que es donde los busca quien los lee.
  if (alternates) {
    const links = [
      ...LANGS.map((code) => `    <link rel="alternate" hreflang="${HREFLANG[code]}" href="${absolute(alternates[code])}" />`),
      `    <link rel="alternate" hreflang="x-default" href="${absolute(alternates.pt)}" />`,
    ].join('\n')
    html = html.replace(/(<link id="canonical"[^>]*>)/, `$1\n${links}`)
  }

  if (view !== 'inicio') html = html.replace(HERO, '\n')
  const blocks = notFound ? [] : app.jsonLdFor(view, lang)
  html = html.replace('<!--jsonld-->', blocks.map((block) => `<script type="application/ld+json">${json(block)}</script>`).join('\n    '))
  html = html.replace('<!--app-->', app.renderPage(path))
  return html
}

const hecho = []
const write = async (file, html) => {
  const target = join(dist, file)
  await mkdir(join(target, '..'), { recursive: true })
  await writeFile(target, html)
  hecho.push(file.replace(/index\.html$/, '').replace(/^/, '/'))
}

for (const [view, paths] of Object.entries(app.PAGE_PATHS)) {
  for (const lang of LANGS) {
    const path = paths[lang]
    const file = path === '/' ? 'index.html' : `${path.slice(1)}/index.html`
    await write(file, page({ path, view, lang, index: !NOINDEX.has(view), alternates: paths }))
  }
}
await write('404.html', page({ path: '/404', view: 'no-encontrada', lang: 'pt', index: false, notFound: true }))
await write('fr/404.html', page({ path: '/fr/404', view: 'no-encontrada', lang: 'fr', index: false, notFound: true }))
await write('en/404.html', page({ path: '/en/404', view: 'no-encontrada', lang: 'en', index: false, notFound: true }))

console.log(`[pages] ${hecho.length} páginas pintadas: ${hecho.join(', ')}`)
