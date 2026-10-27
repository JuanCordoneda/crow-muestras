import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

/**
 * El backend (API, base de datos y fotos subidas) corre aparte en el 3000: `npm run dev` habla con
 * él sin tocar el código, que siempre pide rutas relativas `/api/...` y `/media/...`.
 * `vite preview` usa el mismo proxy, para probar el build de producción contra el servidor de verdad.
 * Para abrir la web en el móvil desde la misma wifi: `npm run dev -- --host`.
 */
const backend = {
  '/api': { target: 'http://localhost:3000', changeOrigin: true },
  '/media': { target: 'http://localhost:3000', changeOrigin: true },
}

export default defineConfig({
  // `/` en su dominio; `/<sitio>/` cuando se compila dentro del monorepo de muestras.
  base: process.env.BASE_PATH || '/',
  // Preact habla la misma API que React (hooks, Suspense, lazy) en una décima parte del peso:
  // 38 kB comprimidos se quedan en 5. El código de la app no cambia ni una línea.
  plugins: [preact()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/client': 'preact/compat/client',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  server: { proxy: backend },
  preview: { proxy: backend },
  build: {
    // Los navegadores que entienden `<script type="module">` entienden ES2020:
    // subir el objetivo evita transpilar de más y adelgaza el paquete.
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    // El motor cambia poco y la app cambia mucho: separarlos deja el caché del visitante (y el
    // del service worker) intacto entre despliegues.
    rollupOptions: {
      output: {
        manualChunks: {
          preact: ['preact', 'preact/compat', 'preact/hooks', 'preact/jsx-runtime'],
        },
      },
    },
    // El servidor comprime en brotli; medir el gzip en cada build solo alarga el build.
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
  },
})
