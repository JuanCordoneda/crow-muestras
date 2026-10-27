import type { SVGProps } from 'react'

/**
 * La marca de Sculpt Detox: el emblema del logo original (la figura con la hoja y la cinta,
 * recortado por `npm run recursos`) y el nombre escrito con la tipografía de la web, espaciado
 * como en el logo. El logo entero lleva el nombre en letra pequeña y a 44 px de alto no se leería.
 */
export function Logo({ className = '', label = 'Sculpt Detox' }: { className?: string; label?: string }) {
  return (
    <span className={`logo ${className}`} role="img" aria-label={label}>
      <img className="logo-mark" src="/img/sculptdetox/emblema-120.webp" srcSet="/img/sculptdetox/emblema-120.webp 120w, /img/sculptdetox/emblema-240.webp 240w" sizes="37px" alt="" width={72} height={90} decoding="async" />
      <span className="logo-text" aria-hidden="true">
        <span className="logo-name">Sculpt Detox</span>
        <span className="logo-sub">Ibiza</span>
      </span>
    </span>
  )
}

/**
 * WhatsApp no está en la colección de iconos: su globo con el teléfono, dibujado con el mismo
 * trazo que el resto (lucide) para que no desentone.
 */
export function WhatsAppIcon({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M3.5 20.5l1.3-4.1A8.6 8.6 0 1 1 8 19.4z" />
      <path d="M9.1 8.4c.2-.4.4-.5.7-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.4.3.8.5 1.2.7.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .5-.2 1.1-.6 1.4-.5.4-1.2.6-1.9.5-1.2-.2-2.4-.8-3.6-1.9-1.2-1.1-2-2.3-2.3-3.5-.2-.7 0-1.6.5-2.1z" />
    </svg>
  )
}

/** Las cinco estrellas de las reseñas, en el dorado fino de la marca. */
export function Stars({ label, size = 15 }: { label: string; size?: number }) {
  // Sin etiqueta son decoración (van junto a un texto que ya dice la nota) y el lector las salta.
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  return (
    <span className="stars" {...a11y}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg key={index} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3-4.6-4.4 6.3-.9z" />
        </svg>
      ))}
    </span>
  )
}
