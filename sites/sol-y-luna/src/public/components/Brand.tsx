import type { SVGProps } from 'react'

/**
 * La marca del grupo: un sol de doce rayos —el de los carteles y el papel picado— y el nombre,
 * Mexi-and-Co. El sol suelto va donde no cabe el nombre: los iconos de la app, el sello de las
 * tarjetas y las chinchetas. Todo en `currentColor` salvo el disco, así que se lee igual sobre el
 * crema de la página que sobre la foto de la portada o el azul noche del pie.
 *
 * PENDIENTE: es una marca provisional para la muestra. Si el grupo tiene logo, va aquí.
 */

/** Los rayos del sol, calculados una vez: doce triángulos alternos, largos y cortos. */
const RAYS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI * 2) / 12
  const long = index % 2 === 0
  const point = (radius: number, delta: number) =>
    `${(32 + radius * Math.sin(angle + delta)).toFixed(2)} ${(32 - radius * Math.cos(angle + delta)).toFixed(2)}`
  const spread = long ? 0.17 : 0.13
  return `M${point(17, -spread)} L${point(long ? 29 : 25, 0)} L${point(17, spread)} Z`
}).join(' ')

export function Sun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
      <path d={RAYS} fill="var(--sun, #f2b632)" />
      <circle cx="32" cy="32" r="14" fill="var(--sun, #f2b632)" />
      <circle cx="32" cy="32" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.2" opacity=".9" />
    </svg>
  )
}

/** Logotipo completo: el sol con «Mexi-and-Co» y la línea de debajo. */
export function Logo({ className = '', label = 'Mexi-and-Co' }: { className?: string; label?: string }) {
  return (
    <span className={`logo ${className}`} role="img" aria-label={label}>
      <Sun className="logo-sun" />
      <span className="logo-words" aria-hidden="true">
        <b>Mexi<i>-and-</i>Co</b>
        <small>Quartier Latin · Paris</small>
      </span>
    </span>
  )
}

/** Estrella de la nota de Google, rellena: la de lucide va hueca y a 14 px no se lee como nota. */
export function StarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2.8l2.83 5.73 6.32.92-4.58 4.46 1.08 6.3L12 17.24l-5.65 2.97 1.08-6.3L2.85 9.45l6.32-.92z" />
    </svg>
  )
}

/** El logo de WhatsApp, simplificado para leerse a 18 px (no está en la colección de iconos). */
export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  )
}

/**
 * Tira de papel picado: banderitas recortadas colgando de un cordel, en los colores de la casa.
 * Va de adorno, con poca opacidad, en el borde de las secciones que piden fiesta.
 */
export function PapelPicado({ className = '' }: { className?: string }) {
  return <div className={`papel-picado ${className}`} aria-hidden="true" />
}
