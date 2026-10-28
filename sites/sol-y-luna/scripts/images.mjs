/**
 * Genera variantes ligeras (480 px y 900 px) de cada foto de `public/`.
 * El móvil se lleva la de 480 y no una de 1400 px que no cabe en pantalla.
 * Es idempotente: si la variante ya existe y es más nueva que el original, no la rehace.
 * Necesita `cwebp` (brew install webp). Si no está, avisa y no rompe el build.
 */
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { join, extname, basename, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'

const run = promisify(execFile)
const root = fileURLToPath(new URL('../public', import.meta.url))
/**
 * Anchuras que de verdad se piden en la web: 240 para las miniaturas de la carta, 480 para el
 * móvil normal, 720 para las tarjetas de especialidades en pantallas densas, 900 para los bloques
 * a media pantalla, 1200 para la foto ancha en un móvil de tres puntos por píxel y 1600 para una
 * tablet o media pantalla de un portátil retina. Por debajo de esa calidad, las fotos se veían
 * empastadas en los móviles buenos.
 */
const WIDTHS = [240, 480, 720, 900, 1200, 1600]
const QUALITY = { 240: 70, 480: 74, 720: 76, 900: 78, 1200: 78, 1600: 80 }

const walk = async (dir) => {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

const isSource = (file) => {
  // Solo las fotos de la web: los iconos y la imagen para redes se sirven tal cual.
  if (!file.startsWith(join(root, 'img') + sep)) return false
  const ext = extname(file).toLowerCase()
  if (ext !== '.webp' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') return false
  return !/-\d{3,4}$/.test(basename(file, ext))
}

/** Ancho real del original: no tiene sentido "reducir" una foto a un tamaño mayor del que ya tiene. */
const pixelWidth = async (file) => {
  const { stdout } = await run('sips', ['-g', 'pixelWidth', file]).catch(() => ({ stdout: '' }))
  return Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]) || 0
}

/**
 * Difuminado de carga: la foto a 24 px, desenfocada en un SVG. Va dentro del manifiesto (unos
 * 600 bytes por foto) y se pinta de fondo mientras llega la buena: nunca se ve un hueco gris ni una
 * foto que aparece a trozos. Solo para las fotos del grupo, que son las que se ven grandes.
 */
const blur = async (file) => {
  const { data, info } = await sharp(file).resize(24).webp({ quality: 50 }).toBuffer({ resolveWithObject: true })
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${info.width} ${info.height}' preserveAspectRatio='none'>` +
    `<filter id='b' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='1.2'/><feComponentTransfer><feFuncA type='discrete' tableValues='1 1'/></feComponentTransfer></filter>` +
    `<image width='100%' height='100%' preserveAspectRatio='none' filter='url(#b)' href='data:image/webp;base64,${data.toString('base64')}'/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function main() {
  await run('cwebp', ['-version']).catch(() => {
    console.log('[images] cwebp no está instalado; se omite la generación de variantes.')
    process.exit(0)
  })

  const files = (await walk(root)).filter(isSource)
  let made = 0
  let skipped = 0
  /** Ruta pública -> ancho original. La app solo pide variantes de lo que hay aquí. */
  const manifest = {}

  for (const file of files) {
    const ext = extname(file)
    const source = await stat(file)
    const original = await pixelWidth(file)
    const variants = []
    for (const target of WIDTHS) {
      if (original && original <= target) { skipped++; continue }
      const out = join(dirname(file), `${basename(file, ext)}-${target}.webp`)
      const existing = await stat(out).catch(() => null)
      await mkdir(dirname(out), { recursive: true })
      // `-resize W 0` mantiene la proporción; nunca amplía porque se filtra por ancho abajo.
      if (!existing || existing.mtimeMs < source.mtimeMs) {
        await run('cwebp', ['-quiet', '-q', String(QUALITY[target]), '-sharp_yuv', '-resize', String(target), '0', '-m', '6', file, '-o', out])
        made++
      }
      variants.push(target)
    }
    if (variants.length) {
      const url = '/' + file.slice(root.length + 1).split(sep).join('/')
      manifest[url] = { w: original, sizes: variants, ...(url.startsWith('/img/grupo/') ? { blur: await blur(file) } : {}) }
    }
  }

  const entries = Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
  await writeFile(
    fileURLToPath(new URL('../src/shared/photo-variants.ts', import.meta.url)),
    '/** Generado por `npm run images`. No editar a mano. */\n' +
      'export const PHOTO_VARIANTS: Record<string, { w: number; sizes: number[]; blur?: string }> = {\n' +
      entries.map(([url, info]) => `  '${url}': { w: ${info.w}, sizes: [${info.sizes.join(', ')}]${info.blur ? `, blur: ${JSON.stringify(info.blur)}` : ''} },`).join('\n') +
      '\n}\n',
  )
  console.log(`[images] ${made} variantes generadas, ${skipped} omitidas, ${entries.length} fotos en el manifiesto.`)
}

main().catch((error) => { console.error(error); process.exit(1) })
