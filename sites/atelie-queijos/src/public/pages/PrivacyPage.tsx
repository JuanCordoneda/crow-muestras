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
            <p>{section.text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
