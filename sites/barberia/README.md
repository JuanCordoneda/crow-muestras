# Barbería · app de turnos (demo)

Muestra para enseñar a un dueño de barbería: agenda por barbero, control de turnos atendidos /
no vino / sin cargar, reportes y registro de actividad. Sin backend: los datos de ejemplo se
generan en el navegador (`data.js`) y los cambios quedan en `localStorage` (`barberia:*`).

- HTML + CSS + JS sin build. `icons.js` son los íconos de lucide que usa la app.
- Horas siempre en **hora de Argentina** (el dueño la mira desde el exterior).
- Los datos de ejemplo se regeneran solos cada día (semana actual + 3 anteriores, mar a sáb).
  Si se cambia la forma de los datos, subir `VERSION` en `data.js`.
- Al cambiar `app.js`, `data.js` o `styles.css`, subir el `?v=` en `index.html` (Caddy no les pone hash).

## Enlaces para la demo

- `/barberia/?como=dueno` entra directo como dueño; `?como=facu` (o `matias`, `lucas`, `nico`) como barbero.
- `?hora=15:30` simula esa hora de Argentina (para mostrarla de noche con el día "en curso").
- En Configuración: «Restablecer datos de demo».
