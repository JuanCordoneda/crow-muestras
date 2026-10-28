# Sculpt Detox · Ibiza

Web de Sculpt Detox, el centro de remodelación corporal sin cirugía de Michele Costa en Eivissa
(Carrer de l'Historiador Josep Clapés, 13). Sustituye a la web anterior en WordPress, que estaba
hackeada con enlaces de spam: de ella solo se han rescatado las fotos y el logo del negocio.

Castellano en `/` e inglés en `/en`. Hecha para el móvil y para recibir tráfico de publicidad.
Todas las reservas van por WhatsApp (+34 631 21 32 14).

## Arranque

```bash
npm install
npm run build     # compila y escribe el HTML ya pintado de cada página en dist/
npm start         # http://localhost:3000
npm run dev       # desarrollo con recarga en caliente (Vite, puerto 5173)
```

## Páginas

| Dirección | Inglés | Qué es |
| --- | --- | --- |
| `/` | `/en` | Portada: héroe, lipedema, tratamientos, cómo funciona, Michele, opiniones, reserva, preguntas y ubicación |
| `/lipedema` | `/en/lipedema` | Página propia de lipedema y post-operatorio |
| `/lipedema-ibiza` | `/en/lipedema-ibiza` | Landing de publicidad (sin menú, `noindex`) |
| `/maderoterapia-ibiza` | `/en/wood-therapy-ibiza` | Landing de publicidad (sin menú, `noindex`) |
| `/privacidad` | `/en/privacy` | Privacidad y aviso legal |

## Dónde se cambia cada cosa

- **Precios, duraciones y fotos de los tratamientos:** `src/public/treatments.ts`. Mientras `price`
  sea `null`, la web enseña «Consultar precio» («Price on request»); mientras `minutes` sea `null`, la
  duración no sale. Al rellenarlos vuelve solo «Desde 45 € · 60 min».
- **Datos del negocio** (teléfono, correo, dirección, horario, Instagram, reseñas de Google):
  `src/public/business.ts`.
- **Textos:** `src/public/content.ts` (castellano) y `src/public/texts/en.ts` (inglés). El
  compilador no deja publicar si falta una traducción.
- **Fotos que faltan:** salen como huecos con el letrero «Foto pendiente · …» (componente
  `Figure`). Para quitar los letreros sin tener las fotos: `SHOW_PHOTO_TODO = false` en `business.ts`.
- **Colores y tipografía:** tokens al principio de `src/shared/styles/base.css`.

## Fotos

Los originales están en `recursos/sculptdetox/` (descargados de `/wp-content/uploads/` de la web
anterior). `npm run recursos` convierte a webp las que usa la web (lista `FOTOS` en
`scripts/recursos.mjs`), recorta el emblema del logo, hace los iconos, la imagen para compartir
(`public/og.jpg`) y el mapa; `npm run images` saca las variantes por tamaño. Las fotos de banco de
imágenes de la web anterior no se publican, y tampoco las generadas con IA (drenaje en piernas y
medición de cintura): en la especialidad de la portada va el antes y después de lipedema, en
`/lipedema` el retrato de Michele y «Cómo funciona» queda sin foto hasta tener una real.

## Buscadores y publicidad

- Cada página se pinta en el build (`scripts/pages.mjs`): el HTML ya trae el contenido, título,
  descripción, canónico, `hreflang` es/en y la ficha schema.org `HealthAndBeautyBusiness` (con
  horario, valoración y catálogo de tratamientos), más `FAQPage` en la portada y `/lipedema`.
- El servidor contesta **410 Gone** a todo lo que huele a WordPress (`/wp-*`, `*.php`, `?p=`…) para
  que Google retire antes las páginas de spam de la web hackeada, y **301** desde las direcciones
  antiguas que sí eran del negocio (`/sobre-nosotros`, `/contacto`…).
- Los clics en WhatsApp llaman a `track()` (`business.ts`): el día que se instale Google Analytics,
  Google Ads o el píxel de Meta, llegan solos como evento `whatsapp_click`. Hará falta añadir
  también el aviso de cookies.

## La plantilla

La web sale de la plantilla de restaurante de Crow Agency. Su panel (`src/admin`) y su API
(`server/`) siguen en el repositorio pero están **apagados**: Sculpt Detox no los usa, y la API
solo se enciende con `ENABLE_PANEL_API=1`. Sin esa variable, `/api/*` y `/admin` contestan 404
(salvo `/api/health`).

## Despliegue

Railway corre `npm run build` y `npm start`. En producción: `CANONICAL_HOST=sculptdetox.com` para
que `www.` redirija al dominio sin `www`. Después de apuntar el dominio, dar de alta el sitio en
Search Console, enviar `https://sculptdetox.com/sitemap.xml` y pedir la retirada de las URL de spam
que sigan saliendo en Google.
