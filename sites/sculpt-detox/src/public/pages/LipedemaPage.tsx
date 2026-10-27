import { Check, ChevronRight, ShieldCheck } from 'lucide-react'
import { linkTo, publicRoute } from '../../shared/routing'
import { Photo } from '../../shared/components/Photo'
import { whatsappUrl } from '../business'
import { WhatsAppIcon } from '../components/Brand'
import { Figure } from '../components/Figure'
import { useSite } from '../site'
import { FaqList, RatingChip, ReviewCard, StepList } from './HomePage'
import './home.css'

/**
 * La página propia del lipedema y el post-operatorio: lo que es, cómo ayuda el drenaje, cómo se
 * trabaja y lo que no se hace. Es la que se posiciona por «lipedema Ibiza»; las landings de
 * publicidad van aparte y no se indexan, para no competir con ella.
 */
export function LipedemaPage({ onWhatsApp }: { onWhatsApp: (source: string) => () => void }) {
  const { t, lang } = useSite()
  const copy = t.lipedemaPage
  const cta = (source: string) => (
    <a className="btn btn-primary btn-lg" href={whatsappUrl(t.wa.lipedema)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp(source)}>
      <WhatsAppIcon size={20} /> {copy.cta}
    </a>
  )

  return (
    <article className="article" aria-labelledby="lipedema-title">
      <header className="article-head">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a {...linkTo(publicRoute({ view: 'inicio', lang }))}>{t.nav.home}</a>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{copy.breadcrumb}</span>
        </nav>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1 id="lipedema-title">{copy.title}</h1>
        <p className="article-lead">{copy.lead}</p>
        <div className="article-actions">
          {cta('lipedema-cabecera')}
          <RatingChip />
        </div>
        <nav className="article-index" aria-label={copy.indexLabel}>
          <span>{copy.indexLabel}</span>
          <ul>
            {copy.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}
          </ul>
        </nav>
      </header>

      <div className="article-grid">
        <div className="article-body">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className="article-section reveal" aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list.length > 0 && (
                <ul className="ticks">
                  {section.list.map((item) => <li key={item}><Check size={17} aria-hidden="true" /> {item}</li>)}
                </ul>
              )}
            </section>
          ))}
          <p className="disclaimer is-strong"><ShieldCheck size={20} aria-hidden="true" /> {copy.disclaimer}</p>
        </div>

        <aside className="article-aside">
          <Figure src="/img/sculptdetox/ia-michele-drenaje-piernas.webp" alt={t.specialty.photoAlt} note={t.specialty.photoNote} sizes="(min-width: 900px) 34vw, 100vw" width={1103} height={1200} />
          <div className="aside-card">
            <h2>{copy.ctaTitle}</h2>
            <p>{copy.ctaText}</p>
            {cta('lipedema-lateral')}
          </div>
        </aside>
      </div>

      <section className="article-results reveal" aria-labelledby="lipedema-results-title">
        <div className="results-photo is-portrait">
          <Photo src="/img/sculptdetox/antes-despues-lipedema-logo.webp" alt={copy.resultsAlt} sizes="(min-width: 900px) 36vw, 100vw" width={1080} height={1350} />
        </div>
        <div className="results-body">
          <h2 id="lipedema-results-title">{copy.resultsTitle}</h2>
          <p>{copy.resultsText}</p>
          <ReviewCard index={2} />
        </div>
      </section>

      <section className="article-steps" aria-labelledby="lipedema-steps-title">
        <h2 id="lipedema-steps-title">{t.steps.title}</h2>
        <StepList />
      </section>

      <section className="article-faq" aria-labelledby="lipedema-faq-title">
        <h2 id="lipedema-faq-title">{copy.faqTitle}</h2>
        <FaqList ids={copy.faqIds} />
      </section>

      <section className="cta-band" aria-labelledby="lipedema-cta-title">
        <h2 id="lipedema-cta-title">{copy.ctaTitle}</h2>
        <p>{copy.ctaText}</p>
        {cta('lipedema-final')}
        <p className="cta-band-note">{copy.disclaimer}</p>
      </section>
    </article>
  )
}
