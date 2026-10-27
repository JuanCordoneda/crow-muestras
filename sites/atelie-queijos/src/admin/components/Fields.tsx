/**
 * Piezas de formulario del panel, pensadas para el pulgar: todo lo que se toca mide al menos
 * 44 px y los interruptores ocupan la fila entera, no un botoncito al final.
 */
import { useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Lang } from '../../shared/types'
import { LANGS } from '../../shared/i18n'
import { cx } from '../../shared/utils'

/** Campo con etiqueta. Envuelve un único control: tocar la etiqueta enfoca el campo. */
export function Field({ label, hint, error, children, className }: {
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('adm-field', error && 'has-error', className)}>
      <span className="adm-label">{label}</span>
      {children}
      {error ? <small className="adm-error" role="alert">{error}</small> : hint ? <small className="adm-hint">{hint}</small> : null}
    </label>
  )
}

/** Grupo con etiqueta para controles de varios botones (una etiqueta solo puede apuntar a uno). */
export function Group({ label, hint, error, children, className }: {
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('adm-field', error && 'has-error', className)} role="group" aria-label={label}>
      <span className="adm-label" aria-hidden="true">{label}</span>
      {children}
      {error ? <small className="adm-error" role="alert">{error}</small> : hint ? <small className="adm-hint">{hint}</small> : null}
    </div>
  )
}

export function Switch({ checked, onChange, label, hint, disabled, className }: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  hint?: ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cx('adm-switch', checked && 'is-on', className)}
      onClick={() => onChange(!checked)}
    >
      <span className="adm-switch-text">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span className="adm-switch-track" aria-hidden="true"><i /></span>
    </button>
  )
}

/**
 * Número con − y +. El centro también se puede escribir: para 60 días de antelación no se
 * pulsa sesenta veces. Mientras se escribe se respeta lo tecleado y al salir se ajusta al rango.
 */
export function Stepper({ label, value, onChange, min = 0, max = 99, step = 1, suffix }: {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Cuánto sube o baja cada toque: los aforos se cuentan de cinco en cinco, no de uno en uno. */
  step?: number
  suffix?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  return (
    <div className="adm-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - step))} disabled={value <= min} aria-label={`Menos ${label.toLowerCase()}`}>
        <Minus size={18} />
      </button>
      <span className="adm-stepper-value">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          value={draft ?? String(value)}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const raw = event.currentTarget.value.replace(/\D/g, '').slice(0, 4)
            setDraft(raw)
            if (raw) onChange(clamp(Number(raw)))
          }}
          onBlur={() => setDraft(null)}
        />
        {suffix && <small>{suffix}</small>}
      </span>
      <button type="button" onClick={() => onChange(clamp(value + step))} disabled={value >= max} aria-label={`Más ${label.toLowerCase()}`}>
        <Plus size={18} />
      </button>
    </div>
  )
}

export type SegmentOption<T extends string> = { value: T; label: ReactNode; tone?: 'ok' | 'warn' | 'muted' | 'indigo' }

/** Selector de una opción entre pocas, todas a la vista: un toque y listo, sin desplegables. */
export function Segmented<T extends string>({ value, options, onChange, label, className }: {
  value: T
  options: SegmentOption<T>[]
  onChange: (next: T) => void
  label: string
  className?: string
}) {
  return (
    <div className={cx('adm-seg', className)} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={cx(option.value === value && 'is-on', option.tone && `tone-${option.tone}`)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Botón que se enciende y se apaga, para alérgenos, distintivos y días de servicio. */
export function Chip({ on, onChange, children, className }: { on: boolean; onChange: (next: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} className={cx('adm-chip', on && 'is-on', className)} onClick={() => onChange(!on)}>
      {children}
    </button>
  )
}

/** Pestañas de idioma. El punto avisa de que falta traducir algo que ya está en castellano. */
export function LangTabs({ value, onChange, missing }: { value: Lang; onChange: (next: Lang) => void; missing?: Partial<Record<Lang, boolean>> }) {
  return (
    <div className="adm-langs" role="tablist" aria-label="Idioma del texto">
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          role="tab"
          aria-selected={lang === value}
          className={cx(lang === value && 'is-on')}
          onClick={() => onChange(lang)}
        >
          {lang.toUpperCase()}
          {missing?.[lang] && (
            <>
              <i className="adm-dot" aria-hidden="true" />
              <span className="sr-only"> (falta traducción)</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}
