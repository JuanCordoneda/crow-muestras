import { useMemo, useState, type FormEvent } from 'react'
import { Check, Languages, Plus, Trash2 } from 'lucide-react'
import type { Category, Lang } from '../../shared/types'
import { ConfirmDialog, Modal } from '../../shared/components/Ui'
import { LANG_NAMES, pick } from '../../shared/i18n'
import { missingLangs } from '../helpers'
import { autoTranslate } from '../autoTranslate'
import { Field, LangTabs, Switch } from './Fields'

type Props = {
  category: Category
  isNew: boolean
  dishCount: number
  onSave: (category: Category) => void
  onDelete?: () => void
  onClose: () => void
}

/** Nombre, aviso y nota al pie de una sección de la carta. Se escriben en castellano y al guardar se traducen solos. */
export function CategoryEditor({ category, isNew, dishCount, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Category>(category)
  const [lang, setLang] = useState<Lang>('es')
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(false)
  const [translating, setTranslating] = useState(false)
  const missing = useMemo(
    () => ({ ...missingLangs([draft.name, draft.note, draft.footnote]), es: !draft.name.es.trim() }),
    [draft.name, draft.note, draft.footnote],
  )
  const dirty = JSON.stringify(draft) !== JSON.stringify(category)

  const setText = (field: 'name' | 'note' | 'footnote', value: string) =>
    setDraft((previous) => ({ ...previous, [field]: { ...previous[field], [lang]: value } }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (translating) return
    if (!draft.name.es.trim()) {
      setLang('es')
      setError('La sección necesita un nombre en castellano.')
      return
    }
    const trim = (text: Category['name']) => ({ es: text.es.trim(), en: text.en.trim(), de: text.de.trim(), fr: text.fr.trim() })
    setTranslating(true)
    const { texts: [name, note, footnote] } = await autoTranslate([
      { before: category.name, after: trim(draft.name) },
      { before: category.note, after: trim(draft.note) },
      { before: category.footnote, after: trim(draft.footnote) },
    ])
    setTranslating(false)
    onSave({ ...draft, name, note, footnote })
  }

  return (
    <Modal
      kicker={isNew ? 'Nueva sección' : `Sección · ${dishCount} ${dishCount === 1 ? 'plato' : 'platos'}`}
      title={pick(draft.name, 'es') || 'Sección sin nombre'}
      onClose={() => (dirty ? setAsking(true) : onClose())}
      size="wide"
    >
      <form className="adm-form" onSubmit={submit} noValidate>
        <LangTabs value={lang} onChange={setLang} missing={missing} />
        <Field label={`Nombre · ${LANG_NAMES[lang]}`} error={lang === 'es' ? error : undefined}>
          <input
            value={draft.name[lang]}
            placeholder={lang === 'es' ? 'Ej. Arroces y fideuàs' : pick(draft.name, 'es')}
            onChange={(event) => { setText('name', event.currentTarget.value); setError('') }}
          />
        </Field>
        <Field label={`Aviso bajo el título · ${LANG_NAMES[lang]}`} hint="Mínimos, precios por persona… Vacío = sin aviso.">
          <textarea rows={3} value={draft.note[lang]} placeholder={lang === 'es' ? '' : pick(draft.note, 'es')} onChange={(event) => setText('note', event.currentTarget.value)} />
        </Field>
        <Field label={`Nota al pie · ${LANG_NAMES[lang]}`} hint="Ej. «Otros arroces bajo petición».">
          <textarea rows={2} value={draft.footnote[lang]} placeholder={lang === 'es' ? '' : pick(draft.footnote, 'es')} onChange={(event) => setText('footnote', event.currentTarget.value)} />
        </Field>
        <Switch checked={draft.visible} onChange={(visible) => setDraft((previous) => ({ ...previous, visible }))} label="Visible en la web" hint="Apagada, la sección entera no sale en la carta." />

        <div className="adm-sheet-bar">
          {onDelete && (
            <button type="button" className="adm-bar-delete" onClick={onDelete}>
              <Trash2 size={20} aria-hidden="true" /> <span>Borrar sección</span>
            </button>
          )}
          <button type="button" className="btn btn-white" onClick={() => (dirty ? setAsking(true) : onClose())}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={translating}>
            {translating ? <><Languages size={18} /> Traduciendo…</> : <>{isNew ? <Plus size={18} /> : <Check size={18} />} Guardar</>}
          </button>
        </div>
      </form>
      {asking && (
        <ConfirmDialog
          request={{ title: '¿Descartar los cambios?', text: 'Lo que has cambiado en esta sección no se ha guardado.', action: 'Descartar', danger: true, onConfirm: onClose }}
          onClose={() => setAsking(false)}
        />
      )}
    </Modal>
  )
}
