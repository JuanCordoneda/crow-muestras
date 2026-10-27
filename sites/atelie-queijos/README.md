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
