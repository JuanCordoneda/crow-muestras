import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, Languages, Plus, Star, Trash2, X } from 'lucide-react'
import { ALLERGENS, DISH_TAGS, type Category, type Dish, type DishOption, type DishStatus, type Lang } from '../../shared/types'
import { ConfirmDialog, Modal } from '../../shared/components/Ui'
import { LANG_NAMES, pick } from '../../shared/i18n'
import { uid } from '../../shared/utils'
import { ALLERGEN_LABEL, DISH_STATUS_LABEL, TAG_LABEL, emptyLocalized, missingLangs, parsePrice, priceInput } from '../helpers'
import { Chip, Field, Group, LangTabs, Segmented, Switch } from './Fields'
import { PhotoField } from './PhotoField'
import { autoTranslate } from '../autoTranslate'

type Props = {
  dish: Dish
  isNew: boolean
  categories: Category[]
  onSave: (dish: Dish) => void
  onDelete?: () => void
  onClose: () => void
}

const STATUS_OPTIONS: { value: DishStatus; label: string; tone: 'ok' | 'warn' | 'muted' }[] = [
  { value: 'disponible', label: DISH_STATUS_LABEL.disponible, tone: 'ok' },
  { value: 'agotado', label: DISH_STATUS_LABEL.agotado, tone: 'warn' },
  { value: 'oculto', label: DISH_STATUS_LABEL.oculto, tone: 'muted' },
]

/**
 * Ficha de un plato. Los textos van por pestañas de idioma y el castellano manda: al guardar, lo
 * que falte en otro idioma se traduce solo (ver `autoTranslate`); si el traductor falla, lo que falte
 * en otro idioma la web lo enseña en castellano, y el punto de la pestaña avisa de que falta.
 * Nada se guarda hasta pulsar «Guardar»: se puede cancelar sin miedo a dejar la carta a medias.
 */
export function DishEditor({ dish, isNew, categories, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Dish>(dish)
  const [lang, setLang] = useState<Lang>('es')
  const [priceRaw, setPriceRaw] = useState(() => (isNew && !dish.price ? '' : priceInput(dish.price)))
  const [optionPrices, setOptionPrices] = useState<Record<string, string>>(
    () => Object.fromEntries(dish.options.map((option) => [option.id, priceInput(option.price)])),
  )
  const [errors, setErrors] = useState<{ name?: string; price?: string; options?: string }>({})
  const [asking, setAsking] = useState(false)
  const [translating, setTranslating] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  const patch = (next: Partial<Dish>) => setDraft((previous) => ({ ...previous, ...next }))
  const missing = useMemo(
    () => ({ ...missingLangs([draft.name, draft.description, ...draft.options.map((option) => option.label)]), es: !draft.name.es.trim() }),
    [draft.name, draft.description, draft.options],
  )
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(dish) || (!isNew && priceRaw !== priceInput(dish.price)) || (isNew && priceRaw !== '')
      || draft.options.some((option) => optionPrices[option.id] !== priceInput(option.price)),
    [draft, dish, isNew, priceRaw, optionPrices],
  )

  const requestClose = () => {
    if (dirty) setAsking(true)
    else onClose()
  }

  const setText = (field: 'name' | 'description', value: string) =>
    setDraft((previous) => ({ ...previous, [field]: { ...previous[field], [lang]: value } }))

  const setOption = (id: string, next: Partial<DishOption>) =>
    setDraft((previous) => ({ ...previous, options: previous.options.map((option) => (option.id === id ? { ...option, ...next } : option)) }))

  const addOption = () => {
    const id = uid()
    setDraft((previous) => ({ ...previous, options: [...previous.options, { id, label: emptyLocalized(), price: 0 }] }))
    setOptionPrices((previous) => ({ ...previous, [id]: '' }))
  }

  const removeOption = (id: string) => setDraft((previous) => ({ ...previous, options: previous.options.filter((option) => option.id !== id) }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (translating) return
    const found: typeof errors = {}
    if (!draft.name.es.trim()) found.name = 'El nombre en castellano es obligatorio.'
    const options: DishOption[] = []
    for (const option of draft.options) {
      const value = parsePrice(optionPrices[option.id] ?? '')
      if (value === null || !option.label.es.trim()) found.options = 'Cada opción necesita nombre en castellano y precio.'
      options.push({ ...option, price: value ?? 0, label: trimAll(option.label) })
    }
    const base = parsePrice(priceRaw)
    if (!options.length && base === null) found.price = 'Escribe el precio, por ejemplo 21,50.'
    setErrors(found)
    if (Object.keys(found).length) {
      // El error puede estar en otra pestaña de idioma: el nombre siempre se corrige en castellano.
      if (found.name) setLang('es')
      window.requestAnimationFrame(() => form.current?.querySelector('.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
      return
    }
    // Lo que falte en inglés, alemán y francés se traduce ahora del castellano.
    setTranslating(true)
    const { texts: [name, description, ...labels] } = await autoTranslate([
      { before: dish.name, after: trimAll(draft.name) },
      { before: dish.description, after: trimAll(draft.description) },
      ...options.map((option) => ({ before: dish.options.find((entry) => entry.id === option.id)?.label, after: option.label })),
    ])
    setTranslating(false)
    onSave({
      ...draft,
      name,
      description,
      options: options.map((option, index) => ({ ...option, label: labels[index] })),
      // Con opciones, el precio del plato es el de la más barata: es el «desde» de la carta.
      price: options.length ? Math.min(...options.map((option) => option.price)) : base ?? 0,
      updatedAt: Date.now(),
    })
  }

  const fallback = lang === 'es' ? '' : pick(draft.name, 'es')

  return (
    <Modal kicker={isNew ? 'Nuevo plato' : 'Editar plato'} title={pick(draft.name, 'es') || 'Plato sin nombre'} onClose={requestClose} size="wide">
      <form ref={form} className="adm-form" onSubmit={submit} noValidate>
        <LangTabs value={lang} onChange={setLang} missing={missing} />
        <Field label={`Nombre · ${LANG_NAMES[lang]}`} error={lang === 'es' ? errors.name : undefined}>
          <input
            value={draft.name[lang]}
            placeholder={fallback}
            autoCapitalize="sentences"
            onChange={(event) => { setText('name', event.currentTarget.value); if (lang === 'es') setErrors((previous) => ({ ...previous, name: undefined })) }}
          />
        </Field>
        <Field label={`Descripción · ${LANG_NAMES[lang]}`} hint={lang === 'es' ? 'Ingredientes y preparación, en una o dos frases. Al guardar se traduce sola a los otros idiomas.' : 'Vacío = se traduce sola del castellano al guardar.'}>
          <textarea rows={3} value={draft.description[lang]} placeholder={lang === 'es' ? '' : pick(draft.description, 'es')} onChange={(event) => setText('description', event.currentTarget.value)} />
        </Field>

        <div className="adm-form-row is-two">
          <Field label="Precio" error={errors.price} hint={draft.options.length ? 'Con opciones, se usa el de la más barata.' : undefined}>
            <span className="adm-price-input">
              <input
                type="text"
                inputMode="decimal"
                value={draft.options.length ? priceInput(Math.min(...draft.options.map((option) => parsePrice(optionPrices[option.id] ?? '') ?? 0))) : priceRaw}
                disabled={draft.options.length > 0}
                placeholder="0,00"
                onChange={(event) => { setPriceRaw(event.currentTarget.value); setErrors((previous) => ({ ...previous, price: undefined })) }}
              />
              <span aria-hidden="true">€</span>
            </span>
          </Field>
          <Field label="Sección">
            <select value={draft.categoryId} onChange={(event) => patch({ categoryId: event.currentTarget.value })}>
              {categories.map((category) => <option key={category.id} value={category.id}>{pick(category.name, 'es') || 'Sin nombre'}</option>)}
            </select>
          </Field>
        </div>
        <Switch checked={draft.perPerson} onChange={(perPerson) => patch({ perPerson })} label="Precio por persona" hint="Los arroces: la carta pone «/ persona»." />

        <Group label={`Opciones · ${LANG_NAMES[lang]}`} error={errors.options} hint={draft.options.length ? undefined : 'Para variantes con precio propio: bolas de helado, sabores…'}>
          {draft.options.map((option) => (
            <div className="adm-option" key={option.id}>
              <input
                aria-label={`Nombre de la opción en ${LANG_NAMES[lang]}`}
                value={option.label[lang]}
                placeholder={lang === 'es' ? 'Nombre' : pick(option.label, 'es')}
                onChange={(event) => { const value = event.currentTarget.value; setOption(option.id, { label: { ...option.label, [lang]: value } }) }}
              />
              <span className="adm-price-input is-small">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Precio de la opción"
                  placeholder="0,00"
                  value={optionPrices[option.id] ?? ''}
                  onChange={(event) => { const value = event.currentTarget.value; setOptionPrices((previous) => ({ ...previous, [option.id]: value })) }}
                />
                <span aria-hidden="true">€</span>
              </span>
              <button type="button" className="adm-icon-btn" onClick={() => removeOption(option.id)} aria-label="Quitar opción"><X size={20} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm adm-add-option" onClick={addOption}><Plus size={18} /> Añadir opción</button>
        </Group>

        <Group label="Foto">
          <PhotoField value={draft.photo} alt={pick(draft.name, 'es')} onChange={(photo) => patch({ photo })} />
        </Group>

        <Group label="Estado en la carta">
          <Segmented<DishStatus> label="Estado en la carta" value={draft.status} options={STATUS_OPTIONS} onChange={(status) => patch({ status })} />
        </Group>
        <Switch
          checked={draft.featured}
          onChange={(featured) => patch({ featured })}
          label={<><Star size={16} aria-hidden="true" className="adm-star-inline" /> Especialidad de la casa</>}
          hint="Sale en el carrusel de la portada."
        />

        <Group label="Distintivos" hint="Márcalos solo si son ciertos sin matices.">
          <div className="adm-chips">
            {DISH_TAGS.map((tag) => (
              <Chip key={tag} on={draft.tags.includes(tag)} onChange={(on) => patch({ tags: on ? [...draft.tags, tag] : draft.tags.filter((entry) => entry !== tag) })}>
                {TAG_LABEL[tag]}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Alérgenos" hint="Los 14 de declaración obligatoria.">
          <div className="adm-chips">
            {ALLERGENS.map((allergen) => (
              <Chip
                key={allergen}
                on={draft.allergens.includes(allergen)}
                onChange={(on) => patch({ allergens: on ? [...draft.allergens, allergen] : draft.allergens.filter((entry) => entry !== allergen) })}
              >
                {ALLERGEN_LABEL[allergen]}
              </Chip>
            ))}
          </div>
        </Group>

        <div className="adm-sheet-bar">
          {onDelete && (
            <button type="button" className="adm-bar-delete" onClick={onDelete}>
              <Trash2 size={20} aria-hidden="true" /> <span>Borrar plato</span>
            </button>
          )}
          <button type="button" className="btn btn-white" onClick={requestClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={translating}>
            {translating ? <><Languages size={18} /> Traduciendo…</> : <>{isNew ? <Plus size={18} /> : <Check size={18} />} Guardar</>}
          </button>
        </div>
      </form>
      {asking && (
        <ConfirmDialog
          request={{ title: '¿Descartar los cambios?', text: 'Lo que has cambiado en este plato no se ha guardado.', action: 'Descartar', danger: true, onConfirm: onClose }}
          onClose={() => setAsking(false)}
        />
      )}
    </Modal>
  )
}

const trimAll = (text: Dish['name']) => ({ es: text.es.trim(), en: text.en.trim(), de: text.de.trim(), fr: text.fr.trim() })
