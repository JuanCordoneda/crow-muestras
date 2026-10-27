import type { SVGProps } from 'react'

type Svg = SVGProps<SVGSVGElement> & { size?: number }

/**
 * La marca de PariSabor: el nombre en la serif de la web, con «Sabor» en cursiva, y una hoja de
 * parra de trazo fino delante. El logo del blog es una imagen con fondo y a 40 px de alto no se
 * leería: así se adapta solo al color de la cabecera (bordó sobre crema, blanco sobre la foto).
 */
export function Logo({ className = '', label = 'PariSabor' }: { className?: string; label?: string }) {
  return (
    <span className={`logo ${className}`} role="img" aria-label={label}>
      <VineLeaf className="logo-mark" size={30} />
      <span className="logo-text" aria-hidden="true">
        <span className="logo-name">Pari<em>Sabor</em></span>
        <span className="logo-sub">Paris</span>
      </span>
    </span>
  )
}

/** Hoja de parra de trazo fino: el adorno de la marca y de los antetítulos. */
export function VineLeaf({ size = 24, ...props }: Svg) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M24 44V27" />
      <path d="M24 27c-2-3-6-4-9-3 1-3 0-6-3-8 3 0 5-2 6-5 2 2 5 2 6 0 1 2 4 2 6 0 1 3 3 5 6 5-3 2-4 5-3 8-3-1-7 0-9 3z" />
      <path d="M24 27V12M24 21l-6-5M24 21l6-5M24 25l-8 1M24 25l8 1" opacity=".7" />
      <path d="M24 44c3-1 5-3 5-6" opacity=".7" />
    </svg>
  )
}

/**
 * Tábua de quesos en línea fina (la tabla con mango, una cuña, un queso redondo y uvas). Va de
 * adorno, muy apagada, junto a los títulos y en los huecos de las fotos que faltan.
 */
export function CheeseBoard({ size = 96, ...props }: Svg) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 160 100" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {/* la tabla y su mango */}
      <path d="M14 70h112a8 8 0 0 1 0 16H14a8 8 0 0 1 0-16z" />
      <path d="M134 78h11" />
      <circle cx="150" cy="78" r="5" />
      {/* cuña de comté */}
      <path d="M26 70l10-30 34 18v12" />
      <path d="M36 40l34 18" />
      <circle cx="46" cy="60" r="2" /><circle cx="56" cy="64" r="1.5" />
      {/* queso redondo con corte */}
      <path d="M78 70c0-10 10-17 22-17s22 7 22 17" />
      <path d="M100 53v17M100 53l14 4" opacity=".7" />
      {/* uvas */}
      <circle cx="120" cy="44" r="4" /><circle cx="128" cy="46" r="4" /><circle cx="124" cy="52" r="4" /><circle cx="116" cy="51" r="4" />
      <path d="M124 40c1-4 4-6 8-6" />
    </svg>
  )
}

/**
 * WhatsApp no está en la colección de iconos: su globo con el teléfono, dibujado con el mismo
 * trazo que el resto (lucide) para que no desentone.
 */
export function WhatsAppIcon({ size = 20, ...props }: Svg) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M3.5 20.5l1.3-4.1A8.6 8.6 0 1 1 8 19.4z" />
      <path d="M9.1 8.4c.2-.4.4-.5.7-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.4.3.8.5 1.2.7.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .5-.2 1.1-.6 1.4-.5.4-1.2.6-1.9.5-1.2-.2-2.4-.8-3.6-1.9-1.2-1.1-2-2.3-2.3-3.5-.2-.7 0-1.6.5-2.1z" />
    </svg>
  )
}

/** El distintivo azul de cuenta verificada, como lo enseña Instagram junto al nombre. */
export function VerifiedBadge({ size = 16, label }: { size?: number; label: string }) {
  return (
    <svg className="verified" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} focusable="false">
      <path fill="#0095f6" d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.7 1.8-1 3.1 1 3.1-2.7 1.8-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1-2.7-1.8 1-3.1-1-3.1 2.7-1.8 1-3.1 3.2.2z" />
      <path d="M7.8 12.3l2.8 2.8 5.6-5.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
