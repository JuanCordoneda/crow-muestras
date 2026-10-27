import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { signIn } from '../../shared/api'
import { linkTo, publicRoute } from '../../shared/routing'
import { withTimeout } from '../helpers'
import { Wave } from './Brand'

type Props = { restaurant: string; onDone: () => void }

/**
 * Puerta del panel. Detrás están los teléfonos de los clientes y la carta publicada, así que no
 * se enseña nada hasta que el servidor da la contraseña por buena. Se escribe una vez: el
 * navegador la recuerda para las siguientes.
 */
export function Login({ restaurant, onDone }: Props) {
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await withTimeout(signIn(password), 12_000)
      if (ok) {
        onDone()
        return
      }
      setError('Contraseña incorrecta')
      input.current?.select()
    } catch {
      setError('No se ha podido comprobar: el servidor no responde. Revisa la conexión e inténtalo otra vez.')
    }
    setBusy(false)
  }

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <span className="adm-login-mark"><Wave /></span>
        <span className="adm-kicker">{restaurant}</span>
        <h1>Panel de El Puerto</h1>
        <p>Carta, ofertas, horarios y fotos. Escribe la contraseña del panel para entrar.</p>
        <label className="adm-field">
          <span className="adm-label">Contraseña</span>
          <span className="adm-password">
            <input
              ref={input}
              type={visible ? 'text' : 'password'}
              value={password}
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              onChange={(event) => { setPassword(event.currentTarget.value); setError('') }}
            />
            <button
              type="button"
              className="adm-icon-btn"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
            >
              {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>
        {error && <p className="adm-login-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!password || busy}>
          <LogIn size={18} /> {busy ? 'Comprobando…' : 'Entrar'}
        </button>
        <a className="adm-login-back" {...linkTo(publicRoute({ view: 'inicio' }))}>Volver a la web</a>
      </form>
    </div>
  )
}
