/**
 * Descarga las tipografías a `public/fonts/` y escribe `src/shared/styles/fonts.css`.
 *
 * Se piden en formato variable (`wght@400..800`): un solo fichero cubre todos los pesos,
 * donde antes hacían falta uno por peso.
 *
 * - Cormorant Garamond, para los titulares y los nombres de los tratamientos: una garamond de
 *   cartel, fina y con mucho aire, con su cursiva para la palabra que se canta en cada título.
 *   Se pide solo el tramo de pesos que usa la web (500–600), que es lo que más adelgaza el fichero.
 * - Manrope, para el texto: se lee bien a tamaño pequeño en la pantalla de un móvil.
 *
 * Solo se guarda el subconjunto latin: la web está en castellano e inglés, y todo lo que
 * escriben (á, ñ, ü, ¿, ¡, €) cae dentro. Latin-ext, cirílico y griego nunca llegan a pintarse.
 */
import { writeFile, readFile, mkdir, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const QUERY =
  'family=Manrope:wght@400..800' +
  '&family=Cormorant+Garamond:ital,wght@0,500..600;1,500..600' +
  '&display=swap'

/** Google devuelve woff2 solo si el agente parece un navegador moderno. */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
const KEEP = new Set([LATIN])

const dir = fileURLToPath(new URL('../public/fonts', import.meta.url))

const fetchText = async (url) => {
  const response = await fetch(url, { headers: { 'user-agent': UA } })
  if (!response.ok) throw new Error(`${response.status} al pedir ${url}`)
  return response.text()
}

async function main() {
  await mkdir(dir, { recursive: true })
  const css = await fetchText(`https://fonts.googleapis.com/css2?${QUERY}`)
  const blocks = [...css.matchAll(/\/\*\s*([\w\-[\]]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]

  const rules = []
  let downloaded = 0
  let bytes = 0

  for (const [, label, block] of blocks) {
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1].trim()
    if (!range || !KEEP.has(range)) continue

    const url = /url\((https:\/\/[^)]+\.woff2)\)/.exec(block)[1]
    const family = /font-family:\s*'([^']+)'/.exec(block)[1].replace(/\s+/g, '')
    const weight = /font-weight:\s*([\d ]+);/.exec(block)[1].trim().replace(/\s+/g, '-')
    const italic = block.includes('font-style: italic')
    const name = `${family}-${weight}${italic ? '-italic' : ''}-${label}.woff2`
    const target = join(dir, name)

    if (!(await stat(target).catch(() => null))) {
      const response = await fetch(url, { headers: { 'user-agent': UA } })
      await writeFile(target, Buffer.from(await response.arrayBuffer()))
      downloaded++
    }
    bytes += (await stat(target)).size
    const rule = block.replace(url, `/fonts/${name}`).replace('@font-face {', '@font-face{')
    rules.push(rule)
  }

  /**
   * Los ejes que no se usan se recortan aquí (ver scripts/recortar-fuentes.py): son casi la mitad
   * del peso de la cursiva. Si no hay Python con fontTools, se deja tal cual y la web va igual.
   */
  await promisify(execFile)('python3', [fileURLToPath(new URL('./recortar-fuentes.py', import.meta.url)), dir])
    .then(({ stdout }) => process.stdout.write(stdout))
    .catch(() => console.log('[fuentes] sin Python/fontTools: no se recortan los ejes de las variables.'))

  const header =
    '/* fonts.css — generado por `npm run fonts`. No editar a mano.\n' +
    '   Tipografías variables auto-alojadas: ni salto a Google Fonts ni un fichero por peso. */\n'
  await writeFile(fileURLToPath(new URL('../src/shared/styles/fonts.css', import.meta.url)), header + rules.join('\n') + '\n')
  console.log(`[fonts] ${rules.length} reglas, ${downloaded} ficheros nuevos, ${(bytes / 1024).toFixed(0)} kB en total.`)
}

main().catch((error) => { console.error(error); process.exit(1) })
