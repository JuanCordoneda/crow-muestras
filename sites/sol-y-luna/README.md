# Mexi-and-Co · muestra para el grupo (El Sol & La Luna · Mexi & Co · Le 1492)

Rama `mexi-and-co`, clonada de la plantilla de El Puerto (`restaurante-moderna`). Misma estructura,
mismo armazón y mismas piezas; cambian contenidos, colores, tipografía de títulos e imágenes.

- **Datos de cada local** (dirección, teléfono, horario, carta sin precios): `src/public/venues.ts`.
  Para poner precios, rellenar `price` en cada plato: la web deja de decir «Prix sur place».
- **Textos**: francés de referencia en `src/public/content.ts`, castellano en `src/public/texts/es.ts`.
- **Le 1492** vive entero en `src/public/components/Le1492.tsx` y hoy está **escondido**: sin fotos,
  carta ni horario. Se enciende con `SHOW_LE_1492 = true` en `src/public/venues.ts` (portada, menú,
  pie, reservas, ficha de Google y los textos de «2/3 adresses» y «5e / 5e et 6e»; `index.html` y
  `llms.txt` los ajusta `scripts/pages.mjs` en el build) y `node scripts/grupo.mjs` para la imagen
  de compartir. Si el local cerró: borrar ese fichero y las líneas marcadas `LE-1492` (venues,
  HomePage, BookingForm, PublicApp, structured-data, `index.html`, `llms.txt`, pages y grupo).
- **Reservas**: `/reserver` (o `?local=el-sol-la-luna|mexi-and-co|le-1492`) arma el mensaje y abre
  WhatsApp al 06 24 43 80 23. No guarda nada en el servidor.
- **Fotos**: originales a resolución completa en `recursos/grupo-originales/` (fuera de git).
  `node scripts/fotos-grupo.mjs` saca las maestras (2400 px) y sus variantes (240–1600) con enfoque
  suave; `npm run images` escribe el manifiesto con el difuminado de carga de cada foto. Mapa,
  iconos y og.jpg: `node scripts/grupo.mjs`. Las cuatro fotos de platos de la portada llevan un
  retoque (recorte más cerrado, más color y calidez): `node scripts/retoque-platos.mjs` después de
  `fotos-grupo.mjs`; la copia sin retocar queda en `recursos/originales-platos/`.
- **Panel** (`/admin`): sigue siendo el de la plantilla y no está conectado a esta muestra; la web
  pública no enlaza a él.
- **«Ce soir, on va où ?»** (`components/MoodFinder.tsx`): una gana → local, platos, si está abierto
  y el botón que toca. Todo sale de la carta.
- **Tras reservar**: resumen, `.ics` para el calendario y mensaje para avisar a los invitados.
- **Movimiento**: transiciones entre páginas (View Transitions), parallax del héroe atado al scroll,
  papel picado que se mece. Nada se mueve si el teléfono pide menos movimiento.
- **Capturas**: `capturas/`.

Lo que sigue es el README de la plantilla.

---

# Restaurante El Puerto · Can Picafort

Web y panel de gestión del Restaurante El Puerto (Carrer Cervantes 22, Can Picafort, Mallorca).
Hecha **para el móvil**: casi nadie entra desde un ordenador, ni el cliente que busca dónde comer
ni el restaurante cuando mira las reservas en mitad del servicio.

Dos zonas sobre el mismo código:

| Zona | Dirección | Para quién |
| --- | --- | --- |
| Web pública | `/`, `/carta`, `/can-picafort`, `/privacidad` | quien busca dónde comer |
| Panel | `/admin` (la carta), `/admin/ajustes` | el restaurante |

## Arranque

```bash
npm install
npm run build     # compila la web y genera server/seed.json con la carta
npm start         # web + API en http://localhost:3000
```

Sin `DATABASE_URL` los datos se guardan en ficheros JSON dentro de `var/data`, así que no hace falta
montar nada para verlo funcionando. Para desarrollar con recarga en caliente:

```bash
npm run dev       # Vite en el 5173, con proxy de /api al 3000
npm run dev:server  # la API en el 3000, en otra terminal
```

## Qué hay dentro

```
src/
  main.tsx              arranque y registro del service worker
  App.tsx               router raíz: web pública o panel (el panel va en su propio trozo)
  shared/               lo que usan las dos zonas
    types.ts            modelo: Dish, Category, Settings, DayHours, Reservation, Menu
    data.ts             la carta real en cuatro idiomas, el horario y los datos del restaurante
    hours.ts            hora de Mallorca: abierto ahora, horas libres, días reservables
    i18n.ts             idiomas, precios y fechas por idioma
    store.ts            normalización y copia local de la carta
    api.ts              cliente de la API
    routing.ts          rutas de verdad (/carta, /can-picafort…), historial y el enlace de reservas
    components/         Photo, Lightbox, Ui (modal, avisos, desplegables)
    styles/base.css     tokens de marca y primitivas
  public/               la web pública
    PublicApp.tsx       cabecera, cajón, pie, barra de acciones y router de páginas
    content.ts          todos los textos en castellano (referencia)
    texts/{en,de,fr}.ts las traducciones; el compilador obliga a completarlas
    pages/              HomePage, MenuPage, PicafortPage, PrivacyPage (+ su CSS)
    components/         LangPicker, DishSheet, OpenStatus, Brand, ErrorBoundary
  admin/                el panel (reservas, carta y ajustes)
server/                 API, almacén (Postgres o ficheros), fotos y siembra
scripts/                recursos.mjs, images.mjs, fonts.mjs, build-seed.mjs, seed.mjs
recursos/originales/    las fotos tal como llegaron; `npm run recursos` las convierte
```

## La web pública

**Portada.** Foto a pantalla completa con el estado del restaurante en vivo («Abierto ahora · hasta
las 22:00» / «Cerrado · abrimos mañana a las 12:00», calculado siempre en hora de Mallorca), tres
atajos —horario de hoy, llamar, cómo llegar—, las especialidades con foto, las paellas por encargo,
las secciones de la carta, la historia desde 1983, el local, el horario con el día de hoy marcado, un
mapa estático y Can Picafort. Abajo, fija, la barra de llamar y reservar.

**Carta** (`/carta`). Las ocho secciones con sus 57 platos y sus precios, buscador que ignora
acentos, filtro vegetariano y una barra de secciones que se mantiene arriba y marca dónde estás al
bajar. Cada plato abre una ficha con foto, descripción, opciones y alérgenos, y desde ahí se puede
reservar.

**Reservar.** Las reservas las lleva el sistema del restaurante (Restoo), fuera de esta web: todos
los botones de «Reservar» abren `https://restauranteelpuertocanpicafort.myrestoo.net/`. Las
direcciones antiguas (`/reservar`, `/reservas`, `/reserva`, con o sin prefijo de idioma) se
redirigen allí con un 302, así que los enlaces que circulan por Google y por WhatsApp siguen
funcionando. La dirección está en `BOOKING_URL`: `src/shared/routing.ts` para la web, y repetida
en `server.js` y en el script de `index.html`, que corren fuera del bundle.

**Cuatro idiomas.** Castellano, inglés, alemán y francés. Se elige solo con el idioma del teléfono
(en Can Picafort la mitad de los clientes son alemanes o ingleses), se recuerda y se escribe en la
dirección para que el enlace que se comparte abra en el mismo idioma. La carta se traduce con el
catálogo; los textos de la web, con `src/public/texts/`.

**Enlaces de la web anterior.** `/conoce-can-picafort`, `/politica-de-privacidad`, `/en/`, `/de/`…
llevan a su página nueva en vez de a un error.

## El panel

`/admin`, pensado para usarse de pie y con una mano. Pide contraseña si el servidor tiene
`ADMIN_TOKEN` (ver [Configuración](#configuración)). Dos pantallas:

**Carta** (`/admin`). Lo que se toca a diario, en este orden. El horario y las ofertas son tarjetas
**plegables** y cada teléfono recuerda las suyas: plegadas no esconden el dato, lo resumen en una
línea —«Abierto · hasta las 22:00», «3 en la portada · 2 de la semana, 1 del mes»—, que la mitad de
las veces es justo a lo que se entraba. Así los platos quedan a un pantallazo y no a tres, que en
pleno servicio es la diferencia entre marcar un agotado y no marcarlo.

- **Horario**, lo primero de todo. El estado de hoy con las mismas palabras que lee el cliente
  («Abierto · hasta las 22:00», «Cerrado · abre mañana a las 12:00») y, en el mismo bloque, el
  botón de **Cerrar hoy**. Debajo, los seis días siguientes uno bajo otro, cada uno con su fecha,
  su horario en grande y su estado. El renglón abre el día, y ahí mismo se cierra y **se cambian
  las horas**, sin ir a Ajustes.

  Ojo con la diferencia, que el panel dice en cada sitio pero conviene saber: **cerrar un día** es
  un cierre puntual y vale solo para esa fecha; **cambiar las horas** toca el horario semanal, que
  va por día de la semana, así que cambiar las de este martes las cambia todos los martes. El
  modelo no guarda horas sueltas para una fecha: para un día con otro horario, lo que hay es
  cerrarlo y avisar.

  **Horario partido.** Un día puede abrir un tramo o dos: almuerzo y cena, con la cocina cerrada en
  medio. Se enciende con «Cerrar por la tarde y abrir de noche» (o con el distintivo *Partido* en
  Ajustes) y vale, como todo el horario, para ese día de la semana. Sin esto había que poner
  12:00–23:00 y la web decía «Abierto» a las cinco de la tarde. Los tramos los decide
  `dayRanges` en `src/shared/hours.ts`, reflejado en `server/hours.js`: de ahí beben el «abierto
  ahora», el horario de la web, las horas de reserva y la ficha de Google, que declara los dos
  tramos por separado. Cerrar un
  día es un cierre puntual, el mismo de Ajustes, así que cerrar este martes no cierra todos los
  martes. El día que ya cae en el descanso semanal sale apagado y no se puede abrir desde aquí:
  eso es cambiar la semana entera y se hace en Ajustes.
- **Google.** Cambiar el horario aquí lo cambia en la web al instante, pero **no en la ficha de
  Google**, que es por donde llega media clientela. En cuanto se toca el horario semanal, los
  turnos o los días de cierre sale un aviso con el enlace a la ficha y los tres pasos que hay que
  dar allí. «Luego» no lo borra: queda un recordatorio en el horario —guardado en el teléfono, así
  que sobrevive a cerrar el panel— hasta que se pulsa «Ya está hecho». No avisa al abrir el panel,
  ni al cambiar un plato o una foto, ni al quitar de la lista un cierre que ya pasó. Adónde lleva
  el botón se pone en *Ajustes · Datos · Google · ficha del restaurante*; sin eso abre el panel
  general de Google Business. Está en `src/admin/useGoogleHours.ts`.
- **Ofertas y sugerencias**, después: las de **esta semana** y las de **este mes**, cada una
  en su lista y con la cuenta de cuántas salen ahora mismo en la portada. Se enlazan a un plato de
  la carta y toman su foto y su precio, o se escriben sueltas (un pescado del día, un arroz de
  temporada). El ojo las quita de la portada sin borrarlas, para recuperar la del año pasado de un
  toque. Si es un arroz, la web ofrece encargarlo.
- **Platos**, por secciones: precio, foto, traducciones, alérgenos y opciones. Dos cosas se hacen
  sin abrir la ficha, que son las de mitad del servicio: la estrella marca una **especialidad** (sale
  en el carrusel de la portada) y **Agotado** lo tacha en la web al momento.

**Ajustes** (`/admin/ajustes`). Datos del restaurante, **fotos de la web**, **turnos**, horario
semanal, días de cierre, aviso en la web y copia de seguridad. El índice de apartados se queda
pegado bajo la barra y marca en cuál estás: la pantalla es larga y en el móvil, a la cuarta
tarjeta, ya no se sabe por dónde se va.

- **Turnos.** Las horas del almuerzo y de la cena, con una vista previa de cómo se leen en la web.
  Qué días se da cada turno se marca en el horario semanal, día a día.
- **Horario semanal.** Abierto o cerrado, de qué hora a qué hora, y si ese día hay almuerzo, cena o
  las dos. Es de donde sale el «Abierto ahora · hasta las 22:00» de la portada, en hora de Mallorca.
- **Fotos de la web.** Las cinco de la portada —las tres del pase, la de los arroces y la de la
  historia— y las seis del local, cada una en su hueco: se sube una del móvil o se elige de la
  galería. El hueco que no se toca enseña la foto con la que se estrenó la web, así que nadie puede
  dejar la portada en blanco. Los huecos y sus fotos de serie están en `src/shared/photos.ts`; los
  pies de las fotos del local siguen en las traducciones, emparejados por el identificador del
  hueco. La precarga del héroe en `index.html` apunta a la foto de serie.
- **Días de cierre**, **aviso en la web**, **copia de seguridad** y restaurar la carta original.

### La agenda de reservas, apagada

El panel tenía una tercera pantalla con la agenda del día por turnos. Está **comentada, no
borrada**: las reservas las lleva Restoo fuera de esta web, así que esa agenda solo enseñaba lo que
alguien apuntase a mano. Con ella se han apagado también las reglas del formulario propio (aforo,
antelación, días por delante, grupo máximo, minutos entre horas), que no cambian nada mientras no
haya formulario.

Lo que sigue en pie y no se ha tocado: la API (`/api/reservations`), su validación, el aviso por
Telegram y el webhook. Una reserva que entre por ahí se guarda igual.

Para encenderla otra vez: descomentar los trozos marcados con `AGENDA` en `src/admin/AdminApp.tsx`
y en `src/admin/views/SettingsView.tsx`, y devolver `{ view: 'reservas' }` a `AdminRoute` en
`src/shared/routing.ts`. La vista (`views/ReservationsView.tsx`) y su hook siguen donde estaban.
`/admin/reservas` no da error mientras tanto: abre la carta.

Todo lo que se guarda aquí es lo que ve la web pública al instante.

## Datos

La carta, el horario y los datos del restaurante son un solo objeto (`Menu`) que publica el panel.
`src/shared/data.ts` es la versión de partida: se despliega con la web, siembra una base vacía y es
lo que se pinta si el servidor no contesta. Al tocarla hay que subir `MENU_VERSION`, o el navegador
que ya tenía una copia seguirá enseñando la anterior.

Las reservas van por su cuenta (`/api/reservations`), no dentro del `Menu`: así una reserva que entra
mientras el panel edita la carta no se pierde al guardar.

### API

| Ruta | Quién | Qué hace |
| --- | --- | --- |
| `GET /api/health` | — | Estado del servidor y del almacén. |
| `GET /api/menu` | público | Carta publicada. Sin los platos ocultos ni las secciones apagadas. |
| `PUT /api/menu` | panel | Guarda la carta entera. |
| `POST /api/reservations` | — | Solicitud de reserva. Sigue en pie, pero la web ya no la usa: las reservas van por Restoo. |
| `GET /api/reservations?from&to` | panel | Reservas de un rango de días. |
| `PUT /api/reservations/:id` | panel | Crea o actualiza una reserva. |
| `DELETE /api/reservations/:id` | panel | Borra una reserva. |
| `GET/POST /api/session` | panel | Si hace falta contraseña y si la que hay sirve. |
| `POST/GET/DELETE /api/media` | panel | Fotos de los platos y de la web. |

El servidor valida las reservas con las mismas reglas que la web (`server/hours.js` es el reflejo de
`src/shared/hours.ts`): día abierto, hora dentro de las franjas, sin fechas pasadas, tamaño del
grupo, teléfono, y un límite por IP para que nadie llene la agenda desde un script.

### Configuración

- `DATABASE_URL` — Postgres. Sin ella, los datos van a ficheros JSON en `DATA_DIR` (`var/data`).
- `DATA_DIR` / `MEDIA_DIR` — dónde viven los datos y las fotos subidas. En Railway, en un volumen.
- `ADMIN_TOKEN` — contraseña del panel. **Sin ella el panel queda abierto**: en producción hay que
  ponerla.
- `PORT` — por defecto 3000.
- `CANONICAL_HOST` — si se define, `www.` redirige al dominio sin `www`.
- `TRUST_PROXY` — `1` para hacer caso a `x-forwarded-for` (detrás de un proxy como el de Railway,
  donde se detecta solo). Sin proxy delante se ignora esa cabecera: si no, cualquiera se saltaría
  los límites por IP cambiándola en cada petición.
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — avisa por Telegram de cada reserva nueva, con su día,
  hora, personas, teléfono y paella. Es lo que hace que una reserva de las siete de la tarde no se
  quede esperando a que alguien abra el panel.
- `BOOKING_WEBHOOK_URL` — recibe la reserva en JSON (Make, Zapier, n8n, un correo con Resend…).

### Despliegue

El servicio de Railway (`restaurante-moderna`, proyecto `restaurante-el-puerto`) está conectado a
la rama `restaurante-moderna` de este repositorio: **con hacer push se despliega**. Railway clona
el commit, corre `npm run build` y arranca `npm start`; en la web se ve en un par de minutos.

No hace falta —y conviene evitar— `railway up` desde el portátil:

- sube **la carpeta, no el commit**, así que se lleva a producción lo que haya sin commitear, y en
  esta copia trabajan varias sesiones a la vez;
- pisa el despliegue que GitHub acaba de lanzar con ese mismo commit, y deja en producción algo
  que no se corresponde con ninguna rama;
- su subida falla a ratos con «operation timed out» a los ~90 s sin llegar a construir nada.

Queda para las urgencias, cuando haga falta probar en el servidor algo que todavía no está en un
commit.

### Puesta en producción

1. **Dominio y DNS.** Apuntar `restauranteelpuertocanpicafort.com` y su `www` al despliegue, y poner
   `CANONICAL_HOST=restauranteelpuertocanpicafort.com` para que el `www` redirija.
2. **Contraseña.** `ADMIN_TOKEN` con algo largo. Sin ella, cualquiera entra en `/admin`.
3. **Datos que no se pueden perder.** Postgres (`DATABASE_URL`) o, si se queda en ficheros, un
   volumen montado en `DATA_DIR`. **Sin volumen, cada despliegue borra las reservas y las fotos.**
4. **Avisos.** Configurar Telegram o el webhook; probar con una reserva de verdad.
5. **Proxy.** `TRUST_PROXY=1` si hay un proxy delante (Railway lo detecta solo).
6. **Datos del restaurante.** En *Ajustes*: teléfonos, WhatsApp, enlace de reseñas de Google, las
   **fotos de la web**, los **turnos** de comidas y cenas y el horario real de la temporada. (El
   aforo ya no hace falta: la web no acepta reservas, las manda a Restoo.)
7. **La carta.** Repasar precios con el restaurante y rellenar los **alérgenos** plato a plato: la
   web los enseña en cuanto están, y mientras tanto dice «consulta con nuestro personal».
8. **Google.** Actualizar la ficha de Google Business con la dirección nueva de la web y el enlace
   de reservas (Restoo); comprobar en Search Console que `/carta` se indexa y que `/reservar`
   aparece como redirección, no como error.
9. **La web anterior.** Si se apaga el WordPress, mantener el dominio: el servidor ya redirige
   `/conoce-can-picafort`, `/politica-de-privacidad`, `/en/`, `/de/`… a sus páginas nuevas.
10. **El sistema de reservas (Restoo).** Es el que se usa: la web enlaza a él y el formulario
    propio se ha retirado. La agenda del panel solo enseña lo que se apunte a mano o lo que entre
    por la API.
11. **Aviso legal.** Añadir razón social y NIF a la página de privacidad (`src/public/content.ts`),
    que la LSSI los exige y la web anterior tampoco los tenía.

## Buscadores y enlaces compartidos

**Una página HTML por dirección.** WhatsApp, Facebook y quien enseña la miniatura de un enlace no
ejecutan JavaScript: leen el HTML tal como sale del servidor. Con un solo `index.html` para toda la
web, compartir `/carta` enseñaba el título y el texto de la portada, y Google leía la misma
descripción en las cuatro páginas. `scripts/pages.mjs` escribe en el build una copia por página
(`dist/carta/index.html`…) con su título, su descripción, su canónico, sus idiomas alternativos y su
miniatura, sacados de los mismos textos que lee la app (`src/public/content.ts`). El servidor sirve
el `index.html` de cada carpeta y las precomprime como todo lo demás: no cuesta nada en marcha. La
app los pone al día al navegar sin recargar y los traduce al idioma en que se está leyendo.

De paso, la precarga de la foto del héroe se queda solo en la portada, que es la única que la
enseña: en `/carta` eran 100 kB de foto que nadie llegaba a ver.

**Idiomas alternativos en la propia página.** Además del sitemap, cada página declara sus cuatro
idiomas y la `x-default`: es lo que evita que un alemán que llega por Google se encuentre la carta
en castellano.

**Una dirección que no existe contesta 404**, no 200 con la portada. El visitante sigue viendo la
página de «no encontrada», pero Google recibe el 404 y un `x-robots-tag: noindex`, en vez del
«soft 404» que acaba indexando direcciones inventadas. Las páginas de verdad son ficheros en disco,
así que solo caen ahí el panel —que no se indexa— y lo que nadie escribió nunca.

**Ficha de Google** (`src/public/structured-data.ts`): schema.org/Restaurant con los datos que el
restaurante tiene ahora mismo en el panel, los días de cierre y los arroces con su precio. Un día
de horario partido declara sus dos tramos por separado; de un tirón, Google diría «abierto» a media
tarde.

## Rendimiento

Todo se sirve desde el mismo dominio: ni una petición a terceros. El servidor comprime en brotli al
arrancar y responde `304` a quien ya lo tenía; las tipografías son variables y auto-alojadas (dos
ficheros, 61 kB); cada foto tiene variantes de 480 y 900 px y el móvil se lleva la que le cabe; el
panel viaja en su propio trozo y no lo descarga quien entra a ver la carta. La pantalla de arranque
va escrita en el propio HTML, así que la marca aparece antes de que baje nada, y un service worker
deja la segunda visita casi sin red.

## Tareas

```bash
npm run comprobar  # el cálculo del horario, el acuerdo web–servidor y el panel sin barreras
npm run recursos   # fotos de recursos/originales → public/img (webp), iconos, og.jpg y el mapa
npm run images     # variantes de 480 y 900 px + manifiesto src/shared/photo-variants.ts
npm run fonts      # descarga Fraunces y Manrope a public/fonts y reescribe fonts.css
npm run seed       # vuelca la carta en el almacén (--force reemplaza lo que haya)
```

`npm run recursos` necesita las fotos originales y descarga el mapa una sola vez;
`npm run images` necesita `cwebp` (`brew install webp`).

## Contenido

Los textos, las fotos, la carta y los precios salen de restauranteelpuertocanpicafort.com (versiones
en castellano, inglés, alemán y francés) y de su página de reservas. Los 62 platos y sus precios se
compararon uno a uno con la carta original; las traducciones parten de las suyas con las erratas
corregidas.

Lo que hay que preguntarle al restaurante antes de publicar:

- **Aforo por turno.** Sin él, la web acepta reservas sin límite (Ajustes → Reservas).
- **Alérgenos.** No se ha marcado ninguno: declarar unos pocos y dejarse otros es peor que no
  declarar nada. El panel los tiene listos para rellenar, catorce por plato.
- **Bebidas y vinos.** La carta original no los traía y aquí tampoco están. Se crean como una
  sección más desde el panel, con las opciones de copa y botella.
- **Camembert con salsa de frambuesa y churros.** Los anuncian como especialidades pero no están en
  la carta con precio: salen como tarjetas fijas en la portada. Con precio, se crean como platos.
- **El número de la calle.** Su web dice Carrer Cervantes 22 y su sistema de reservas, el 21. Aquí
  está puesto el 22, que es lo que coincide con el mapa.
- **Datos prácticos** que hoy no se dicen en ninguna parte: aparcamiento, tronas, mascotas,
  accesibilidad, grupos. Son las llamadas que más se repiten en temporada.
- **Razón social y NIF** para la página de privacidad.
