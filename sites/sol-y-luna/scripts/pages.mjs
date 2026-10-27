/**
 * Una página HTML por dirección, con sus etiquetas.
 *
 * WhatsApp, Facebook y el resto de los que enseñan la miniatura de un enlace **no ejecutan
 * JavaScript**: leen el HTML tal como sale del servidor y ahí se quedan. Con un solo `index.html`
 * para toda la web, compartir `/carta` enseñaba el título y el texto de la portada, y Google leía
 * la misma descripción en las cuatro páginas.
 *
 * La app ya corrige el título y el canónico al arrancar, pero eso llega tarde para un robot. Así
 * que aquí se escribe, en el build, una copia de `index.html` por página con su título, su
 * descripción, su canónico, sus idiomas alternativos y su miniatura. El servidor sirve el
 * `index.html` de cada carpeta (`/carta` → `dist/carta/index.html`) y las precomprime como todo lo
 * demás: no cuesta nada en marcha.
 *
 * De paso, la precarga de la foto del héroe se queda solo en la portada, que es la única que la
 * enseña: en `/carta` eran 100 kB de foto que nadie llegaba a ver.
 *
 * Corre sola después de `npm run build` (`postbuild`).
 */
import { build } from 'esbuild'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SITIO = 'https://www.mexiandco.fr'
const LANGS = ['fr', 'es']
const dist = fileURLToPath(new URL('../dist', import.meta.url))

/** Los textos de la web en francés: la misma fuente que lee la app, sin copias sueltas aquí. */
const dir = await mkdtemp(join(tmpdir(), 'mexiandco-pages-'))
let fr
let venues
try {
  const compile = async (name) => {
    const outfile = join(dir, `${name}.mjs`)
    await build({
      entryPoints: [fileURLToPath(new URL(`../src/public/${name}.ts`, import.meta.url))],
      outfile, bundle: true, format: 'esm', platform: 'node', target: 'node18', logLevel: 'silent',
      define: { 'import.meta.env.BASE_URL': JSON.stringify(process.env.BASE_PATH || '/') },
    })
    return import(pathToFileURL(outfile).href)
  }
  fr = (await compile('content')).textsFor('fr')
  venues = await compile('venues')
} finally {
  await rm(dir, { recursive: true, force: true })
}
if (!fr?.meta?.title) throw new Error('content.ts no ha dado los textos en francés')

const MARCA = 'Quartier Latin · Paris 5e'
const { EL_SOL, MEXI } = venues

/** Cada página con lo que la distingue. La portada se queda donde está, en la raíz. */
const PAGES = [
  { path: '', title: fr.meta.title, description: fr.meta.description, hero: true },
  { path: 'el-sol-la-luna', title: `${EL_SOL.name} · ${EL_SOL.cuisine.fr} | ${MARCA}`, description: EL_SOL.intro.fr },
  { path: 'mexi-and-co', title: `${MEXI.name} · ${MEXI.cuisine.fr} | ${MARCA}`, description: MEXI.intro.fr },
  { path: 'reserver', title: `${fr.booking.title} · ${fr.meta.brand}`, description: fr.booking.text },
  { path: 'confidentialite', title: `${fr.privacy.title} · ${fr.meta.brand}`, description: fr.privacy.updated },
]

/**
 * Los idiomas alternativos, en la propia página. Ya están en el sitemap, pero declararlos aquí es
 * lo que evita que quien llega por Google en castellano se encuentre la web en francés.
 */
const alternates = (url) => [
  ...LANGS.map((lang) => `    <link rel="alternate" hreflang="${lang}" href="${url}${url.includes('?') ? '&' : '?'}lang=${lang}" />`),
  `    <link rel="alternate" hreflang="x-default" href="${url}" />`,
].join('\n')

/** Sustituye el contenido de una etiqueta suelta, sin tocar el resto del HTML. */
const setMeta = (html, match, value) => {
  const found = html.match(match)
  if (!found) throw new Error(`no encontrada la etiqueta ${match}`)
  return html.replace(match, found[0].replace(/content="[^"]*"/, `content="${value}"`))
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const source = await readFile(join(dist, 'index.html'), 'utf8')
const hecho = []

for (const page of PAGES) {
  const url = page.path ? `${SITIO}/${page.path}` : `${SITIO}/`
  const title = escape(page.title)
  const description = escape(page.description)
  let html = source

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = setMeta(html, /<meta name="description"[^>]*>/, description)
  html = setMeta(html, /<meta property="og:title"[^>]*>/, title)
  html = setMeta(html, /<meta property="og:description"[^>]*>/, description)
  html = setMeta(html, /<meta id="og-url"[^>]*>/, url)
  html = setMeta(html, /<meta name="twitter:title"[^>]*>/, title)
  html = setMeta(html, /<meta name="twitter:description"[^>]*>/, description)
  html = html.replace(/(<link id="canonical" rel="canonical" href=")[^"]*(")/, `$1${url}$2`)

  // Los idiomas alternativos van junto al canónico, que es donde los busca quien los lee.
  html = html.replace(/(<link id="canonical"[^>]*>)/, `$1\n${alternates(url)}`)

  if (!page.hero) {
    // La foto del héroe solo se pinta en la portada: en el resto, la precarga es tráfico tirado.
    html = html.replace(/\n\s*<!--\s*\n\s*La foto de la portada[\s\S]*?-->\s*\n\s*<link\s+rel="preload"[\s\S]*?\/>\n/, '\n')
  }

  const target = page.path ? join(dist, page.path, 'index.html') : join(dist, 'index.html')
  if (page.path) await mkdir(join(dist, page.path), { recursive: true })
  await writeFile(target, html)
  hecho.push(`${page.path ? `/${page.path}` : '/'}${page.hero ? '' : ' (sin precarga del héroe)'}`)
}

/**
 * El panel, con su propio manifiesto. Con el de la web, «Añadir a pantalla de inicio» desde
 * `/admin` creaba un icono que abría la portada: el navegador arranca en el `start_url` del
 * manifiesto, no en la página desde la que se añadió. El servidor sirve este fichero en todo
 * `/admin/*`.
 */
{
  let html = source
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Panel · Mexi-and-Co</title>')
  html = html.replace(/<link rel="manifest" href="[^"]*"/, '<link rel="manifest" href="/admin.webmanifest"')
  html = setMeta(html, /<meta name="apple-mobile-web-app-title"[^>]*>/, 'Panel')
  html = setMeta(html, /<meta name="application-name"[^>]*>/, 'Panel')
  if (!html.includes('/admin.webmanifest')) throw new Error('no encontrada la etiqueta del manifiesto')
  html = html.replace(/\n\s*<!--\s*\n\s*La foto de la portada[\s\S]*?-->\s*\n\s*<link\s+rel="preload"[\s\S]*?\/>\n/, '\n')
  await mkdir(join(dist, 'admin'), { recursive: true })
  await writeFile(join(dist, 'admin', 'index.html'), html)
  hecho.push('/admin (manifiesto del panel)')
}

console.log(`[pages] ${hecho.length} páginas con sus etiquetas: ${hecho.join(', ')}`)
