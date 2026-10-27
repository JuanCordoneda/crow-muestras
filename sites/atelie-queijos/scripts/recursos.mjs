/**
 * Prepara las imágenes de la web a partir de `recursos/originales/`:
 *
 * - Fotos del restaurante → `public/img/<nombre>.webp` (calidad 76, 1600 px como mucho).
 *   Las variantes de 480 y 900 px las hace después `npm run images`.
 * - Iconos de la app (favicon, apple-touch, 192/512 y maskable) dibujados desde el emblema SVG.
 * - La imagen para compartir en redes (`public/og.jpg`, 1200×630).
 * - El mapa estático de la sección «Cómo llegar» (`public/img/mapa.webp`), montado con teselas
 *   de OpenStreetMap centradas en el restaurante. Son una veintena de teselas y se descargan una
 *   sola vez: si el mapa ya existe no se pide nada a la red (política de uso de tile.openstreetmap.org).
 *
 * Es idempotente: `npm run recursos && npm run images`.
 */
import sharp from 'sharp'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ORIGINALES = join(ROOT, 'recursos/originales')
const PUBLIC = join(ROOT, 'public')
const IMG = join(PUBLIC, 'img')
const ICONS = join(PUBLIC, 'icons')

/** Lo que no es una foto del restaurante no sale a la web tal cual. */
const NO_PUBLICAR = new Set(['logo-antiguo.jpg', 'faro-icono.png', 'olas.png'])

/** El restaurante en OpenStreetMap (nodo «El Puerto», Carrer Cervantes 22). */
const LAT = 39.7656305
const LON = 3.1569732

const INDIGO = '#2f2590'
/** El añil hondo de `--indigo-deep`: el velo de la carátula tira a oscuro para que la marca se lea. */
const INDIGO_HONDO = '#1c1660'
/** El azafrán de la web (`--saffron` en base.css): el acento que ya conoce quien visita el sitio. */
const AZAFRAN = '#f2a93b'

/**
 * Las formas del logo, calcadas del original del restaurante (`recursos/originales/
 * logo-el-puerto.pdf`, Illustrator). La ola va encajada en un lienzo de 64 × 64 y el logotipo
 * completo —ola, «el puerto» y «restaurante»— en uno de 525.1 × 237.6. Las mismas que usa la web
 * en `src/public/components/Brand.tsx`.
 */
export const WAVE =
  'M0 54.64L0 61.71C26.82 62.74 32.14 15.56 46.15 24.2C35.08 44.13 49.33 57.07 64 59.62L63.86 51.8C45.08 47.88 44.92 28.36 58.56 22.78C20.92 1.26 28.72 53.98 0 54.64'

export const LOGO = [
  'M219.7 139.3L239.9 127.3C237.9 125.6 235.5 124.8 232.7 124.8C229.3 124.8 226.2 126.1 223.6 128.7C221 131.3 219.7 134.3 219.7 137.9ZM248.1 145.5L249.6 153.2C244.3 157.2 238.8 159.2 233.3 159.2C227.4 159.2 222.4 157.2 218.3 153.2C214.2 149.3 212.1 144.4 212.1 138.6C212.1 132.9 214.1 128.1 218.1 124C222.1 120 227 118 232.7 118C240.8 118 246.7 121.6 250.6 128.7L222.1 145.5C224.7 149.7 228.4 151.9 233.2 151.9C237.6 151.9 242.6 149.7 248.1 145.5',
  'M257.6 158.7L257.6 105L264.8 104L264.8 157.7ZM257.6 158.7',
  'M316.2 124.8C312.3 124.8 308.9 126.1 306.2 128.7C303.5 131.3 302.1 134.5 302.1 138.2C302.1 142.1 303.4 145.3 306.1 147.9C308.7 150.6 311.9 151.9 315.8 151.9C319.4 151.9 322.5 150.6 325.1 147.9C327.6 145.2 328.9 142 328.9 138.2C328.9 134.4 327.7 131.3 325.3 128.7C322.8 126.1 319.8 124.8 316.2 124.8M302.5 153.3L302.5 170.7L295.3 171.7L295.3 119.6L302.5 118.5L302.5 124.2C306.6 120.1 311.1 118 316.2 118C321.9 118 326.7 120 330.6 124C334.4 127.9 336.4 132.9 336.4 138.8C336.4 144.4 334.4 149.1 330.4 153.1C326.4 157.2 321.7 159.2 316.3 159.2C313.4 159.2 311 158.7 309.1 157.9C307.1 157.1 304.9 155.5 302.5 153.3',
  'M377.5 118.5L377.5 157.6L370.3 158.7L370.3 153.3C366.8 157.2 362.9 159.2 358.5 159.2C356.5 159.2 354.5 158.8 352.6 158.1C350.7 157.3 348.9 156.1 347.1 154.2C345.4 152.4 344.6 148.7 344.6 143.1L344.6 119.6L351.8 118.5L351.8 143.1C351.8 149 354.4 151.9 359.7 151.9C361.2 151.9 362.7 151.6 364.2 150.9C365.6 150.3 366.8 149.5 367.7 148.4C368.7 147.3 369.4 146.1 369.7 144.8C370.1 143.5 370.3 141.6 370.3 139.1L370.3 119.6ZM377.5 118.5',
  'M393.3 139.3L413.5 127.3C411.5 125.6 409.1 124.8 406.3 124.8C402.8 124.8 399.8 126.1 397.2 128.7C394.6 131.3 393.3 134.3 393.3 137.9ZM421.7 145.5L423.2 153.2C417.9 157.2 412.4 159.2 406.9 159.2C401 159.2 396 157.2 391.9 153.2C387.8 149.3 385.7 144.4 385.7 138.6C385.7 132.9 387.7 128.1 391.7 124C395.7 120 400.6 118 406.3 118C414.4 118 420.3 121.6 424.2 128.7L395.7 145.5C398.3 149.7 402 151.9 406.8 151.9C411.2 151.9 416.2 149.7 421.7 145.5',
  'M454.7 118L451.3 125.2L449.6 125.2C445.9 125.2 443.3 126.4 441.8 128.7C440.2 131 439.3 133.2 438.9 135.2C438.6 137.2 438.4 140 438.4 143.7L438.4 157.6L431.2 158.7L431.2 119.6L438.4 118.5L438.4 126.5C440 123.3 441.8 121.1 443.9 119.7C446 118.4 448.6 117.7 451.8 117.7ZM454.7 118',
  'M478.5 125.6L467.6 125.6L467.6 145.2C467.6 149.8 469.9 152 474.5 152C476 152 477.8 151.8 479.9 151.3L478.5 158.5C476.4 158.8 474.6 159 473 159C464.6 159 460.4 154.4 460.4 145.2L460.4 125.6L454.4 125.6L457.1 118.8L460.4 118.8L460.4 108.9L467.6 107L467.6 118.8L478.5 118.8ZM478.5 125.6',
  'M504.2 124.8C500.4 124.8 497.2 126.1 494.6 128.7C492 131.3 490.6 134.5 490.6 138.3C490.6 142.2 492 145.4 494.6 148C497.2 150.6 500.6 151.9 504.6 151.9C508.3 151.9 511.4 150.6 513.9 148.1C516.4 145.6 517.7 142.5 517.7 138.8C517.7 134.7 516.4 131.4 513.9 128.7C511.3 126.1 508.1 124.8 504.2 124.8M504.1 118C510.2 118 515.2 120 519.2 124C523.1 127.9 525.1 132.9 525.1 139C525.1 144.7 523.1 149.5 519.2 153.4C515.2 157.2 510.3 159.2 504.3 159.2C498.3 159.2 493.2 157.2 489.2 153.3C485.2 149.4 483.2 144.5 483.2 138.5C483.2 132.9 485.2 128.1 489.3 124C493.4 120 498.3 118 504.1 118',
  'M0 206.3L0 233.6C103.6 237.6 124.2 55.3 178.3 88.7C135.6 165.6 190.6 215.6 247.3 225.5L246.8 195.3C174.2 180.2 173.6 104.7 226.3 83.2C80.8 0 111 203.7 0 206.3',
  'M361.6 173.4L364.2 173.4L364.2 177L364.3 177C365.6 174.3 367.5 172.9 370.5 173L370.5 176C366 176 364.4 178.6 364.4 182.8L364.4 190.4L361.6 190.4ZM361.6 173.4',
  'M383.8 180.3C383.7 177.6 381.7 175.5 378.9 175.5C376 175.5 374.3 177.7 374.1 180.3ZM386.5 185C385.8 188.8 383.1 190.8 379.3 190.8C373.8 190.8 371.3 187 371.1 181.9C371.1 176.8 374.5 173 379.1 173C385.1 173 386.9 178.6 386.8 182.8L374.1 182.8C374 185.7 375.6 188.3 379.4 188.3C381.7 188.3 383.3 187.2 383.8 185ZM386.5 185',
  'M391.4 185C391.5 187.5 393.6 188.3 395.9 188.3C397.7 188.3 400 187.9 400 185.8C400 183.6 397.3 183.3 394.5 182.7C391.7 182 388.9 181.1 388.9 177.9C388.9 174.4 392.3 173 395.3 173C399 173 402 174.2 402.2 178.4L399.4 178.4C399.2 176.2 397.3 175.5 395.5 175.5C393.8 175.5 391.9 176 391.9 177.7C391.9 179.7 394.8 180 397.4 180.6C400.2 181.2 403 182.2 403 185.4C403 189.5 399.2 190.8 395.8 190.8C392 190.8 388.7 189.2 388.6 185ZM391.4 185',
  'M409.9 173.4L413.3 173.4L413.3 175.9L409.9 175.9L409.9 186.4C409.9 187.7 410.3 187.9 412 187.9L413.3 187.9L413.3 190.4L411.2 190.4C408.3 190.4 407.1 189.8 407.1 186.7L407.1 175.9L404.3 175.9L404.3 173.4L407.1 173.4L407.1 168.3L409.9 168.3ZM409.9 173.4',
  'M426.9 181.6C425.8 182.4 423.7 182.5 421.8 182.8C420 183.1 418.4 183.8 418.4 185.8C418.4 187.7 420 188.3 421.7 188.3C425.4 188.3 426.9 186 426.9 184.5ZM431.4 190.3C430.9 190.6 430.3 190.8 429.4 190.8C428 190.8 427.1 190 427.1 188.2C425.5 190 423.5 190.8 421.1 190.8C418 190.8 415.5 189.4 415.5 186C415.5 182.2 418.3 181.4 421.2 180.8C424.3 180.2 426.9 180.4 426.9 178.3C426.9 175.9 424.9 175.5 423.2 175.5C420.8 175.5 419.1 176.2 418.9 178.7L416.1 178.7C416.3 174.5 419.5 173 423.3 173C426.4 173 429.7 173.7 429.7 177.7L429.7 186.4C429.7 187.7 429.7 188.3 430.6 188.3C430.8 188.3 431.1 188.3 431.4 188.2ZM431.4 190.3',
  'M448.1 190.4L445.4 190.4L445.4 187.7L445.4 187.7C444.2 189.8 442.3 190.8 439.9 190.8C435.4 190.8 434 188.2 434 184.6L434 173.4L436.8 173.4L436.8 184.9C436.8 187 438.1 188.3 440.2 188.3C443.6 188.3 445.3 186.1 445.3 183L445.3 173.4L448.1 173.4ZM448.1 190.4',
  'M452.2 173.4L454.8 173.4L454.8 177L454.9 177C456.2 174.3 458.1 172.9 461.1 173L461.1 176C456.6 176 454.9 178.6 454.9 182.8L454.9 190.4L452.2 190.4ZM452.2 173.4',
  'M473.7 181.6C472.6 182.4 470.5 182.5 468.6 182.8C466.8 183.1 465.2 183.8 465.2 185.8C465.2 187.7 466.8 188.3 468.5 188.3C472.2 188.3 473.7 186 473.7 184.5ZM478.2 190.3C477.7 190.6 477.1 190.8 476.2 190.8C474.8 190.8 473.8 190 473.8 188.2C472.3 190 470.2 190.8 467.9 190.8C464.8 190.8 462.3 189.4 462.3 186C462.3 182.2 465.1 181.4 468 180.8C471.1 180.2 473.7 180.4 473.7 178.3C473.7 175.9 471.7 175.5 469.9 175.5C467.6 175.5 465.8 176.2 465.7 178.7L462.9 178.7C463.1 174.5 466.3 173 470.1 173C473.2 173 476.5 173.7 476.5 177.7L476.5 186.4C476.5 187.7 476.5 188.3 477.4 188.3C477.6 188.3 477.9 188.3 478.2 188.2ZM478.2 190.3',
  'M480.8 173.4L483.4 173.4L483.4 176.1L483.5 176.1C484.7 174 486.6 173 489 173C493.5 173 494.8 175.6 494.8 179.2L494.8 190.4L492.1 190.4L492.1 178.9C492.1 176.8 490.7 175.5 488.6 175.5C485.2 175.5 483.6 177.8 483.6 180.8L483.6 190.4L480.8 190.4ZM480.8 173.4',
  'M502.9 173.4L506.3 173.4L506.3 175.9L502.9 175.9L502.9 186.4C502.9 187.7 503.3 187.9 505 187.9L506.3 187.9L506.3 190.4L504.2 190.4C501.3 190.4 500.1 189.8 500.1 186.7L500.1 175.9L497.2 175.9L497.2 173.4L500.1 173.4L500.1 168.3L502.9 168.3ZM502.9 173.4',
  'M521.2 180.3C521 177.6 519 175.5 516.3 175.5C513.4 175.5 511.6 177.7 511.4 180.3ZM523.9 185C523.1 188.8 520.4 190.8 516.6 190.8C511.2 190.8 508.6 187 508.5 181.9C508.5 176.8 511.8 173 516.4 173C522.4 173 524.3 178.6 524.1 182.8L511.4 182.8C511.3 185.7 513 188.3 516.7 188.3C519 188.3 520.6 187.2 521.1 185ZM523.9 185',
]

/** El logotipo entero, pintado de un color, con la ola arrancando en el origen. */
const logoSvg = (fill) => LOGO.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')

const exists = (file) => stat(file).then(() => true, () => false)

async function fotos() {
  await mkdir(IMG, { recursive: true })
  let hechas = 0
  for (const name of (await readdir(ORIGINALES)).sort()) {
    if (NO_PUBLICAR.has(name) || !/\.(jpe?g|png)$/i.test(name)) continue
    const source = join(ORIGINALES, name)
    const target = join(IMG, `${basename(name, extname(name))}.webp`)
    const [src, out] = await Promise.all([stat(source), stat(target).catch(() => null)])
    if (out && out.mtimeMs >= src.mtimeMs) continue
    await sharp(source)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(target)
    hechas += 1
  }
  console.log(`[recursos] ${hechas} fotos convertidas a webp`)
}

const iconSvg = ({ size, padding = 0, round = 14 }) => {
  const inner = 64 - padding * 2
  const scale = inner / 64
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
    <rect width="64" height="64" rx="${round}" fill="${INDIGO}"/>
    <g transform="translate(${padding} ${padding}) scale(${scale})"><path d="${WAVE}" fill="#fff"/></g>
  </svg>`)
}

/**
 * Un .ico con varias medidas dentro. El formato es una cabecera de 6 bytes, una entrada de 16 por
 * medida y los PNG pegados detrás: Windows y los navegadores admiten PNG dentro del .ico desde
 * Vista, y así el archivo pesa unos pocos kB en vez de guardar mapas de bits sin comprimir.
 */
async function ico(sizes) {
  const pngs = await Promise.all(
    sizes.map((size) => sharp(iconSvg({ size, padding: size <= 32 ? 3 : 4 })).png({ compressionLevel: 9 }).toBuffer()),
  )
  const head = Buffer.alloc(6)
  head.writeUInt16LE(0, 0) // reservado
  head.writeUInt16LE(1, 2) // 1 = icono
  head.writeUInt16LE(sizes.length, 4)
  let offset = 6 + sizes.length * 16
  const entries = pngs.map((png, i) => {
    const entry = Buffer.alloc(16)
    entry[0] = sizes[i] >= 256 ? 0 : sizes[i] // ancho (0 significa 256)
    entry[1] = sizes[i] >= 256 ? 0 : sizes[i] // alto
    entry.writeUInt16LE(0, 4) // planos
    entry.writeUInt16LE(32, 6) // bits por píxel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })
  return Buffer.concat([head, ...entries, ...pngs])
}

async function iconos() {
  await mkdir(ICONS, { recursive: true })
  // El favicon vectorial se ve nítido en cualquier densidad y pesa menos de 1 kB.
  await writeFile(join(PUBLIC, 'favicon.svg'), iconSvg({ size: 64, padding: 4 }))
  await sharp(iconSvg({ size: 512, padding: 4 })).png().toFile(join(ICONS, 'icon-512.png'))
  await sharp(iconSvg({ size: 192, padding: 4 })).png().toFile(join(ICONS, 'icon-192.png'))
  // iOS redondea la esquina por su cuenta: el icono va a sangre, sin radio.
  await sharp(iconSvg({ size: 180, padding: 6, round: 0 })).png().toFile(join(ICONS, 'apple-touch-icon.png'))
  // Android recorta el icono «maskable» en círculo: la ola tiene que caber en la zona segura.
  await sharp(iconSvg({ size: 512, padding: 13, round: 0 })).png().toFile(join(ICONS, 'icon-maskable-512.png'))
  await sharp(iconSvg({ size: 32, padding: 4 })).png().toFile(join(ICONS, 'favicon-32.png'))
  // Quien pide `/favicon.ico` a ciegas —navegadores viejos, buscadores, algún previsualizador de
  // enlaces— se llevaba un 404 y ponía un icono en blanco. El .ico lleva las tres medidas dentro.
  await writeFile(join(PUBLIC, 'favicon.ico'), await ico([16, 32, 48]))
  console.log('[recursos] iconos listos')
}

/**
 * La tarjeta que se ve al compartir el enlace (WhatsApp, Facebook, Google…): la foto del arroz
 * de marisco a sangre, no la marca sobre un cartel de color. Quien recibe el enlace en el móvil
 * ve primero comida; la marca se lee encima, sobre un velo añil que solo cubre la mitad de abajo
 * para no apagar el arroz.
 *
 * La marca va abajo a la izquierda y no centrada: WhatsApp a veces recorta la tira en cuadrado,
 * y ese recorte se lleva los lados por igual, así que el bloque queda dentro.
 */
async function og() {
  const target = join(PUBLIC, 'og.jpg')
  const ANCHO = 1200
  const ALTO = 630
  const FUENTE = 'Helvetica Neue, Helvetica, Arial, sans-serif'

  /**
   * La foto es vertical (1200 × 1600): se recorta la franja de arriba, la que lleva el borde de
   * la paellera, las gambas y los limones. Sin el borde parecía un primer plano de arroz y no
   * se entendía que era una paella.
   */
  const arroz = await sharp(join(ORIGINALES, 'arroz-marisco.jpg'))
    .extract({ left: 0, top: 24, width: ANCHO, height: ALTO })
    .modulate({ saturation: 1.14, brightness: 1.05 })
    .toBuffer()

  /** Dos velos: uno que sube desde abajo y otro por la izquierda, recortado para no tocar el arroz de arriba. */
  const velo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <defs>
      <linearGradient id="abajo" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#0e0b28" stop-opacity=".93"/>
        <stop offset=".26" stop-color="#141038" stop-opacity=".62"/>
        <stop offset=".5" stop-color="${INDIGO_HONDO}" stop-opacity=".2"/>
        <stop offset=".78" stop-color="${INDIGO}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="lado" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0e0b28" stop-opacity=".66"/>
        <stop offset=".5" stop-color="#0e0b28" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="corte" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#fff" stop-opacity="1"/>
      </linearGradient>
      <mask id="soloAbajo"><rect y="150" width="${ANCHO}" height="${ALTO - 150}" fill="url(#corte)"/></mask>
    </defs>
    <rect width="${ANCHO}" height="${ALTO}" fill="url(#lado)" mask="url(#soloAbajo)"/>
    <rect width="${ANCHO}" height="${ALTO}" fill="url(#abajo)"/>
  </svg>`)

  const logoAncho = 360
  const logoAlto = (logoAncho * 237.6) / 525.1
  const x = 76
  const y = 286
  const marca = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <g transform="translate(${x} ${y}) scale(${logoAncho / 525.1})">${logoSvg('#fff')}</g>
    <rect x="${x + 3}" y="${y + logoAlto + 30}" width="64" height="3" fill="${AZAFRAN}"/>
    <text x="${x}" y="${y + logoAlto + 86}" fill="#fff" font-family="${FUENTE}" font-size="38" font-weight="600" letter-spacing="1.5">Restaurante y arrocería</text>
    <text x="${x + 2}" y="${y + logoAlto + 128}" fill="${AZAFRAN}" font-family="${FUENTE}" font-size="21" font-weight="600" letter-spacing="5.5">CAN PICAFORT · MALLORCA</text>
  </svg>`)

  await sharp(arroz)
    .composite([{ input: velo }, { input: marca }])
    .jpeg({ quality: 86, progressive: true, chromaSubsampling: '4:4:4' })
    .toFile(target)
  console.log('[recursos] og.jpg listo')
}

/** Coordenadas de tesela (con decimales) para una latitud/longitud y un zoom. */
const tile = (lat, lon, zoom) => {
  const n = 2 ** zoom
  const rad = (lat * Math.PI) / 180
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  }
}

async function mapa() {
  const target = join(IMG, 'mapa.webp')
  if (await exists(target)) return console.log('[recursos] mapa.webp ya existe; no se descarga de nuevo')
  const ZOOM = 18
  const TILE = 256
  const WIDTH = 1200
  const HEIGHT = 760
  const center = tile(LAT, LON, ZOOM)
  const px = center.x * TILE
  const py = center.y * TILE
  const left = px - WIDTH / 2
  const top = py - HEIGHT / 2
  const pieces = []
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + WIDTH) / TILE); tx += 1) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + HEIGHT) / TILE); ty += 1) {
      const url = `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`
      const response = await fetch(url, { headers: { 'user-agent': 'restaurante-el-puerto-web/1.0 (mapa estático, descarga única)' } })
      if (!response.ok) throw new Error(`${response.status} al pedir ${url}`)
      pieces.push({ input: Buffer.from(await response.arrayBuffer()), left: Math.round(tx * TILE - left), top: Math.round(ty * TILE - top) })
    }
  }
  // Se compone sobre un lienzo mayor y se recorta: sharp no admite piezas con coordenadas negativas.
  const pad = TILE
  const canvas = await sharp({ create: { width: WIDTH + pad * 2, height: HEIGHT + pad * 2, channels: 4, background: '#f2efe9' } })
    .composite(pieces.map((piece) => ({ ...piece, left: piece.left + pad, top: piece.top + pad })))
    .png()
    .toBuffer()
  await sharp(canvas)
    .extract({ left: pad, top: pad, width: WIDTH, height: HEIGHT })
    // Menos saturado: el mapa acompaña a la paleta de la web, no compite con ella.
    .modulate({ saturation: 0.7, brightness: 1.02 })
    .webp({ quality: 80, effort: 6 })
    .toFile(target)
  console.log('[recursos] mapa.webp listo (© OpenStreetMap contributors)')
}

await fotos()
await iconos()
await og()
await mapa()
