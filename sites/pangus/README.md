# Pangus · web + WhatsApp (demo)

Muestra para los dueños de Pangus (restaurante argentino, 11 rue de l'Étoile, París 17e). Una sola
página, pensada para el celular, con tres vistas que se cambian desde la barra «Demo» de arriba:

| Enlace | Qué muestra |
| --- | --- |
| `/pangus/` | La web en francés: empanadas, carnes, Malbec, dirección y «Réserver sur WhatsApp». |
| `/pangus/#reserver` | Chat de WhatsApp en francés: mesa para 6 el sábado + opción vegetariana. |
| `/pangus/#empanadas` | Chat corto en español: 3 docenas para retirar el sábado (gustos, hora, nombre). |
| `/pangus/#equipo` | Lo que ve el equipo: reservas y encargos del sábado (con los de los chats marcados como nuevos), empanadas a preparar y números de la semana. |

- HTML + CSS + JS en `index.html`, sin build. Los chats se animan solos al entrar (cliente escribe,
  asistente «écrit… / escribiendo…»). Arriba a la derecha, «Adelantar» los termina de golpe (para
  presentar con apuro) y después pasa a «Repetir». Con *reducir movimiento* salen enteros.
- Al cerrar cada chat baja un aviso «Pangus · Equipo» (nueva reserva / nuevo encargo) que lleva al panel.
- La fecha del chat es siempre **el sábado que viene**, para que la demo no envejezca.
- La barra «Demo» está en español (es para los dueños); la web, en francés.
- `og.jpg` (miniatura al compartir por WhatsApp): `fuente/og.html` → `fuente/build-og.sh`.

## Qué es real y qué es de ejemplo

- Real: nombre, dirección, 4,7 con 161 reseñas en Google, jueves corrido 11:30–22:00, carnes,
  empanadas, Malbec, milanesa y papas bomba (las nombran las reseñas).
- **De ejemplo**: la carta exacta, los precios (empanada 4 €, docena 42 €…), las opciones vegetarianas
  del chat, los nombres de los clientes, el total del pedido y todo el panel del equipo (reservas, encargos y números). Los horarios del resto de la semana no
  están: la web manda a Google. Cambiarlos por los reales si la muestra avanza.
