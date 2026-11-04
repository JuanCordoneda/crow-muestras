# Lissage brésilien Paris by Reijane (demo)

Muestra para Reijane (salón de alisado brasileño, 32 Rue de l'Annonciation, 75016 París).
HTML + CSS sin build.

- `index.html`: la página en francés, con selector FR | PT (el portugués está en los `data-pt`).
  Especialidades, reseñas (deslizables en el móvil), mapa y horarios con «abre mañana a las 9h».
  Todos los botones «Réserver sur WhatsApp» abren la demo del chat en el mismo idioma.
- `whatsapp.html`: el asistente de WhatsApp. Conversación escrita en el propio archivo
  (`SCRIPTS`), con pausas y «écrit…». Una clienta pide precio y turno el sábado: el asistente pide
  largo y tipo de pelo, da un «à partir de», ofrece 2 horarios, confirma y manda el recordatorio la víspera.
  Quien mira elige el horario tocando 9h00 o 14h00 (si no toca nada en 9 s, elige la clienta) y la
  conversación sigue con esa hora. Tocar el chat adelanta. Al final, una tarjeta para la dueña resume
  lo que hizo el asistente y el turno como queda en la agenda.
- `base.css`: fuentes y paleta compartidas. Al cambiarlo, subir el `?v=` en los dos HTML.
- `fuente/build-og.sh` genera `og.jpg` (la miniatura de WhatsApp) a partir de `fuente/og.html`.

**Ejemplos, no datos reales:** las 3 reseñas, el precio (190 €), los horarios del sábado y la clienta
«Camille Martin». Antes de publicar en el dominio de Reijane, poner reseñas reales de Google y sus precios.

## Enlaces para la demo

- `/reijane/`: la página (`?lang=pt` en portugués).
- `/reijane/whatsapp.html`: el chat en francés (con el recordatorio de la víspera).
- `/reijane/whatsapp.html?lang=pt`: la versión corta en portugués («progressiva»).
- `&instant=1` muestra la conversación entera de una vez (para capturas).
- El turno siempre cae el próximo sábado (a 2 días como mínimo), así que las fechas nunca quedan viejas.
