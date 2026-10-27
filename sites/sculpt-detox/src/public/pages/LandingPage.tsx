import { Leaf, ShieldCheck, Sparkles, Waves } from 'lucide-react'
import { whatsappUrl } from '../business'
import { WhatsAppIcon } from '../components/Brand'
import { Figure } from '../components/Figure'
import { useSite } from '../site'
import { RatingChip, ReviewCard, StepList, TrustStrip } from './HomePage'
import './home.css'
import './landing.css'

type Kind = 'lipedema' | 'madero'

/**
 * Las landings de publicidad (`/lipedema-ibiza`, `/maderoterapia-ibiza` y sus versiones en
 * inglés). Sin menú ni enlaces de salida: titular, tres beneficios, una opinión, cómo funciona y
 * un único botón, el de WhatsApp, que se repite arriba y abajo para que siempre esté a mano.
 *
 * No se indexan (`noindex` en su HTML): compiten por las mismas búsquedas que `/lipedema` y la
 * portada, y lo que tiene que posicionar son esas.
 */
export function LandingPage({ kind, onWhatsApp }: { kind: Kind; onWhatsApp: (source: string) => () => void }) {
  const { t } = useSite()
  const copy = t.landing[kind]
  const message = kind === 'lipedema' ? t.wa.lipedema : t.wa.madero
  const icons = kind === 'lipedema' ? [Leaf, Waves, ShieldCheck] : [Sparkles, Leaf, Waves]
  const disclaimer = kind === 'lipedema' ? t.landing.lipedema.disclaimer : ''
  const cta = (source: string) => (
    <a className="btn btn-primary btn-lg lp-cta" href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp(`lp-${kind}-${source}`)}>
      <WhatsAppIcon size={21} /> {t.landing.cta}
    </a>
  )

  return (
    <div className={`lp is-${kind}`}>
      <section className="lp-hero" aria-labelledby="lp-title">
        <div className="lp-hero-body">
          <RatingChip />
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 id="lp-title">{copy.title}</h1>
          <p className="lp-text">{copy.text}</p>
          {cta('cabecera')}
          <TrustStrip compact />
          {disclaimer && <p className="disclaimer"><ShieldCheck size={18} aria-hidden="true" /> {disclaimer}</p>}
        </div>
        <div className="lp-hero-photo">
          {kind === 'lipedema' ? (
            <Figure src="/img/sculptdetox/antes-despues-lipedema-logo.webp" alt={t.landing.lipedema.resultsAlt} sizes="(min-width: 900px) 40vw, 100vw" priority width={1080} height={1350} />
          ) : (
            <Figure src="/img/sculptdetox/antes-despues-piernas-cliente.webp" alt={t.landing.madero.photoAlt} sizes="(min-width: 900px) 46vw, 100vw" priority width={1500} height={1201} />
          )}
        </div>
      </section>

      <section className="lp-benefits" aria-label={copy.title}>
        {copy.benefits.map((benefit, index) => {
          const Icon = icons[index]
          return (
            <div key={benefit.title} className="benefit">
              <span className="benefit-icon" aria-hidden="true"><Icon size={22} /></span>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </div>
          )
        })}
      </section>

      <section className="lp-review" aria-label={t.landing.reviewLabel}>
        <ReviewCard index={copy.testimonial} />
      </section>

      <section className="lp-steps" aria-labelledby="lp-steps-title">
        <h2 id="lp-steps-title">{t.landing.stepsTitle}</h2>
        <StepList />
      </section>

      <section className="cta-band" aria-labelledby="lp-cta-title">
        <h2 id="lp-cta-title">{t.landing.ctaTitle}</h2>
        <p>{t.landing.ctaText}</p>
        {cta('final')}
        {disclaimer && <p className="cta-band-note">{disclaimer}</p>}
      </section>
    </div>
  )
}
