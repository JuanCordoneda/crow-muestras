# La Escondida · demo móvil (web + WhatsApp)

Restaurante peruano, 8 rue Dareau, 75014 París. Muestra para enseñar al matrimonio que lo lleva:
su web en francés y cómo contestaría un asistente por WhatsApp. Todo en `index.html`, sin build.

- Tres pantallas, con la barra «Demo» de arriba (en castellano, para los dueños):
  - `#web`: la web en francés (carta, horarios, «Réserver sur WhatsApp»). El botón verde abre el chat de la reserva.
  - `#reserva`: chat en francés, mesa para 5 el domingo al mediodía (la hora se elige con botones de WhatsApp),
    tarjeta de confirmación, consejo de compartir platos y el recordatorio automático de la víspera.
  - `#pisco`: chat corto en castellano, pisco sour en jarra y precio; termina ofreciendo reservar.
- Los chats se animan al entrar (con «Rejouer» / «Repetir»). Con «reducir movimiento» salen enteros.
- La fecha del domingo y la de la víspera se calculan solas (el próximo, en hora de París), igual que «Ouvert / Fermé» y el día resaltado.
- En la web, el botón verde fijo de abajo aparece recién cuando el del hero sale de la pantalla.
- **De ejemplo:** platos de la carta salvo ceviche, lomo saltado y jalea, todos los precios (jarra 38 €,
  copa 9 €, la «idée pour 4 ou 5» de 98 €) y la cita de «los patrons». Reales: dirección, horario 12–22 h todos los días, 4,3 y 373 reseñas en Google.
- Sin fotos: los platos son dibujos SVG (`#d-ceviche`, `#d-lomo`, `#d-jalea`, `#d-pisco`), también usados en `og.jpg`.
