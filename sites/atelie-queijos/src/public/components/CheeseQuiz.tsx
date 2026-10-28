import { useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, RotateCcw, Share2 } from 'lucide-react'
import { PAGE_PATHS } from '../../shared/routing'
import { cx } from '../../shared/utils'
import { SITE_URL, track } from '../business'
import { useSite } from '../site'
import { CheeseBoard } from './Brand'

/** Las cinco grandes familias que se ven en el ateliê. */
type Family = 'fleurie' | 'lavee' | 'pressee' | 'chevre' | 'bleu'
type Points = Partial<Record<Family, number>>

/**
 * Lo que suma cada respuesta, pregunta a pregunta y en el orden de los textos (`quiz.questions`).
 * La última pregunta (el acompañamiento) es la que más dice del paladar: desempata ella.
 */
const SCORES: Points[][] = [
  [{ chevre: 2 }, { fleurie: 2 }, { pressee: 2 }, { bleu: 1, lavee: 1 }],
  [{ fleurie: 2 }, { chevre: 2 }, { pressee: 2 }, { lavee: 1, bleu: 1 }],
  [{ bleu: 2, chevre: 1 }, { pressee: 2 }, { fleurie: 2 }, { lavee: 2 }],
]

function resultFor(answers: number[]): Family {
  const total: Record<Family, number> = { fleurie: 0, lavee: 0, pressee: 0, chevre: 0, bleu: 0 }
  answers.forEach((answer, question) => {
    for (const [family, points] of Object.entries(SCORES[question][answer] ?? {})) total[family as Family] += points ?? 0
  })
  const best = Math.max(...Object.values(total))
  // Empate: manda la última respuesta, luego la anterior.
  const order = [...answers].map((answer, question) => Object.keys(SCORES[question][answer]) as Family[]).reverse().flat()
  return order.find((family) => total[family] === best) ?? (Object.keys(total) as Family[]).find((family) => total[family] === best)!
}

/**
 * «Qual queijo francês tem a sua cara?»: tres preguntas y una familia de quesos con ejemplos y su
 * maridaje. Es lo que se aprende en el ateliê, en pequeño y en juego, y termina en las dos cosas que
 * importan: reservar para probarlo o compartir el resultado (en el móvil abre el menú de compartir
 * del teléfono, que lleva a las stories de Instagram y a WhatsApp).
 */
export function CheeseQuiz() {
  const { t, lang, book } = useSite()
  const copy = t.quiz
  const total = copy.questions.length
  const [answers, setAnswers] = useState<number[]>([])
  const [started, setStarted] = useState(false)
  const [copied, setCopied] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const done = answers.length >= total
  const family = done ? resultFor(answers) : null
  const result = family ? copy.results[family] : null

  /** Al cambiar de paso, el foco va al bloque: el lector de pantalla anuncia la nueva pregunta. */
  const focusBox = () => requestAnimationFrame(() => box.current?.focus())

  const answer = (option: number) => {
    const next = [...answers, option]
    setAnswers(next)
    if (next.length >= total) track('quiz_result', { family: resultFor(next), lang })
    focusBox()
  }

  const share = async () => {
    if (!result) return
    const url = `${SITE_URL}${PAGE_PATHS.inicio[lang] === '/' ? '/' : PAGE_PATHS.inicio[lang]}#quiz`
    const text = copy.shareText(result.name)
    track('quiz_share', { family: family ?? '', lang })
    try {
      if (navigator.share) {
        await navigator.share({ title: copy.title, text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      /* el visitante cerró el menú de compartir: no es un error */
    }
  }

  return (
    <div className={cx('quiz-card', done && 'is-done')} ref={box} tabIndex={-1} aria-live="polite">
      <CheeseBoard className="quiz-art board-draw" size={200} />

      {!started && !done && (
        <div className="quiz-intro">
          <ol className="quiz-preview" aria-hidden="true">
            {copy.questions[0].options.map((option) => <li key={option}>{option}</li>)}
          </ol>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => { setStarted(true); focusBox() }}>{copy.start}</button>
        </div>
      )}

      {started && !done && (
        <div className="quiz-step" key={answers.length}>
          <div className="quiz-progress">
            {answers.length > 0 && (
              <button type="button" className="quiz-back" onClick={() => { setAnswers(answers.slice(0, -1)); focusBox() }} aria-label={copy.back}><ArrowLeft size={18} /></button>
            )}
            <span>{copy.step(answers.length + 1, total)}</span>
            <span className="quiz-dots" aria-hidden="true">
              {copy.questions.map((_, position) => <i key={position} className={cx(position <= answers.length && 'is-on')} />)}
            </span>
          </div>
          <h3>{copy.questions[answers.length].q}</h3>
          <div className="quiz-options">
            {copy.questions[answers.length].options.map((option, position) => (
              <button key={option} type="button" onClick={() => answer(position)}>
                <b aria-hidden="true">{'ABCD'[position]}</b>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {done && result && (
        <div className="quiz-result">
          <span className="quiz-yours">{copy.yours}</span>
          <h3>{result.name}</h3>
          <p className="quiz-text">{result.text}</p>
          <dl>
            <div><dt>{copy.examples}</dt><dd>{result.cheeses}</dd></div>
            <div><dt>{copy.pairing}</dt><dd>{result.pairing}</dd></div>
          </dl>
          <div className="quiz-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => book()}><CalendarDays size={18} /> {copy.book}</button>
            <button type="button" className="btn btn-ghost" onClick={share}><Share2 size={17} /> {copied ? copy.copied : copy.share}</button>
          </div>
          <button type="button" className="quiz-again" onClick={() => { setAnswers([]); setStarted(true); focusBox() }}><RotateCcw size={15} /> {copy.again}</button>
        </div>
      )}
    </div>
  )
}
