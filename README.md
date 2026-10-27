# Crow Agency · Muestras

Las webs de muestra para clientes, servidas juntas desde **un solo servicio de Railway** (Caddy
estático). Ninguna se indexa: `noindex, nofollow` en cada página, `X-Robots-Tag` en cada respuesta y
`robots.txt` que bloquea todo.

| Ruta | Web | Hecha con |
| --- | --- | --- |
| `/` | Índice con las cinco muestras (uso interno) | `scripts/index-page.mjs` |
| `/comptoir/` | Le Comptoir du Pérou | HTML estático (`sites/comptoir/public`) |
| `/sol-y-luna/` | El Sol & La Luna · Mexi & Co · Le 1492 | Vite + Preact |
| `/sculpt-detox/` | Sculpt Detox (Ibiza) | Vite + Preact, HTML prerenderizado |
| `/ltb-concept/` | LTB Concept | HTML estático + `config.js` |
| `/atelie-queijos/` | Ateliê de queijos · PariSabor | Vite + Preact, HTML prerenderizado |

## Build y prueba en local

```bash
node scripts/build.mjs              # las cinco → dist/<sitio>/ + dist/index.html (Node 20+)
node scripts/build.mjs sculpt-detox # solo una

# Lo mismo que hace Railway:
docker build -t crow-muestras .
docker run --rm -e PORT=8080 -p 8080:8080 crow-muestras   # → http://localhost:8080
```

Instala las dependencias de cada web de Vite la primera vez (`npm ci` en `sites/<sitio>`).

## Cómo funcionan las rutas

- **Estáticas** (comptoir, ltb-concept): ya usaban rutas relativas (`img/…`); se copian tal cual.
  Caddy redirige `/comptoir` → `/comptoir/` para que esas rutas no apunten a la raíz.
- **Vite** (sol-y-luna, sculpt-detox, atelie-queijos): se compilan con `BASE_PATH=/<sitio>/`.
  - `vite.config.ts` → `base`, que pone la carpeta en scripts, CSS e `index.html`.
  - `src/shared/base.ts` → `withBase` / `stripBase`: el router añade la carpeta a los enlaces y la
    quita al leer la dirección. Las rutas de la app se siguen escribiendo sin ella (`/en`, `/reserver`).
  - Las fotos y fuentes de `public/` que el código nombra como texto (`'/img/…'`) las corrige
    `scripts/build.mjs` después del build.
  - Sin `BASE_PATH` cada web compila igual que antes, para su propio dominio en `/`.
- Bajo una subcarpeta **no se registra el service worker** (con scope `/` se metería en las otras
  muestras) y Mexi-and-Co no pide `/api/menu`: pinta la carta empaquetada.
- Las claves de `localStorage` llevan el prefijo de cada web (`mexiandco:`, `sculptdetox:`,
  `parisabor:`): las cinco comparten dominio.

## Variables

| Variable | Para qué |
| --- | --- |
| `PORT` | La pone Railway; Caddy escucha ahí (8080 si falta). |
| `RAILWAY_PUBLIC_DOMAIN` | La pone Railway. Con ella, canónicos y `og:image` (la miniatura al compartir por WhatsApp) apuntan a la muestra en vez de al dominio futuro del cliente. |
| `SITE_URL` | Opcional: sustituye a la anterior (p. ej. con dominio propio, `https://muestras.tudominio.com`). |

## Añadir una muestra

1. Copiarla a `sites/<nombre>/`.
2. Añadirla a `SITES` en `scripts/build.mjs` (y, si es de Vite, `COPY` de su `package*.json` en el
   `Dockerfile` y aplicar los cambios de base descritos arriba).
3. Añadir `<nombre>` a las dos expresiones `path_regexp` del `Caddyfile`.

## Cuando un cliente paga

Su web se publica desde su propio proyecto, en su dominio y en `/`, **no** desde aquí: allí no hay
`noindex`. Después se quita de este repo (o se deja como muestra).

## Lo que no viene de los proyectos originales

Cada `sites/<sitio>` es una copia de la web pública: sin `server/`, sin `node_modules`, sin
capturas ni recursos originales. El panel `/admin` de la plantilla no se publica (necesita el
servidor y la base de datos). Los proyectos originales siguen en `../` sin tocar.
