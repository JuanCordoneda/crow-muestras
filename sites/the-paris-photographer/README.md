# The Paris Photographer · asistente de WhatsApp e Instagram (demo)

Muestra para The Paris Photographer (fundador: Fran; booking manager: Narcis), estudio de fotos y
video de habla inglesa en París 16e. No es una web nueva para ellos: es una página en inglés que les
muestra cómo funcionaría el asistente de Crow en su WhatsApp Business y su Instagram. Un solo
`index.html` con el CSS y el JS dentro, sin librerías. `og.jpg` es la miniatura al compartir.

- **Datos reales del estudio:** 4.600+ reseñas de 5 estrellas en Google, dirección, número de
  WhatsApp (+33 6 62 43 95 95) y la lista de servicios. No agregar servicios fuera de esa lista.
- **Precios y horarios:** todos son de ejemplo y llevan la etiqueta «Example prices». Seña del 30 %
  por Stripe en los ejemplos. Sin precio de Crow: solo «First month free» y cuota mensual según volumen.
- **Demo:** los 5 escenarios están en `SCENARIOS`, en el `<script>` del final (sin pedir nada a
  internet). Cada mensaje puede llevar `step` (enciende los pasos 1–4); `note` es lo que pasa «por
  detrás» (Stripe, calendario) y `team: true` muestra el aviso a Narcis. Arranca sola al entrar en
  pantalla; Play/Pause, Next message y Restart. Con «reducir movimiento» no se anima: sale entera.
- **Contacto:** solo WhatsApp de Juan (+33 7 45 59 54 91). No pusimos juan@crowagency.es porque no
  pudimos confirmar que exista; la web de Crow usa crowagency.ai@gmail.com.
- Las imágenes son ilustraciones propias (torre Eiffel en SVG): no usamos fotos del estudio.
