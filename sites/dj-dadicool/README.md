# DJ Dadicool · landing de casamientos (demo)

Muestra para Amine Dadi (DJ Dadicool, París y Essonne). No reemplaza su web (djdadicool.com): es una
landing en francés para que sus anuncios de Meta y Google terminen en pedidos de presupuesto por
WhatsApp. Un solo `index.html` con el CSS y el JS dentro, sin librerías. `og.jpg` es la miniatura.

- **Datos reales:** 151 avis 5 étoiles (138 en Mariages.net, 100 % recomiendan), más de 500 casamientos,
  13 años, desde 1 500 €, servicios, zona y WhatsApp. No agregar precios ni cifras sin confirmarlos.
- **Por completar con Amine:**
  - Video del hero: hoy es una pista de baile en CSS. El `<video>` está comentado en el HTML.
  - Los 4 videos: placeholders, marcados «Vidéo à intégrer».
  - Las 4 reseñas: texto de ejemplo, con la etiqueta visible. Reemplazar por las de Mariages.net.
  - Qué incluye cada fórmula: el reparto de servicios entre las tres es una propuesta nuestra.
  - FAQ: sin cifras de acompte, duración ni gastos de desplazamiento, porque no las tenemos.
- **Medición:** Meta Pixel y Google Tag comentados en el `<head>`, con IDs de relleno. El evento `Lead`
  está comentado en `trackLead()` y ya se llama en cada botón de WhatsApp y al enviar el formulario.
- El chat de la demo se anima al llegar a la pantalla (con «Revoir»). Con «reducir movimiento» sale entero.
- Esta carpeta se publica con `noindex`: para correr anuncios de verdad va en su propio proyecto y dominio.
