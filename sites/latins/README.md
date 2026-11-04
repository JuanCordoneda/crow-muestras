# Latin's Barber Shop · WhatsApp que contesta solo (demo)

Muestra para Latin's Barber Shop (112 Rue la Condamine, 75017 · Batignolles). Enseña un WhatsApp que
contesta solo y manda al cliente a **su link de reserva de siempre**: no reemplaza su sistema.

- Chat en francés (corte + barba, ¿hay lugar hoy?), el mismo más corto en español, la tarjeta de
  clientes fijos, «Lo que cambia» (de noche / sábado lleno) y cómo funciona. Precios y horarios de
  ejemplo (35 €, 15:30 / 16:15 / 18:00).
- Los chats se pueden tocar: se paran en los horarios («Toque un horario para probar»); si nadie toca,
  sigue con el de ejemplo. Después, tocar otro horario rehace el final con ese barbero y esa hora.
- Un solo `index.html` con el CSS y el JS dentro. Los chats se reproducen al llegar a la pantalla;
  con «reducir movimiento» se ven completos.
- `og.jpg` es la miniatura al compartir el link.

## Enlaces para la demo

- `/latins/?reserva=https://…` hace que «Réserver» / «Reservar» abran ese link (el de la barbería).
  Sin él, el botón muestra un aviso y no sale de la página.
- `?wa=33612345678` muestra al final «Hablemos por WhatsApp» (wa.me a ese número, con el mensaje
  escrito). Sin él, el botón no aparece.
