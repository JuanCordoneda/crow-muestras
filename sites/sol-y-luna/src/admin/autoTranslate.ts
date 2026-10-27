/**
 * Traducción automática al guardar. El encargado escribe en castellano y el resto de idiomas se
 * rellena solo. Se traduce lo que está vacío y lo que se ha quedado viejo: si cambia el castellano
 * y la traducción sigue como estaba, era la del texto anterior. Lo que se ha escrito a mano en otro
 * idioma se respeta. Si el traductor no responde, se guarda igual: la web enseña el castellano y
 * se vuelve a intentar al guardar otra vez.
 */
import type { Localized } from '../shared/types'
import { translateTexts } from '../shared/api'
import { withTimeout } from './helpers'

const TARGETS = ['en', 'de', 'fr'] as const
const TIMEOUT = 60_000

/** Cada texto con cómo estaba antes de editarlo (vacío si es nuevo). */
export type TextChange = { before: Localized | undefined; after: Localized }

/** Devuelve los textos de `changes` con las traducciones que faltaban. */
export async function autoTranslate(changes: TextChange[]): Promise<{ texts: Localized[]; failed: boolean }> {
  const texts = changes.map(({ after }) => ({ ...after }))
  const needs: { index: number; lang: (typeof TARGETS)[number] }[] = []
  changes.forEach(({ before, after }, index) => {
    const source = after.es.trim()
    const changed = source !== (before?.es ?? '').trim()
    for (const lang of TARGETS) {
      const untouched = after[lang] === (before?.[lang] ?? '')
      if (!source) {
        // Sin castellano no hay qué traducir; una traducción de lo que se ha borrado sobra.
        if (changed && untouched) texts[index][lang] = ''
      } else if (!after[lang].trim() || (changed && untouched)) {
        needs.push({ index, lang })
      }
    }
  })
  if (!needs.length) return { texts, failed: false }

  const sources = [...new Set(needs.map(({ index }) => texts[index].es.trim()))]
  try {
    const translated = await withTimeout(translateTexts(sources), TIMEOUT)
    for (const { index, lang } of needs) {
      const result = translated[sources.indexOf(texts[index].es.trim())]?.[lang]
      if (result) texts[index][lang] = result
    }
    return { texts, failed: false }
  } catch {
    // Mejor el castellano en la web que la traducción de un texto que ya no es el suyo.
    for (const { index, lang } of needs) texts[index][lang] = ''
    return { texts, failed: true }
  }
}
