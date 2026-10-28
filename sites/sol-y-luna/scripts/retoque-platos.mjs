/**
 * Retoque de las fotos de platos de la portada («Les assiettes qui font revenir»).
 *
 * Son fotos de móvil hechas en la mesa: sobra plato blanco alrededor y la luz del local las deja
 * algo apagadas y frías. Aquí, a partir de los originales de `recursos/grupo-originales/`:
 *
 * - Un recorte algo más cerrado, con la misma proporción, centrado en la comida (`PLATOS`).
 * - Saturación ×1,15 y brillo ×1,04: más apetecible sin que se note el filtro.
 * - Un punto más cálido: un poco más de rojo y un poco menos de azul (`CALIDEZ`).
 *
 * Escribe la maestra y sus variantes con **las mismas dimensiones y nombres** que ya tenían (así
 * `src/shared/photo-variants.ts` sigue valiendo) y con los mismos ajustes de `fotos-grupo.mjs`:
 * Lanczos, enfoque suave y una sola compresión por fichero, sacada del original.
 *
 * Antes de escribir guarda una copia de los webp que había en `recursos/originales-platos/` (fuera
 * de git), solo la primera vez: volver a correrlo no pisa la copia con fotos ya retocadas, y como
 * siempre parte de los jpg originales, tampoco acumula retoques.
 *
 * Va después de `fotos-grupo.mjs`, que rehace estas fotos sin retocar:
 *   node scripts/fotos-grupo.mjs && node scripts/retoque-platos.mjs && npm run images
 * (`npm run images` encuentra las variantes hechas y solo pone al día el difuminado de carga.)
 */
import sharp from 'sharp'
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FROM = join(ROOT, 'recursos', 'grupo-originales')
const TO = join(ROOT, 'public', 'img', 'grupo')
const BACKUP = join(ROOT, 'recursos', 'originales-platos')

/**
 * Cada plato: cuánto se queda del encuadre (`keep`, 0,86 = se quita un 14 % de ancho y de alto) y
 * dónde está el centro de la comida, en fracciones del original (`x`, `y`). La quesadilla recorta
 * menos porque su original es pequeño: más cerrado habría que ampliarla y se vería blanda.
 */
const PLATOS = {
  'sol-empanadas': { keep: 0.86, x: 0.45, y: 0.5 },
  'sol-burrito-guacamole': { keep: 0.86, x: 0.52, y: 0.5 },
  'sol-quesadilla': { keep: 0.93, x: 0.5, y: 0.47 },
  'sol-burrito': { keep: 0.86, x: 0.5, y: 0.5 },
}

const COLOR = { saturation: 1.15, brightness: 1.04 }
/** Rojo, verde y azul por separado: el plato blanco tira a crema y la salsa a rojo, sin virar. */
const CALIDEZ = [
  [1.04, 0, 0],
  [0, 1.01, 0],
  [0, 0, 0.94],
]

/** Las mismas anchuras y calidades que `fotos-grupo.mjs`. */
const MASTER_QUALITY = 84
const VARIANTS = { 240: 74, 480: 78, 720: 80, 900: 80, 1200: 82, 1600: 82 }

const exists = (file) => stat(file).then(() => true, () => false)
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

await mkdir(BACKUP, { recursive: true })

for (const [name, crop] of Object.entries(PLATOS)) {
  // 1. Copia de lo que había (maestra y variantes), una sola vez.
  for (const file of (await readdir(TO)).filter((entry) => entry === `${name}.webp` || new RegExp(`^${name}-\\d{3,4}\\.webp$`).test(entry))) {
    if (!(await exists(join(BACKUP, file)))) await copyFile(join(TO, file), join(BACKUP, file))
  }
  // Las dimensiones de la maestra original mandan: el retoque no las cambia.
  const { width: targetW, height: targetH } = await sharp(join(BACKUP, `${name}.webp`)).metadata()

  // 2. El original, girado según su EXIF, recortado y retocado a resolución completa (sin comprimir).
  const { data, info } = await sharp(join(FROM, `${name}.jpg`)).rotate().raw().toBuffer({ resolveWithObject: true })
  const cropW = Math.round(info.width * crop.keep)
  const cropH = Math.round(info.height * crop.keep)
  const left = clamp(Math.round(info.width * crop.x - cropW / 2), 0, info.width - cropW)
  const top = clamp(Math.round(info.height * crop.y - cropH / 2), 0, info.height - cropH)
  const retocada = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extract({ left, top, width: cropW, height: cropH })
    .recomb(CALIDEZ)
    .modulate(COLOR)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const base = () => sharp(retocada.data, { raw: { width: retocada.info.width, height: retocada.info.height, channels: retocada.info.channels } })

  // 3. La maestra, con su tamaño de siempre; luego las variantes (más nuevas que ella: `npm run images` no las rehace).
  await base()
    .resize(targetW, targetH, { fit: 'cover', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 2 })
    .webp({ quality: MASTER_QUALITY, effort: 6, smartSubsample: true })
    .toFile(join(TO, `${name}.webp`))
  const made = []
  for (const [width, quality] of Object.entries(VARIANTS).map(([w, q]) => [Number(w), q])) {
    if (width >= targetW) continue
    await base()
      .resize({ width, height: Math.round((width * targetH) / targetW), fit: 'cover', kernel: 'lanczos3' })
      .sharpen({ sigma: width <= 480 ? 0.5 : 0.65, m1: 0.7, m2: 2 })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(join(TO, `${name}-${width}.webp`))
    made.push(width)
  }
  console.log(`[platos] ${name}.webp ${targetW}×${targetH} · recorte ${cropW}×${cropH} de ${info.width}×${info.height} · variantes ${made.join(', ')}`)
}
