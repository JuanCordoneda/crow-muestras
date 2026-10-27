import { useMemo, useState, type FormEvent } from 'react'
import { Check, Eye, EyeOff, Languages, Plus, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react'
import type { Dish, Lang, Menu, Special, SpecialPeriod } from '../../shared/types'
import { ConfirmDialog, Modal, type ConfirmRequest } from '../../shared/components/Ui'
import { thumbSrc } from '../../shared/components/Photo'
import { LANG_NAMES, pick, price } from '../../shared/i18n'
import { cx, uid } from '../../shared/utils'
import { emptyLocalized, missingLangs, parsePrice, priceInput } from '../helpers'
import type { PushToast } from '../hooks'
import type { CommitMenu } from '../useMenuSync'
import { Field, Group, LangTabs, Segmented, Switch } from './Fields'
import { PanelCard } from './PanelCard'
import { autoTranslate } from '../autoTranslate'
import { PhotoField } from './PhotoField'

const PERIODS: { value: SpecialPeriod; label: string }[] = [
  { value: 'semana', label: 'De la semana' },
  { value: 'mes', label: 'Del mes' },
]

/** El nombre largo del periodo, el que se usa en los textos de la pantalla. */
const PERIOD_TEXT: Record<SpecialPeriod, string> = { semana: 'de la semana', mes: 'del mes' }

const newSpecial = (period: SpecialPeriod): Special => ({
  id: uid(),
  period,
  name: emptyLocalized(),
  description: emptyLocalized(),
  price: 0,
  perPerson: false,
  photo: '',
  dishId: '',
  visible: true,
})

type Props = {
  menu: Menu
  commit: CommitMenu
  toast: PushToast
  confirm: (request: ConfirmRequest) => void
  open: boolean
  onToggle: () => void
}

/**
 * Las ofertas y sugerencias fuera de carta: las de esta semana y las de este mes. Es lo que más se
 * toca del panel —cambian cada lunes y cada día 1—, así que va arriba del todo de la Carta y las
 * dos listas se ven desde el mismo sitio.
 *
 * El ojo las quita de la portada sin borrarlas: la sugerencia del año pasado vuelve con un toque.
 */
export function SpecialsPanel({ menu, commit, toast, confirm, open, onToggle }: Props) {
  const [period, setPeriod] = useState<SpecialPeriod>('semana')
  const [editing, setEditing] = useState<{ special: Special; isNew: boolean } | null>(null)
  const { specials } = menu.settings
  const shown = specials.filter((special) => special.period === period)
  const count = (value: SpecialPeriod) => specials.filter((special) => special.period === value && special.visible).length
  const live = specials.filter((special) => special.visible).length

  const setSpecials = (update: (list: Special[]) => Special[]) =>
    commit((current) => ({ ...current, settings: { ...current.settings, specials: update(current.settings.specials) } }))

  const save = (special: Special, isNew: boolean) => {
    setSpecials((list) => (isNew ? [...list, special] : list.map((entry) => (entry.id === special.id ? special : entry))))
    setEditing(null)
    setPeriod(special.period)
    toast(isNew ? `Añadida a la portada, ${PERIOD_TEXT[special.period]}` : 'Sugerencia guardada')
  }

  const remove = (special: Special) => confirm({
    title: 'Borrar sugerencia',
    text: `«${pick(special.name, 'es') || 'Sin nombre'}» desaparecerá de la portada. Si solo quieres quitarla por un tiempo, apaga el ojo.`,
    action: 'Borrar',
    danger: true,
    onConfirm: () => {
      setEditing(null)
      setSpecials((list) => list.filter((entry) => entry.id !== special.id))
      toast('Sugerencia borrada')
    },
  })

  const toggle = (special: Special) => {
    setSpecials((list) => list.map((entry) => (entry.id === special.id ? { ...entry, visible: !entry.visible } : entry)))
    toast(special.visible ? 'Ya no sale en la portada' : 'Vuelve a salir en la portada')
  }

  return (
    <PanelCard
      id="ofertas"
      className="adm-specials"
      icon={<Sparkles size={20} />}
      title="Ofertas y sugerencias"
      lead="Fuera de carta, en lo alto de la portada. Enlázalas a un plato y toman su foto y su precio."
      // Plegado, lo único que se pregunta: cuántas salen ahora en la portada, de cada periodo.
      summary={live ? `${live} en la portada · ${count('semana')} de la semana, ${count('mes')} del mes` : 'Ninguna en la portada ahora mismo'}
      open={open}
      onToggle={onToggle}
    >
      {/* Cuántas salen ahora mismo en la web de cada periodo: es la pregunta de cada lunes. */}
      <Segmented<SpecialPeriod>
        label="Periodo"
        value={period}
        options={PERIODS.map((entry) => ({ value: entry.value, label: `${entry.label} · ${count(entry.value)}` }))}
        onChange={setPeriod}
      />
      <p className="adm-muted adm-specials-lead">
        {count(period)
          ? `${count(period)} ${count(period) === 1 ? 'sale' : 'salen'} ahora en la portada.`
          : `Ninguna sale ahora en la portada: la web no enseña el apartado ${PERIOD_TEXT[period]}.`}
      </p>
      {shown.length ? (
        <ul className="adm-dishes">
          {shown.map((special) => {
            const dish = menu.dishes.find((entry) => entry.id === special.dishId)
            const photo = special.photo || dish?.photo
            const amount = special.price || dish?.price || 0
            const name = pick(special.name, 'es') || 'Sin nombre'
            return (
              <li key={special.id} className={cx('adm-dish', !special.visible && 'is-oculto')}>
                <button type="button" className="adm-dish-main" onClick={() => setEditing({ special, isNew: false })}>
                  <span className="adm-dish-thumb">
                    {photo ? <img src={thumbSrc(photo, 120)} alt="" loading="lazy" width={56} height={56} /> : <UtensilsCrossed size={20} aria-hidden="true" />}
                  </span>
                  <span className="adm-dish-text">
                    <strong>{name}</strong>
                    <small>
                      {amount ? price(amount, 'es') : 'Sin precio'}
                      {dish ? ` · ${pick(dish.name, 'es')}` : ''}
                      {dish?.status === 'oculto' ? ' · plato oculto, no sale' : ''}
                      {!special.visible ? ' · oculta' : ''}
                    </small>
                  </span>
                </button>
                <button type="button" className={cx('adm-icon-btn', !special.visible && 'is-off')} aria-pressed={special.visible} aria-label={`Visible en la web: ${name}`} onClick={() => toggle(special)}>
                  {special.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="adm-muted adm-cat-empty">Todavía no hay ninguna {PERIOD_TEXT[period]}.</p>
      )}
      <button type="button" className="adm-add-row" onClick={() => setEditing({ special: newSpecial(period), isNew: true })}>
        <Plus size={20} aria-hidden="true" /> Añadir oferta {PERIOD_TEXT[period]}
      </button>

      {editing && (
        <SpecialEditor
          special={editing.special}
          isNew={editing.isNew}
          dishes={menu.dishes}
          menu={menu}
          onSave={(special) => save(special, editing.isNew)}
          onDelete={editing.isNew ? undefined : () => remove(editing.special)}
          onClose={() => setEditing(null)}
        />
      )}
    </PanelCard>
  )
}

function SpecialEditor({ special, isNew, dishes, menu, onSave, onDelete, onClose }: {
  special: Special
  isNew: boolean
  dishes: Dish[]
  menu: Menu
  onSave: (special: Special) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(special)
  const [lang, setLang] = useState<Lang>('es')
  const [priceRaw, setPriceRaw] = useState(special.price ? priceInput(special.price) : '')
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(false)
  const [translating, setTranslating] = useState(false)
  const patch = (next: Partial<Special>) => setDraft((previous) => ({ ...previous, ...next }))
  const dish = dishes.find((entry) => entry.id === draft.dishId)
  const missing = useMemo(() => ({ ...missingLangs([draft.name, draft.description]), es: !draft.name.es.trim() && !dish }), [draft.name, draft.description, dish])
  const dirty = JSON.stringify(draft) !== JSON.stringify(special) || priceRaw !== (special.price ? priceInput(special.price) : '')

  /** Al enlazar un plato se copian sus nombres si aún no hay: casi siempre la sugerencia se llama igual. */
  const link = (dishId: string) => {
    const chosen = dishes.find((entry) => entry.id === dishId)
    setDraft((previous) => ({
      ...previous,
      dishId,
      name: chosen && !previous.name.es.trim() ? { ...chosen.name } : previous.name,
      perPerson: chosen ? chosen.perPerson : previous.perPerson,
    }))
    setError('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (translating) return
    if (!draft.name.es.trim()) {
      setLang('es')
      setError('Pon un nombre en castellano o enlaza un plato.')
      return
    }
    const value = priceRaw.trim() ? parsePrice(priceRaw) : 0
    if (value === null) {
      setError('El precio no se entiende. Escríbelo así: 21,50 (o déjalo vacío).')
      return
    }
    const trim = (text: Special['name']) => ({ es: text.es.trim(), en: text.en.trim(), de: text.de.trim(), fr: text.fr.trim() })
    setTranslating(true)
    const { texts: [name, description] } = await autoTranslate([
      { before: special.name, after: trim(draft.name) },
      { before: special.description, after: trim(draft.description) },
    ])
    setTranslating(false)
    onSave({ ...draft, name, description, price: value })
  }

  return (
    <Modal kicker={isNew ? 'Nueva sugerencia' : 'Editar sugerencia'} title={pick(draft.name, 'es') || 'Sugerencia sin nombre'} onClose={() => (dirty ? setAsking(true) : onClose())} size="wide">
      <form className="adm-form" onSubmit={submit} noValidate>
        <Group label="Periodo">
          <Segmented<SpecialPeriod> label="Periodo" value={draft.period} options={PERIODS} onChange={(period) => patch({ period })} />
        </Group>
        <Field label="Plato de la carta" hint="Opcional. Si es un arroz, la web ofrece encargarlo con la reserva.">
          <select value={draft.dishId} onChange={(event) => link(event.currentTarget.value)}>
            <option value="">Ninguno (fuera de carta)</option>
            {menu.categories.map((category) => (
              <optgroup key={category.id} label={pick(category.name, 'es')}>
                {dishes.filter((entry) => entry.categoryId === category.id).map((entry) => (
                  <option key={entry.id} value={entry.id}>{pick(entry.name, 'es')}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <LangTabs value={lang} onChange={setLang} missing={missing} />
        <Field label={`Nombre · ${LANG_NAMES[lang]}`} error={lang === 'es' ? error : undefined}>
          <input value={draft.name[lang]} placeholder={lang === 'es' ? 'Ej. Arroz de bogavante' : pick(draft.name, 'es')} onChange={(event) => { const value = event.currentTarget.value; setDraft((previous) => ({ ...previous, name: { ...previous.name, [lang]: value } })) }} />
        </Field>
        <Field label={`Descripción · ${LANG_NAMES[lang]}`} hint={lang === 'es' ? 'Una frase que abra el apetito. Al guardar se traduce sola.' : 'Vacío = se traduce sola del castellano al guardar.'}>
          <textarea rows={3} maxLength={400} value={draft.description[lang]} placeholder={lang === 'es' ? (dish ? pick(dish.description, 'es') : '') : pick(draft.description, 'es')} onChange={(event) => { const value = event.currentTarget.value; setDraft((previous) => ({ ...previous, description: { ...previous.description, [lang]: value } })) }} />
        </Field>
        <div className="adm-form-row is-two">
          <Field label="Precio" hint={dish ? `Vacío = el del plato (${price(dish.price, 'es')}).` : 'Vacío = sin precio.'}>
            <span className="adm-price-input">
              <input type="text" inputMode="decimal" value={priceRaw} placeholder={dish ? priceInput(dish.price) : '0,00'} onChange={(event) => setPriceRaw(event.currentTarget.value)} />
              <span aria-hidden="true">€</span>
            </span>
          </Field>
          <Switch checked={draft.perPerson} onChange={(perPerson) => patch({ perPerson })} label="Por persona" hint="Arroces y paellas." />
        </div>
        <Group label="Foto" hint={dish?.photo && !draft.photo ? 'Sin foto propia se usa la del plato.' : undefined}>
          <PhotoField value={draft.photo} alt={pick(draft.name, 'es')} onChange={(photo) => patch({ photo })} />
        </Group>
        <Switch checked={draft.visible} onChange={(visible) => patch({ visible })} label="Sale en la portada" />
        {error && lang !== 'es' && <p className="adm-error" role="alert">{error}</p>}

        <div className="adm-sheet-bar">
          {onDelete && (
            <button type="button" className="adm-bar-delete" onClick={onDelete}>
              <Trash2 size={20} aria-hidden="true" /> <span>Borrar</span>
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
          request={{ title: '¿Descartar los cambios?', text: 'Lo que has cambiado en esta sugerencia no se ha guardado.', action: 'Descartar', danger: true, onConfirm: onClose }}
          onClose={() => setAsking(false)}
        />
      )}
    </Modal>
  )
}
