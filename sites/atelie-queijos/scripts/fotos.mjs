/**
 * Las fotos del ateliê, siempre nítidas.
 *
 * Lee los originales de `recursos/originales/atelie/` (tal como salen del teléfono o de la cámara,
 * cuanto más grandes mejor) y escribe en `public/img/atelie/` cada foto en AVIF y en webp, en todos
 * los tamaños que la web puede pedir, de 480 a 2560 px. AVIF pesa un 30–50 % menos con la misma
 * nitidez (comparado a ojo, recorte a recorte); webp queda para los navegadores que no lo leen. El navegador elige el que le cabe según la
 * pantalla y su densidad: un iPhone de 3x se lleva uno de verdad grande y no uno estirado.
 *
 * Reglas, para que nada se vea pixelado:
 * - **Nunca se agranda**: si el original mide 1489 px, la versión más grande es de 1489.
 * - AVIF calidad 50 con el color sin submuestrear (4:4:4) y webp 76 con `smartSubsample`: los bordes
 *   de la corteza y el brillo de las uvas no se emborronan. Las versiones pequeñas llevan un enfoque suave, que es lo
 *   que se pierde al reducir mucho.
 * - Avisa si un original tiene menos de 1600 px de ancho: a pantalla completa en un móvil se va a
 *   notar. La solución es pedir la foto original, no subirle la calidad.
 * - Se gira según la orientación del teléfono y se quitan los metadatos (el GPS incluido).
 *
 * Los recortes (`RECORTES`) son versiones de una foto con otro encuadre: la del héroe en vertical
 * para móviles altos y la cara de Janaína para los avatares.
 *
 * Al final reescribe `src/shared/photo-variants.ts`, que es de donde `Photo` saca el `srcset`.
 * Es idempotente: lo que ya está al día no se rehace. Corre solo antes de cada `npm run build`.
 *
 * Para añadir una foto: dejar el original en `recursos/originales/atelie/` con un nombre en
 * minúsculas y guiones (`janaina-cortando-comte.jpg`) y usar `/img/atelie/janaina-cortando-comte.webp`.
 */
import sharp from 'sharp'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ORIGINALES = join(ROOT, 'recursos/originales/atelie')
const SALIDA = join(ROOT, 'public/img/atelie')
const PUBLICO = '/img/atelie'
const MANIFIESTO = join(ROOT, 'src/shared/photo-variants.ts')

/** Los anchos que se generan (los que superan al original se saltan). */
const ANCHOS = [480, 720, 960, 1280, 1600, 2048, 2560]
/** La versión «completa» nunca pasa de aquí: más no lo pide ninguna pantalla. */
const MAXIMO = 2560
/** Por debajo de esto, a pantalla completa en un móvil de 3x ya se nota. */
const MINIMO_NITIDO = 1600
const WEBP = { quality: 76, smartSubsample: true, effort: 5 }
const AVIF = { quality: 50, chromaSubsampling: '4:4:4', effort: 5 }

/**
 * Otros encuadres de una foto. `ancho`/`alto` recortan con el foco donde está lo interesante
 * (`attention`); `zona` recorta un rectángulo fijo del original (en píxeles del original girado).
 */
const RECORTES = {
  /** El héroe en móviles altos (iPhone, Android de 19,5:9): un 1:2 que no desperdicia píxeles. */
  'tabua-queijos-movil': { de: 'tabua-queijos', ancho: 1440, alto: 2880 },
  /** La cara de Janaína, para el avatar del héroe, de la página de links y de las stories. */
  'janaina-avatar': { de: 'janaina-pedroza', zona: { left: 550, top: 820, width: 480, height: 480 }, ancho: 480 },
}

const esFoto = (file) => ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'].includes(extname(file).toLowerCase())
const masNuevo = async (salida, entrada) => {
  const [a, b] = await Promise.all([stat(salida).catch(() => null), stat(entrada)])
  return Boolean(a) && a.mtimeMs >= b.mtimeMs
}

/** Escribe una imagen (ya girada y recortada) en todos sus tamaños. Devuelve la entrada del manifiesto. */
async function variantes(nombre, base, ancho, origen) {
  const completa = Math.min(ancho, MAXIMO)
  const destino = join(SALIDA, `${nombre}.webp`)
  const tamaños = ANCHOS.filter((w) => w < completa)
  if (!(await masNuevo(destino, origen))) {
    const escribir = async (imagen, sufijo) => {
      await imagen.clone().webp(WEBP).toFile(join(SALIDA, `${nombre}${sufijo}.webp`))
      await imagen.clone().avif(AVIF).toFile(join(SALIDA, `${nombre}${sufijo}.avif`))
    }
    await escribir(base.clone().resize({ width: completa, withoutEnlargement: true, kernel: 'lanczos3' }), '')
    for (const w of tamaños) {
      let paso = base.clone().resize({ width: w, kernel: 'lanczos3' })
      // Reducir mucho ablanda: un enfoque suave en las pequeñas devuelve la textura.
      if (w <= 960) paso = paso.sharpen({ sigma: 0.55 })
      await escribir(paso, `-${w}`)
    }
    hechas.push(nombre)
  }
  return [`${PUBLICO}/${nombre}.webp`, { w: completa, sizes: tamaños, avif: true }]
}

const hechas = []
const avisos = []
await mkdir(SALIDA, { recursive: true })
const ficheros = (await readdir(ORIGINALES).catch(() => [])).filter(esFoto).sort()
if (!ficheros.length) {
  console.log(`[fotos] no hay originales en ${ORIGINALES}`)
  process.exit(0)
}

const manifiesto = {}
const originales = {}
for (const fichero of ficheros) {
  const nombre = basename(fichero, extname(fichero))
  const ruta = join(ORIGINALES, fichero)
  // `rotate()` sin argumentos aplica la orientación del teléfono; luego se trabaja sobre el búfer girado.
  const { data, info } = await sharp(ruta).rotate().toBuffer({ resolveWithObject: true })
  originales[nombre] = { data, info, ruta }
  if (info.width < MINIMO_NITIDO) avisos.push(`${fichero}: ${info.width}×${info.height} px (pedir el original más grande si existe)`)
  const [clave, valor] = await variantes(nombre, sharp(data), info.width, ruta)
  manifiesto[clave] = valor
}

for (const [nombre, recorte] of Object.entries(RECORTES)) {
  const original = originales[recorte.de]
  if (!original) { avisos.push(`recorte ${nombre}: falta el original «${recorte.de}»`); continue }
  let base
  let ancho
  if (recorte.zona) {
    base = sharp(original.data).extract(recorte.zona)
    ancho = Math.min(recorte.ancho, recorte.zona.width)
    if (recorte.ancho > recorte.zona.width) avisos.push(`recorte ${nombre}: la zona mide ${recorte.zona.width} px, menos que los ${recorte.ancho} pedidos`)
    base = sharp(await base.toBuffer())
  } else {
    // Sin agrandar: si el original no llega, el recorte se queda en lo que dé de sí.
    const escala = Math.min(1, original.info.width / recorte.ancho, original.info.height / recorte.alto)
    ancho = Math.round(recorte.ancho * escala)
    base = sharp(await sharp(original.data).resize({ width: ancho, height: Math.round(recorte.alto * escala), fit: 'cover', position: sharp.strategy.attention }).toBuffer())
  }
  const [clave, valor] = await variantes(nombre, base, ancho, original.ruta)
  manifiesto[clave] = valor
}

/* El manifiesto: lo que no es del ateliê (el logo de la agencia…) se queda como estaba. */
const anterior = await readFile(MANIFIESTO, 'utf8').catch(() => '')
const otras = [...anterior.matchAll(/^ {2}'([^']+)': \{ w: (\d+), sizes: \[([^\]]*)\](, avif: true)? \},$/gm)]
  .filter(([, url]) => !url.startsWith(`${PUBLICO}/`))
  .map(([line]) => line)
const nuevas = Object.entries(manifiesto).map(([url, { w, sizes, avif }]) => `  '${url}': { w: ${w}, sizes: [${sizes.join(', ')}]${avif ? ', avif: true' : ''} },`)
const lineas = [...otras, ...nuevas].sort((a, b) => a.localeCompare(b))
await writeFile(MANIFIESTO, `/** Generado por \`npm run images\` (scripts/fotos.mjs). No editar a mano. */\nexport const PHOTO_VARIANTS: Record<string, { w: number; sizes: number[]; avif?: boolean }> = {\n${lineas.join('\n')}\n}\n`)

console.log(`[fotos] ${Object.keys(manifiesto).length} fotos al día${hechas.length ? `, rehechas: ${hechas.join(', ')}` : ''}.`)
for (const aviso of avisos) console.warn(`[fotos] ⚠ ${aviso}`)
