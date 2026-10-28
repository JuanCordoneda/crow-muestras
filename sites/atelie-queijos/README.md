# PariSabor · Ateliê de queijos em Paris

Web de reservas del ateliê de degustación de quesos de Janaína Pedroza de Macedo (@parisabor). Va en
el enlace de la bio de Instagram, así que está hecha **para el móvil** y para una sola cosa:
convertir seguidores en reservas. Portugués (público brasileño) en la raíz, francés en `/fr` e
inglés en `/en`.

| Dirección | Qué es |
| --- | --- |
| `/`, `/fr`, `/en` | La página del ateliê: héroe, qué se vive, Janaína, fechas, reserva, vale-presente, grupos, próximas experiencias, depoimentos y preguntas |
| `/links`, `/fr/links`, `/en/links` | La página «link na bio»: foto, nombre y botones grandes (noindex) |
| `/privacidade`, `/fr/confidentialite`, `/en/privacy` | Privacidad |
| `/reservar`, `/presente`, `/fr/reserver`, `/en/book`… | Atajos para stories: llevan al bloque de la portada |

## Cambiar fechas, plazas, precio o el pago online

Todo está en **`src/public/agenda.ts`**: una línea por sesión (`{ date, time, left }`). Las pasadas
desaparecen solas; `left: 0` la marca como «Esgotado» con lista de espera. Ahí también está el botón
«Pagar online» (Stripe): apagado hasta pegar el enlace y poner `enabled: true`. Después,
`npm run build` y desplegar.

## Cómo reserva el cliente

Sin servidor ni base de datos: el formulario (sesión, personas 1–8, nombre, teléfono, idioma,
¿presente?) arma el mensaje y abre `wa.me/33658007539` con él escrito, en el idioma de la página.
Vale-presente, grupos, lista de espera y «avísame» de las experiencias futuras también van por
WhatsApp, cada uno con su mensaje.

Para que reservar cueste lo mínimo desde el móvil: el botón grande de `/links` llega al formulario
con la próxima sesión ya elegida; «Reservar» en una fecha la elige; el formulario dice cuántas
plazas quedan en esa fecha y recuerda nombre y teléfono en el propio teléfono del visitante (nunca
se envían a ningún sitio). Las horas llevan «Horários de Paris» para quien mira desde Brasil. Si se instala Meta Pixel o Google Analytics, cada clic ya llega
como evento (`track` en `src/public/business.ts`).

## Fotos: siempre nítidas

Los originales van en `recursos/originales/atelie/`, tal como salen del teléfono (cuanto más grandes,
mejor). `npm run images` (y cada `npm run build`) los convierte con `scripts/fotos.mjs` a AVIF + webp
en 480–2560 px. El navegador elige según pantalla y densidad, así que un iPhone de 3x recibe una
foto grande y no una estirada. Nunca se agranda un original: si uno mide menos de 1600 px, el script
avisa. Las fotos del ateliê son los originales del iPhone (3024×4032) sacados del WordPress; la de
Janaína es la de 1489 px, la única que hay. El héroe tiene un recorte vertical 1:2 para móviles y
en escritorio ocupa media pantalla. La primera vez tarda unos minutos; después solo rehace lo que
cambió. Si se sustituye una foto con el mismo nombre, subir `VERSION` en `public/sw.js`.

## Lo interactivo

- **Stories del ateliê**: el avatar del héroe y de `/links` (con anillo) y los destacados de «O que
  você vai viver» abren las fotos como stories de Instagram (barras, toque para pasar, mantener para
  pausar, botón de reservar como sticker de enlace). Textos en `stories` de cada idioma.
- **Quiz «Qual queijo francês tem a sua cara?»**: 3 preguntas, 5 familias, resultado con quesos y
  maridaje, botón de reservar y compartir (menú del teléfono → stories / WhatsApp). La puntuación
  está en `src/public/components/CheeseQuiz.tsx`; los textos, en `quiz`.
- Las tábuas de línea fina se dibujan solas al entrar en pantalla.

## Arranque

```bash
npm install
npm run build     # compila y pinta el HTML de cada página e idioma (scripts/pages.mjs)
npm start         # http://localhost:3000
npm run dev       # Vite con recarga en caliente (el HTML llega sin pintar)
```

## Qué hay dentro

```
src/public/
  agenda.ts         fechas, plazas, precio y pago online  ← lo que se toca en el día a día
  business.ts       contacto, Instagram, dominio, interruptores de «a completar»
  content.ts        todos los textos en portugués (la referencia)
  texts/fr.ts, en.ts  las traducciones; el compilador obliga a completarlas
  format.ts         fechas, horas y precios como se escriben en cada idioma
  PublicApp.tsx     cabecera, cajón, pie y barra fija de WhatsApp + reservar
  pages/            HomePage, LinksPage, PrivacyPage (+ su CSS)
  components/       BookingForm, Figure (foto o hueco «foto a substituir»), Brand, LangPicker
  structured-data.ts  schema.org: organización, cada sesión como evento y las preguntas
public/img/atelie/  fotos del ateliê y de Janaína (de parisabor.com), en webp con variantes
```

El panel `/admin` de la plantilla (la carta de un restaurante) está desconectado en `src/App.tsx`:
su código sigue en `src/admin`, pero no se empaqueta y `/admin` contesta 404.

## Pendiente antes de publicar

- **Fechas reales** en `agenda.ts` (las de ahora son de ejemplo: jueves 18h30 y sábados 11h).
- **Dominio**: está puesto `atelie.parisabor.com` (business.ts, pages.mjs, server.js, index.html,
  sitemap.xml, robots.txt).
- **Respuestas marcadas «a completar»** en las preguntas (dirección, vino, cancelación, niños,
  idioma, cómo llegar) y el punto del vale-presente personalizado: en los tres idiomas. Con
  `SHOW_TEXT_TODO = false` se esconden las etiquetas.
- **Depoimentos reales** (con permiso) en `reviews.items`.
- **Foto de Janaína**: es la del «Sobre» del blog (2017, metro Trocadéro). Mejor una reciente en el
  ateliê, si la hay.
- **Enlace de Stripe** si quiere cobrar por adelantado.
- **SIRET** en la página de privacidad.
