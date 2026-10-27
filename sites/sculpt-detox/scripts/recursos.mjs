/**
 * Prepara las imágenes de la web de Sculpt Detox a partir de `recursos/sculptdetox/`, que son los
 * originales descargados de la web anterior (solo lo que estaba en /wp-content/uploads/ y era del
 * negocio: la web vieja tenía spam inyectado y de ahí no se ha copiado nada más).
 *
 * - Las fotos que usa la web → `public/img/sculptdetox/<nombre>.webp` (1600 px como mucho).
 *   Las variantes de 240…1200 px las hace después `npm run images`.
 * - El emblema (la figura con la hoja, sin el texto) recortado del logo original, para la
 *   cabecera, los iconos y la carátula.
 * - Iconos de la app (favicon, apple-touch, 192/512 y maskable).
 * - La imagen para compartir en redes (`public/og.jpg`, 1200×630).
 * - El mapa estático de «Dónde estamos» (`public/img/sculptdetox/mapa.webp`), con teselas de
 *   OpenStreetMap centradas en el portal. Se descargan una sola vez: si el mapa ya existe no se
 *   pide nada a la red (política de uso de tile.openstreetmap.org).
 *
 * Es idempotente: `npm run recursos && npm run images`.
 */
import sharp from 'sharp'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ORIGINALES = join(ROOT, 'recursos/sculptdetox')
const PUBLIC = join(ROOT, 'public')
const IMG = join(PUBLIC, 'img/sculptdetox')
const ICONS = join(PUBLIC, 'icons')

/**
 * Las fotos que salen en la web, y nada más. Las de banco de imágenes de la web anterior no se
 * publican (no consta la licencia y no son del centro); las generadas con IA se usan solo donde
 * falta una foto real, y están en la lista de lo que hay que pedirle a Michele.
 */
const FOTOS = [
  'michele-costa-retrato.png',
  'michele-costa-productos-curcuma.png',
  'antes-despues-piernas-cliente.png',
  'antes-despues-lipedema-logo.jpg',
  'ia-michele-drenaje-piernas.png',
  'ia-michele-medicion-cintura.png',
]

/** Carrer de l'Historiador Josep Clapés, 13 (Eivissa), según OpenStreetMap (vía 323997740). */
const LAT = 38.9093535
const LON = 1.4301479

/** La paleta de la web (`src/shared/styles/base.css`). */
const ARENA = '#efe6dc'
const SALVIA_HONDA = '#56684f'
const TERRACOTA = '#c48b6c'
const CARBON = '#2b2b2b'

const exists = (path) => stat(path).then(() => true, () => false)

async function fotos() {
  await mkdir(IMG, { recursive: true })
  let hechas = 0
  for (const name of FOTOS) {
    const source = join(ORIGINALES, name)
    const target = join(IMG, name.replace(/\.(png|jpe?g)$/i, '.webp'))
    const [src, out] = await Promise.all([stat(source), stat(target).catch(() => null)])
    if (out && out.mtimeMs >= src.mtimeMs) continue
    await sharp(source)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(target)
    hechas += 1
  }
  console.log(`[recursos] ${hechas} fotos convertidas a webp`)
}

/**
 * El logo original lleva debajo «Sculpt Detox · Michele Costa · Masoterapeuta» en letra pequeña,
 * que a 44 px de alto en la cabecera no se lee. La figura se recorta por encima del texto (la
 * fila 318 del logo recortado es donde acaba la cinta) y el nombre lo escribe la web con su
 * tipografía, a un tamaño que sí se lee.
 */
async function emblema() {
  const logo = await sharp(join(ORIGINALES, 'logo-original.png')).trim().png().toBuffer()
  const { width } = await sharp(logo).metadata()
  // El logo recortado mide 506 px de ancho en la web: la proporción manda, no los píxeles.
  const corte = Math.round((318 / 506) * width)
  // En dos pasos: en una misma cadena sharp recorta los bordes antes de extraer y no quitaría nada.
  const franja = await sharp(logo).extract({ left: 0, top: 0, width, height: corte }).png().toBuffer()
  const figura = await sharp(franja).trim().png().toBuffer()
  await sharp(figura).png({ compressionLevel: 9 }).toFile(join(IMG, 'emblema.png'))
  // A 40 px de alto en la cabecera, la variante de 240 son 11 kB de más en cada página.
  await sharp(figura).resize({ width: 120 }).webp({ quality: 88, alphaQuality: 100 }).toFile(join(IMG, 'emblema-120.webp'))
  await sharp(logo).resize({ width: 506 }).png({ compressionLevel: 9 }).toFile(join(IMG, 'logo.png'))
  // Solo en PNG: `npm run images` saca de aquí las variantes webp (con transparencia), y un webp
  // con el mismo nombre se pisaría con ellas.
  console.log('[recursos] emblema y logo listos')
  return figura
}

/** El emblema centrado sobre arena, con el aire que pida cada icono. */
const icono = async (figura, size, { padding = 0.14, round = 0.22 } = {}) => {
  const inner = Math.round(size * (1 - padding * 2))
  const mark = await sharp(figura).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const r = Math.round(size * round)
  const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${ARENA}"/></svg>`)
  return sharp(fondo).composite([{ input: mark, gravity: 'center' }]).png({ compressionLevel: 9 }).toBuffer()
}

/**
 * Un .ico con varias medidas dentro. El formato es una cabecera de 6 bytes, una entrada de 16 por
 * medida y los PNG pegados detrás: Windows y los navegadores admiten PNG dentro del .ico desde
 * Vista, y así el archivo pesa unos pocos kB en vez de guardar mapas de bits sin comprimir.
 */
async function ico(figura, sizes) {
  const pngs = await Promise.all(sizes.map((size) => icono(figura, size, { padding: 0.08, round: 0.2 })))
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

async function iconos(figura) {
  await mkdir(ICONS, { recursive: true })
  await writeFile(join(ICONS, 'icon-512.png'), await icono(figura, 512))
  await writeFile(join(ICONS, 'icon-192.png'), await icono(figura, 192))
  // iOS redondea la esquina por su cuenta: el icono va a sangre, sin radio.
  await writeFile(join(ICONS, 'apple-touch-icon.png'), await icono(figura, 180, { round: 0 }))
  // Android recorta el icono «maskable» en círculo: la figura tiene que caber en la zona segura.
  await writeFile(join(ICONS, 'icon-maskable-512.png'), await icono(figura, 512, { padding: 0.22, round: 0 }))
  await writeFile(join(ICONS, 'favicon-32.png'), await icono(figura, 32, { padding: 0.08, round: 0.2 }))
  // El favicon «vectorial» lleva el PNG dentro: el logo no existe en vectores.
  const png = await icono(figura, 96, { padding: 0.08, round: 0.2 })
  await writeFile(join(PUBLIC, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 96 96"><image width="96" height="96" xlink:href="data:image/png;base64,${png.toString('base64')}"/></svg>`)
  // Quien pide `/favicon.ico` a ciegas —navegadores viejos, buscadores, algún previsualizador de
  // enlaces— se llevaba un 404 y ponía un icono en blanco. El .ico lleva las tres medidas dentro.
  await writeFile(join(PUBLIC, 'favicon.ico'), await ico(figura, [16, 32, 48]))
  console.log('[recursos] iconos listos')
}

/**
 * La tarjeta que se ve al compartir el enlace (WhatsApp, Instagram, Google…). Michele a la
 * derecha —una persona de verdad genera más confianza que un cartel— y la marca a la izquierda,
 * sobre arena. WhatsApp a veces recorta la tira en cuadrado por el centro: el texto va dentro.
 */
async function og(figura) {
  const ANCHO = 1200
  const ALTO = 630
  const SERIF = 'Cormorant Garamond, Didot, Georgia, serif'
  const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  const FOTO = 470

  const retrato = await sharp(join(ORIGINALES, 'michele-costa-retrato.png'))
    .resize({ width: FOTO, height: ALTO, fit: 'cover', position: 'top' })
    .toBuffer()
  const marca = await sharp(figura).resize({ height: 150 }).png().toBuffer()
  const texto = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <text x="80" y="330" fill="${CARBON}" font-family="${SERIF}" font-size="76" font-weight="600" letter-spacing="1">Sculpt Detox</text>
    <rect x="82" y="360" width="72" height="2" fill="${TERRACOTA}"/>
    <text x="80" y="418" fill="${CARBON}" font-family="${SANS}" font-size="31" font-weight="500">Remodelación corporal sin cirugía</text>
    <text x="80" y="462" fill="${SALVIA_HONDA}" font-family="${SANS}" font-size="22" font-weight="600" letter-spacing="4">DRENAJE · MADEROTERAPIA · LIPEDEMA</text>
    <text x="80" y="540" fill="${SALVIA_HONDA}" font-family="${SANS}" font-size="22" font-weight="600" letter-spacing="5">IBIZA</text>
  </svg>`)

  await sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: ARENA } })
    .composite([
      { input: retrato, left: ANCHO - FOTO, top: 0 },
      { input: marca, left: 80, top: 92 },
      { input: texto },
    ])
    .jpeg({ quality: 86, progressive: true, chromaSubsampling: '4:4:4' })
    .toFile(join(PUBLIC, 'og.jpg'))
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
  const ZOOM = 17
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
      const response = await fetch(url, { headers: { 'user-agent': 'sculptdetox-web/1.0 (mapa estático, descarga única)' } })
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
    // Casi sin color y un punto cálido: el mapa acompaña a la arena de la web, no compite con ella.
    .modulate({ saturation: 0.35, brightness: 1.03 })
    .tint('#f3e9dd')
    .webp({ quality: 80, effort: 6 })
    .toFile(target)
  console.log('[recursos] mapa.webp listo (© OpenStreetMap contributors)')
}

await fotos()
const figura = await emblema()
await iconos(figura)
await og(figura)
await mapa()
