/**
 * Fotos del grupo: de los originales a resolución completa (`recursos/grupo-originales/*.jpg`, tal
 * como los da Google Maps con `=s0`, hasta 4032 px) a las maestras de `public/img/grupo/*.webp`.
 *
 * - 2400 px de ancho como mucho: es lo que pide el héroe a pantalla completa en un portátil retina
 *   (1440 × 2 = 2880, y la foto se recorta en alto). Con 1600 px se veía blanda.
 * - Lanczos al reducir y un enfoque suave después: al bajar de 4000 a 2400 px la foto pierde
 *   micro-contraste y se ve «lavada»; el enfoque se lo devuelve sin halos.
 * - Calidad 84 y `smartSubsample`: los bordes rojos y amarillos del local no se emborronan.
 *
 * Las variantes (240…1600) salen también de aquí y del original, no de la maestra: una sola
 * compresión, sin la pérdida acumulada de recomprimir un webp. `npm run images` las encuentra ya
 * hechas, no las rehace, y solo escribe el manifiesto con el difuminado de carga de cada foto.
 * Uso: `node scripts/fotos-grupo.mjs && npm run images`.
 */
import sharp from 'sharp'
import { readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FROM = join(ROOT, 'recursos', 'grupo-originales')
const TO = join(ROOT, 'public', 'img', 'grupo')
const MAX = 2400
/** Las mismas anchuras que `scripts/images.mjs`; más calidad cuanto más pequeña, que se nota más. */
const VARIANTS = { 240: 74, 480: 78, 720: 80, 900: 80, 1200: 82, 1600: 82 }

for (const file of (await readdir(FROM)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort()) {
  const name = basename(file, extname(file))
  const info = await sharp(join(FROM, file))
    .rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 2 })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(join(TO, `${name}.webp`))
  const made = []
  for (const [width, quality] of Object.entries(VARIANTS).map(([w, q]) => [Number(w), q])) {
    if (width >= info.width) continue
    await sharp(join(FROM, file))
      .rotate()
      .resize({ width, kernel: 'lanczos3' })
      // Cuanto más se reduce, más enfoque hace falta para que no se vea blanda.
      .sharpen({ sigma: width <= 480 ? 0.5 : 0.65, m1: 0.7, m2: 2 })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(join(TO, `${name}-${width}.webp`))
    made.push(width)
  }
  console.log(`[fotos] ${name}.webp ${info.width}×${info.height} · ${Math.round(info.size / 1024)} kB · variantes ${made.join(', ')}`)
}
