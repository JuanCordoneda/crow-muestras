# Tropicalisimo · demo móvil (web + WhatsApp)

Restaurante colombiano, 6 Rue Martre, 92110 Clichy. Encargada: Ana. Hoy no tienen web (en los
directorios aparece su Facebook). Muestra para enseñarle a Ana en el celular:

- `#` → la web, en español y francés (botón ES/FR; `?lang=fr` la abre en francés). Menú del día,
  horarios, dirección y «Reservar por WhatsApp».
- `#reserva` → chat de WhatsApp en español: mesa para 8 el sábado, cumpleaños. El asistente ofrece
  botones (Torta / Decoración / Las dos, como WhatsApp Business) y deja todo anotado. Cuando anota,
  baja una notificación «En el celular de Ana»; al final, «Así le llega a Ana» (la ficha de la reserva).
- `#menu-fr` → chat corto en francés: menú del día y precio.

Los chats se reproducen solos. **Tocar la conversación adelanta** el paso que está esperando; el
ícono ↻ arriba la repite. La barra oscura de arriba («Demo») sirve para saltar entre las tres.

## Datos de ejemplo (confirmar con Ana)

Todo en `CONFIG`, al principio de `app.js`:

- **Precio del menú (14,50 €) y platos** (empanadas, bandeja paisa, sancocho, jugo natural): de ejemplo.
- **Número de WhatsApp**: vacío. Con número, los botones abren `wa.me` con el mensaje escrito en vez de los chats de la demo.
- Horarios (jue–sáb 12–22, lun–mar 12–18, dom 13–18, miércoles cerrado), 4,3 en Google con 216 reseñas: del brief.
- Facebook: enlace a la búsqueda (no tenemos la URL de su página). No hay fotos: los platos son
  ilustraciones SVG (`art.js`); cuando Ana mande fotos, se cambian.

## Detalles

- HTML + CSS + JS sin build. Fuentes Fraunces y Manrope (las mismas de atelie-queijos).
- Horas en **hora de París**: «abierto ahora», el día de hoy en los horarios, la fecha del menú y la
  del sábado del chat se calculan solas. `?hora=13:30` simula una hora (p. ej. para mostrarlo de noche).
- En la compu se ve dentro de un marco de celular; en pantallas grandes, al costado, los tres pasos
  de la demo y un QR para abrirla en el celular (librería `qrcode-generator` desde cdnjs; si no carga, no se muestra).
- `og.jpg` (miniatura de WhatsApp): `fuente/build-og.sh` la genera desde `fuente/og.html`.
- Al cambiar `app.js`, `art.js` o `styles.css`, subir el `?v=` en `index.html`.
