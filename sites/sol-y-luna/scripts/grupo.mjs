/**
 * Recursos del grupo (El Sol & La Luna · Mexi & Co · Le 1492), a partir de las fotos ya pasadas a
 * webp en `public/img/grupo/`:
 *
 * - El mapa estático del Quartier Latin (`public/img/grupo/mapa-quartier.webp`), con teselas de
 *   OpenStreetMap y los dos locales marcados: están uno enfrente del otro, así que un solo mapa
 *   sirve para los dos. Las teselas se descargan una sola vez y se guardan en `recursos/`
 *   (política de uso de tile.openstreetmap.org).
 * - El emblema (un sol de papel picado): favicon, iconos de la app y apple-touch.
 * - La imagen para compartir en redes (`public/og.jpg`, 1200×630).
 *
 * Es idempotente: `node scripts/grupo.mjs && npm run images`.
 */
import sharp from 'sharp'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PUBLIC = join(ROOT, 'public')
const GRUPO = join(PUBLIC, 'img', 'grupo')
const ICONS = join(PUBLIC, 'icons')

/** Los dos locales en OpenStreetMap (Nominatim): 31 rue Saint-Jacques y 10 rue Dante. */
const SOL = { lat: 48.8512811, lon: 2.345938 }
const MEXI = { lat: 48.851126, lon: 2.3460443 }

const TERRACOTA = '#c2502e'
const SOL_AMARILLO = '#f2b632'
const NOCHE = '#1f2a44'
const CREMA = '#fbf3e4'

const exists = (file) => stat(file).then(() => true, () => false)

/** El sol del emblema: doce rayos alternos alrededor de un disco, en un lienzo de 64 × 64. */
const sunSvg = (rays = SOL_AMARILLO, disc = SOL_AMARILLO, ring = NOCHE) => {
  const parts = []
  for (let index = 0; index < 12; index += 1) {
    const angle = (index * Math.PI * 2) / 12
    const long = index % 2 === 0
    const r1 = 17
    const r2 = long ? 29 : 25
    const spread = long ? 0.17 : 0.13
    const point = (radius, delta) => `${(32 + radius * Math.sin(angle + delta)).toFixed(2)} ${(32 - radius * Math.cos(angle + delta)).toFixed(2)}`
    parts.push(`<path d="M${point(r1, -spread)} L${point(r2, 0)} L${point(r1, spread)} Z" fill="${rays}"/>`)
  }
  return `${parts.join('')}<circle cx="32" cy="32" r="14" fill="${disc}"/><circle cx="32" cy="32" r="9.5" fill="none" stroke="${ring}" stroke-width="2.2" opacity=".9"/>`
}

async function iconos() {
  await mkdir(ICONS, { recursive: true })
  const icono = (size, padding) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${NOCHE}"/>
    <g transform="translate(${padding} ${padding}) scale(${(64 - padding * 2) / 64})">${sunSvg()}</g>
  </svg>`)
  await sharp(icono(512, 6)).png().toFile(join(ICONS, 'icon-512.png'))
  await sharp(icono(512, 6)).resize(192).png().toFile(join(ICONS, 'icon-192.png'))
  // La versión «maskable» deja más margen: Android la recorta en círculo.
  await sharp(icono(512, 14)).png().toFile(join(ICONS, 'icon-maskable-512.png'))
  await sharp(icono(180, 8)).png().toFile(join(ICONS, 'apple-touch-icon.png'))
  await sharp(icono(64, 2)).resize(32).png().toFile(join(ICONS, 'favicon-32.png'))
  // Un PNG con extensión .ico: todos los navegadores lo aceptan, y sharp no escribe ICO.
  await sharp(icono(64, 2)).resize(32).png().toFile(join(PUBLIC, 'favicon.ico'))
  await writeFile(join(PUBLIC, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${NOCHE}"/><g transform="translate(3 3) scale(.906)">${sunSvg()}</g></svg>\n`)
  console.log('[grupo] iconos listos')
}

async function og() {
  const ANCHO = 1200
  const ALTO = 630
  const FUENTE = 'Georgia, Times New Roman, serif'
  const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  const foto = await sharp(join(GRUPO, 'sol-interieur-lustre.webp'))
    .resize(ANCHO, ALTO, { fit: 'cover', position: 'centre' })
    .modulate({ saturation: 1.08, brightness: 1.02 })
    .toBuffer()
  const velo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <defs>
      <linearGradient id="lado" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#121a2e" stop-opacity=".92"/>
        <stop offset=".55" stop-color="${NOCHE}" stop-opacity=".55"/>
        <stop offset="1" stop-color="${NOCHE}" stop-opacity=".05"/>
      </linearGradient>
    </defs>
    <rect width="${ANCHO}" height="${ALTO}" fill="url(#lado)"/>
  </svg>`)
  const x = 72
  const marca = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <g transform="translate(${x} 118) scale(1.5)">${sunSvg()}</g>
    <text x="${x}" y="276" fill="${SOL_AMARILLO}" font-family="${SANS}" font-size="22" font-weight="700" letter-spacing="5">QUARTIER LATIN · PARIS 5e</text>
    <text x="${x - 2}" y="350" fill="#fff" font-family="${FUENTE}" font-size="62">3 adresses latines</text>
    <text x="${x - 2}" y="420" fill="#fff" font-family="${FUENTE}" font-size="62" font-style="italic">au cœur du Quartier Latin</text>
    <rect x="${x}" y="456" width="64" height="4" fill="${TERRACOTA}"/>
    <text x="${x}" y="508" fill="${CREMA}" font-family="${SANS}" font-size="26" font-weight="600">El Sol &amp; La Luna · Mexi &amp; Co · Le 1492</text>
  </svg>`)
  await sharp(foto)
    .composite([{ input: velo }, { input: marca }])
    .jpeg({ quality: 86, progressive: true, chromaSubsampling: '4:4:4' })
    .toFile(join(PUBLIC, 'og.jpg'))
  console.log('[grupo] og.jpg listo')
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
  const target = join(GRUPO, 'mapa-quartier.webp')
  const base = join(ROOT, 'recursos', 'mapa-quartier-base.png')
  const ZOOM = 18
  const TILE = 256
  const WIDTH = 1200
  const HEIGHT = 760
  const center = tile((SOL.lat + MEXI.lat) / 2, (SOL.lon + MEXI.lon) / 2, ZOOM)
  const left = center.x * TILE - WIDTH / 2
  const top = center.y * TILE - HEIGHT / 2

  if (!(await exists(base))) {
    const pieces = []
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + WIDTH) / TILE); tx += 1) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + HEIGHT) / TILE); ty += 1) {
        const url = `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`
        const response = await fetch(url, { headers: { 'user-agent': 'mexi-and-co-web/1.0 (mapa estático, descarga única)' } })
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
    await mkdir(join(ROOT, 'recursos'), { recursive: true })
    await sharp(canvas).extract({ left: pad, top: pad, width: WIDTH, height: HEIGHT }).png().toFile(base)
  }

  const at = (place) => {
    const point = tile(place.lat, place.lon, ZOOM)
    return { x: point.x * TILE - left, y: point.y * TILE - top }
  }
  const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  /** Chincheta con su etiqueta: la de El Sol hacia arriba a la izquierda, la de Mexi abajo a la derecha. */
  const pin = ({ x, y }, color, label, side) => {
    const width = label.length * 13 + 34
    const lx = side === 'left' ? x - width - 18 : x + 18
    const ly = side === 'left' ? y - 74 : y + 22
    return `
      <path d="M${x} ${y} C ${x - 22} ${y - 30} ${x - 22} ${y - 58} ${x} ${y - 58} C ${x + 22} ${y - 58} ${x + 22} ${y - 30} ${x} ${y} Z" fill="${color}" stroke="#fff" stroke-width="4"/>
      <circle cx="${x}" cy="${y - 38}" r="8" fill="#fff"/>
      <rect x="${lx}" y="${ly}" width="${width}" height="46" rx="23" fill="${color}" stroke="#fff" stroke-width="3"/>
      <text x="${lx + width / 2}" y="${ly + 30}" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="22" font-weight="700">${label}</text>`
  }
  const marcas = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    ${pin(at(SOL), TERRACOTA, 'El Sol &amp; La Luna', 'left')}
    ${pin(at(MEXI), NOCHE, 'Mexi &amp; Co', 'right')}
  </svg>`)
  // Menos saturado y un punto cálido: el mapa acompaña a la paleta de la web, no compite con ella.
  // En dos pasos: si no, sharp tiñe también las chinchetas que se pegan encima.
  const fondo = await sharp(base).modulate({ saturation: 0.55, brightness: 1.03 }).tint({ r: 251, g: 243, b: 228 }).png().toBuffer()
  await sharp(fondo)
    .composite([{ input: marcas }])
    .webp({ quality: 80, effort: 6 })
    .toFile(target)
  console.log('[grupo] mapa-quartier.webp listo (© OpenStreetMap contributors)')
}

await mapa()
await iconos()
await og()
