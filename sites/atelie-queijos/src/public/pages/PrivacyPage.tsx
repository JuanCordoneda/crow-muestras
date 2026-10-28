import { SHOW_TEXT_TODO } from '../business'
import { useSite } from '../site'

export function PrivacyPage() {
  const { t } = useSite()
  return (
    <div className="info-page is-narrow">
      <header className="page-head">
        <h1>{t.privacy.title}</h1>
        <p>{t.privacy.updated}</p>
      </header>
      <div className="legal">
        {t.privacy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {/* Lo pendiente (el SIRET) solo sale mientras las etiquetas «a completar» estén encendidas. */}
            <p>{section.text}{SHOW_TEXT_TODO && section.todo && ` ${section.todo}`}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
