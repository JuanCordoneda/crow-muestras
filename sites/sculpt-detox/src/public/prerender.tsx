/**
 * Lo que usa `scripts/pages.mjs` para escribir el HTML de cada página en el build: el contenido
 * pintado, su título y descripción, y la ficha para Google. Corre en Node, nunca en el navegador.
 */
import { renderToString } from 'react-dom/server'
import { PAGE_PATHS, routeFor, type PageView, type SiteLang } from '../shared/routing'
import { PublicApp, pageMeta } from './PublicApp'
import { textsFor } from './content'
import { jsonLdFor } from './structured-data'

export { PAGE_PATHS, jsonLdFor }

export const renderPage = (path: string) => renderToString(<PublicApp route={routeFor(path)} />)

export const metaFor = (view: PageView, lang: SiteLang) => pageMeta(textsFor(lang), view)

export const ogImageAlt = (lang: SiteLang) =>
  lang === 'es'
    ? 'Sculpt Detox, remodelación corporal sin cirugía en Ibiza, con Michele Costa en su cabina'
    : 'Sculpt Detox, non-surgical body sculpting in Ibiza, with Michele Costa in her treatment room'
