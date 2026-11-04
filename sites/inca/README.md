# INCA fusion latina · web + WhatsApp (demo)

Restaurante peruano chico (12-15 cubiertos), 111 rue Olivier de Serres, 75015 París. Abre todos los
días de 11:45 a 00:30. Take away y catering.

- `index.html`: la web en francés, hecha para celular. Carta en fotos y dos botones fijos abajo:
  «Réserver» y «Commander à emporter». Sin build.
- En la compu (≥ 900 px) la web aparece dentro de un celular dibujado, con una guía en castellano al
  lado para elegir cada conversación. Los elementos `fixed` quedan dentro del teléfono porque
  `.screen` lleva `transform`; lo que se desplaza es `.scroller`.
- `app.js`: estado abierto/cerrado con la hora de París y las conversaciones de WhatsApp, que se
  reproducen solas. Tocar la conversación salta la espera; los botones 20h00 / 21h30 se pueden tocar.
  Al final sube la hoja «Lo que recibe el restaurante», **en castellano**, pensada para el dueño.
- Las fechas de los chats se calculan solas (el viernes que viene; el catering, el primer jueves a
  10 días o más), así la demo no envejece.
- Fotos: Wikimedia Commons, licencias libres; los créditos están en el pie («Photos d'illustration»).
  Los precios de la carta son de ejemplo.
- Al cambiar `app.js` o `styles.css`, subir el `?v=` en `index.html`.

## Enlaces para la demo

- `/inca/#reserver`: mesa para 4 el viernes; el asistente avisa que el local es chico, ofrece 20h00
  o 21h30, pide el nombre y confirma. El viernes a las 11:00 manda el recordatorio («Je confirme» /
  «Je dois annuler»: los dos caminos funcionan) y la hoja del dueño muestra la sala por turno.
- `/inca/#traiteur`: catering para 20; pide fecha, lugar y cantidad y deja el pedido listo. En la
  hoja el dueño escribe su precio por persona y toca «Enviar»: el chat sigue con el presupuesto y
  el «Je valide» del cliente.
- `/inca/#emporter`: pedido para llevar (el destino de «Commander à emporter»), con el aviso de
  «c'est prête» a la hora de retiro.
- `?hora=13:05` simula esa hora de París (estado, «Bonjour/Bonsoir», hora de retiro).
