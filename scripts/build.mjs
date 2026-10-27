/**
 * Compila las cinco muestras y las junta en `dist/<sitio>/`, con el índice en `dist/index.html`.
 *
 *   node scripts/build.mjs            → todas
 *   node scripts/build.mjs comptoir   → solo esa (las demás se quedan como estaban en dist/)
 *
 * Cada web vive bajo su carpeta (`/comptoir/`, `/sol-y-luna/`…) en un mismo dominio:
 * - Las estáticas usan rutas relativas (`img/…`) y se copian tal cual.
 * - Las de Vite se compilan con `BASE_PATH=/<sitio>/`: Vite pone la carpeta en sus scripts, CSS y
 *   `index.html`, y el router la añade a los enlaces (`src/shared/base.ts`). Las fotos y fuentes de
 *   `public/` que el código escribe como texto (`'/img/…'`) se corrigen aquí, después del build.
 *
 * Son muestras para enseñar a clientes: todas las páginas salen con `noindex, nofollow` y cada
 * carpeta lleva un robots.txt que bloquea todo (además del de la raíz y la cabecera del Caddyfile).
 *
 * Con `SITE_URL` (o `RAILWAY_PUBLIC_DOMAIN`, que Railway pone solo) las URLs absolutas del dominio
 * de cada cliente (canónico, og:image para la miniatura de WhatsApp…) pasan a apuntar a la muestra.
 */
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderIndex } from './index-page.mjs'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const dist = join(raiz, 'dist')

export const SITES = [
  {
    name: 'comptoir', kind: 'static', from: 'public',
    title: 'Le Comptoir du Pérou', what: 'Restaurante peruano · París 15e', origin: '__ORIGIN__',
  },
  {
    name: 'sol-y-luna', kind: 'vite',
    title: 'El Sol & La Luna · Mexi & Co · Le 1492', what: 'Grupo de restaurantes · París 5e', origin: 'https://www.mexiandco.fr',
    drop: ['admin', 'admin.webmanifest'], // el panel de la plantilla necesita el servidor
  },
  {
    name: 'sculpt-detox', kind: 'vite',
    title: 'Sculpt Detox', what: 'Remodelación corporal · Ibiza', origin: 'https://sculptdetox.com',
  },
  {
    name: 'ltb-concept', kind: 'static', from: '.',
    include: ['index.html', 'config.js', 'og.jpg', 'apple-touch-icon.png', 'crow-icon.png', 'crow-wordmark.png', 'img', 'fonts'],
    title: 'LTB Concept', what: 'Salón brasileño · París 5e y Clichy', origin: 'https://ltbconcept.fr',
  },
  {
    name: 'atelie-queijos', kind: 'vite',
    title: 'Ateliê de queijos · PariSabor', what: 'Degustación de quesos · París', origin: 'https://atelie.parisabor.com',
  },
]

const siteUrl = (process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')).replace(/\/+$/, '')

const NOINDEX = '<meta name="robots" content="noindex, nofollow" />'
const ROBOTS = 'User-agent: *\nDisallow: /\n'

const run = (cmd, args, cwd, env = {}) => execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

/** Reescribe los ficheros de texto de una carpeta que pasen el filtro. */
async function rewrite(dir, exts, fn) {
  for await (const file of walk(dir)) {
    if (!exts.includes(extname(file))) continue
    const before = await readFile(file, 'utf8')
    const after = fn(before, file)
    if (after !== before) await writeFile(file, after)
  }
}

async function buildSite(site) {
  const src = join(raiz, 'sites', site.name)
  const out = join(dist, site.name)
  const base = `/${site.name}/`
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  console.log(`\n▸ ${site.name} (${site.kind})`)

  if (site.kind === 'vite') {
    if (!existsSync(join(src, 'node_modules'))) run('npm', ['ci', '--no-audit', '--no-fund'], src)
    run('npm', ['run', 'build'], src, { BASE_PATH: base })
    await cp(join(src, 'dist'), out, { recursive: true })
    for (const name of site.drop ?? []) await rm(join(out, name), { recursive: true, force: true })

    /*
     * Lo que está en `public/` y el código nombra como texto (`'/img/foto.webp'`, srcset, estilos
     * en línea): se le antepone la carpeta en el HTML, el JS, el CSS y el manifiesto. Solo cuando
     * va justo después de comillas, paréntesis, espacio o coma: así no toca URLs absolutas
     * (`https://dominio/img/…`) ni lo que ya lleva la carpeta (`/sitio/img/…`).
     */
    const entries = await readdir(join(src, 'public'), { withFileTypes: true })
    const names = entries.map((e) => e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (e.isDirectory() ? '/' : '(?=["\'`?#)\\s,])'))
    const publicRef = new RegExp(`(?<=["'\`(\\s,])/(?=(?:${names.join('|')}))`, 'g')
    await rewrite(out, ['.html', '.js', '.css', '.webmanifest'], (text) => text.replace(publicRef, base))

    // Manifiesto: arranque, alcance y atajos dentro de la carpeta (los iconos ya los cubre lo de arriba).
    await rewrite(out, ['.webmanifest'], (text) => text.replace(/"(id|start_url|scope|url)": "\//g, `"$1": "${base}`))
  } else {
    const from = join(src, site.from)
    for (const name of site.include ?? await readdir(from)) await cp(join(from, name), join(out, name), { recursive: true })
  }

  // URLs del dominio del cliente → la muestra. En las estáticas también el JS (config.js de LTB).
  const target = siteUrl ? `${siteUrl}/${site.name}` : site.origin === '__ORIGIN__' ? `/${site.name}` : null
  if (target) {
    const exts = site.kind === 'static' ? ['.html', '.js'] : ['.html']
    await rewrite(out, exts, (text) => text.replaceAll(site.origin, target))
  }

  // Ningún buscador: meta robots en cada página, robots.txt que bloquea todo y fuera el sitemap.
  await rewrite(out, ['.html'], (html) => {
    if (/<meta\s+name="robots"[^>]*>/i.test(html)) return html.replace(/<meta\s+name="robots"[^>]*>/gi, NOINDEX)
    return html.replace(/(<meta\s+charset[^>]*>)/i, `$1\n    ${NOINDEX}`)
  })
  await writeFile(join(out, 'robots.txt'), ROBOTS)
  await rm(join(out, 'sitemap.xml'), { force: true })

  for await (const file of walk(out)) {
    if (file.endsWith('.html') && !(await readFile(file, 'utf8')).includes(NOINDEX)) throw new Error(`${file} sin noindex`)
  }
}

const only = process.argv.slice(2)
const unknown = only.filter((name) => !SITES.some((site) => site.name === name))
if (unknown.length) throw new Error(`no existe: ${unknown.join(', ')}. Sitios: ${SITES.map((s) => s.name).join(', ')}`)

if (!only.length) await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
for (const site of SITES) if (!only.length || only.includes(site.name)) await buildSite(site)

await writeFile(join(dist, 'index.html'), renderIndex(SITES))
await cp(join(raiz, 'sites/ltb-concept/crow-icon.png'), join(dist, 'crow-icon.png'))
await cp(join(raiz, 'sites/ltb-concept/crow-wordmark.png'), join(dist, 'crow-wordmark.png'))
await writeFile(join(dist, 'robots.txt'), ROBOTS)

const size = async (dir) => { let n = 0; for await (const f of walk(dir)) n += (await stat(f)).size; return n }
console.log(`\n✓ dist/ listo (${(await size(dist) / 1e6).toFixed(1)} MB)${siteUrl ? ` · URLs absolutas → ${siteUrl}` : ' · sin SITE_URL: og:image y canónicos siguen con el dominio de cada cliente'}`)
for (const site of SITES) console.log(`  /${site.name}/  ${site.title}`)
