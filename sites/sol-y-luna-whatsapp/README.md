# El Sol & La Luna · Web + WhatsApp (demo)

Demo móvil para Wilson (El Sol & La Luna, 31 rue Saint-Jacques, 5e). Suma el asistente de WhatsApp
a la muestra web que ya vio (`/sol-y-luna/`): misma paleta y mismas fuentes.

Cuatro escenas, con la barra de arriba en el móvil o la columna de la izquierda en el ordenador:

1. **La web** en francés, inglés y español: héroe, platos destacados (bandeja paisa, empanadas,
   ajiaco), ambiente, reseñas de ejemplo, «Réserver par WhatsApp», horarios y mapa. «Abierto ahora»
   sale de la hora de París (lunes de 17 a 23; el resto de 11:30 a 23).
2. **Turista · 23 h** (inglés): mesa para 4 mañana y opciones sin gluten. El asistente ofrece horas
   con botones de respuesta rápida, reserva, manda la ubicación y un «Add to calendar» que baja un
   `.ics` de verdad.
3. **Grupo de 12** (francés): el asistente toma los datos y deja la reserva pendiente. A Wilson le
   llega el aviso en castellano; cuando toca «Confirmar», el asistente avisa al grupo.
4. **Agenda** (castellano, datos de ejemplo): las reservas de la semana que entraron por WhatsApp.
   Las dos de los chats van marcadas, con «Ver chat».

Cada chat termina con un **resumen para Wilson** (tiempo de respuesta, cuántos mensajes tuvo que
escribir él…): son cifras de la demo, no medidas.

El botón de WhatsApp de la web abre el chat del grupo si la web está en francés y el del turista en
inglés o español. Los chats se reproducen solos; tocar el chat adelanta. Los apuntes «Demo»
(amarillos) están en castellano, para Wilson.

- HTML + CSS + JS sin build. Guiones de los chats: `SCENES` en `app.js`; textos de la web: `T`.
- Al cambiar `app.js` o `styles.css`, subir el `?v=` en `index.html` (Caddy no les pone hash).
- `localStorage`: solo el idioma elegido (`solwa:lang`).

## Enlaces para la demo

- `?ver=web|turista|grupo|agenda` abre esa escena; `?lang=fr|en|es` el idioma de la web.
- Ejemplo: `/sol-y-luna-whatsapp/?ver=turista` para empezar directo por el chat de las 23 h.

## Contenido que falta confirmar con Wilson

- **Fotos**: fachada, interior, empanadas, burrito y quesadilla son del local (de
  `sol-y-luna/recursos/grupo-originales`). Bandeja paisa y ajiaco **no**: son de Wikimedia Commons
  (bandeja: Wilfredor, CC0; ajiaco: Bernard Gagnon, CC BY-SA 4.0, con crédito en el pie). Cambiarlas
  por fotos suyas antes de publicar nada.
- **Ajiaco**: la carta de la muestra web dice «Sopa de pollo»; confirmar si tienen ajiaco.
- **Sin gluten**: el chat dice que ajiaco, arepas y bandeja paisa lo son de por sí. Confirmarlo con
  la cocina (chorizo, frituras compartidas) antes de que el asistente lo diga de verdad.
- **Reseñas**: son de ejemplo y así lo dice la web («Exemples d’avis»). La real mostraría las de Google.
- Nota de Google: 4,4 con 626 reseñas (la muestra web todavía dice 622).

El mapa es el de OpenStreetMap de la muestra web (`recursos/mapa-quartier-base.png`), recortado
alrededor del local y sin la chincheta de Mexi & Co.
