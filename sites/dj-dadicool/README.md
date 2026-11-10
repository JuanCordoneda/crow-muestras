# DJ Dadicool · landing de casamientos (demo)

Muestra para Amine Dadi (DJ Dadicool, París y Essonne). No reemplaza su web (djdadicool.com): es una
landing en francés para que sus anuncios de Meta y Google terminen en pedidos de presupuesto por
WhatsApp. Un solo `index.html` con el CSS y el JS dentro, sin librerías. `og.jpg` es la miniatura.

- **Contenido real de Amine:** cifras (151 avis 5 étoiles, 138 en Mariages.net, más de 500 casamientos,
  13 años), desde 1 500 €, servicios, zona, WhatsApp, las 4 reseñas y la foto (`img/amine-dadi.webp`).
  No agregar precios ni cifras sin confirmarlos.
- **Videos:** los de la grilla y el hero de escritorio se sirven desde djdadicool.com. El hero original
  pesa 50 MB, así que en el celular va `video/hero-mobile.mp4`: el mismo video a 540p, sin audio y sin
  el primer segundo en negro (10 MB). La grilla recibe el `src` por JS al acercarse a la pantalla y todo
  se pausa fuera de ella. `img/` guarda los pósters. Con «reducir movimiento» o ahorro de datos, póster.
- **Por completar con Amine:**
  - Qué incluye cada fórmula: el reparto de servicios entre las tres es una propuesta nuestra.
  - FAQ: sin cifras de acompte, duración ni gastos de desplazamiento, porque no las tenemos.
- **Medición:** Meta Pixel y Google Tag comentados en el `<head>`, con IDs de relleno. El evento `Lead`
  está comentado en `trackLead()` y ya se llama en cada botón de WhatsApp y al enviar el formulario.
- El chat de la demo se anima al llegar a la pantalla (con «Revoir»). Con «reducir movimiento» sale entero.
- Esta carpeta se publica con `noindex`: para correr anuncios de verdad va en su propio proyecto y dominio.
