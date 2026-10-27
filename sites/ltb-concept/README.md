# LTB Concept · by La Touche Brésilienne

Web de muestra para Dany (salón brasileño, Paris 5e y Clichy), hecha sobre la plantilla de `peluqueria/`
con la misma estructura y estilo. Francés por defecto, portugués con el botón **PT** (se recuerda y va en la
URL como `?lang=pt`). Página estática: sin servidor, sin base de datos, la reserva sale por WhatsApp.

## Verla en local

```bash
cd ltb-concept
python3 -m http.server 4610      # → http://127.0.0.1:4610
```

No usar el `server.js` de `peluqueria/`: es el de Lucía (hair-vision, recordatorios por WhatsApp a sus clientas).

## Qué se edita y dónde

Todo en **`config.js`**:

| Qué | Campo |
| --- | --- |
| Nombre y bajada | `name`, `tagline` (logo, textos, pie, posts de Instagram) |
| Precios y duraciones | `services[].price` (€) y `services[].min` (minutos); en `null` se ve «XX» |
| Salones, teléfonos, WhatsApp, horarios | `salons[]` |
| Fotos avant / après | `beforeAfter[].before` / `.after` (ruta de la foto) |
| Fotos de Instagram | `instagramPosts[]` |
| Franja «Proposition pour Dany» | `proposal` (`null` para quitarla) |
| Dominio | `url` |
| Enlace «Voir les avis sur Google» | `reviewsUrl` |

Después de cambiar nombre, dominio, salones u horarios: `node scripts/sync-head.mjs`. Regenera el `<head>`
(título, descripción, canonical, hreflang fr/pt, Open Graph y el schema.org `HairSalon` de cada salón),
que tiene que estar escrito en el HTML porque WhatsApp/Facebook no ejecutan JS al previsualizar el enlace.

## Carpetas

- `img/`: fotos en webp (800 y 1400 px). Son de Unsplash (licencia libre, uso comercial, sin atribución) y
  solo ilustran: hay que cambiarlas por fotos del salón.
- `instagram/`: 4 posts (HTML + PNG 1080×1350), `logo-ltb-concept` (foto de perfil 1080×1080) y
  `bio-instagram.txt`. Los posts leen el nombre de `config.js`; para reexportar, abrir cada HTML a 1080 px
  de ancho y capturar `.post`.
- `capturas/`: móvil (390 px) y escritorio.
- `og.jpg`: lo que se ve al compartir el enlace (WhatsApp, Facebook, iMessage). Sale de `instagram/partage-og.html`.

La tipografía francesa (’, espacios insécables antes de : ; ! ? y dentro de « ») la pone el JS solo:
los textos se escriben normales.

## Antes de publicar

- No lleva el bloqueo anticopia de la plantilla (dependía del dominio): añadirlo cuando haya dominio.
- Enlaces «Mentions légales» y «Confidentialité» del pie apuntan a `#`.
