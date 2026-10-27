import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Ellipsis, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2, TriangleAlert, UtensilsCrossed, X,
} from 'lucide-react'
import { ALLERGENS, type Allergen, type Category, type Dish, type DishStatus, type Menu } from '../../shared/types'
import { Dropdown, EmptyState, Modal, type ConfirmRequest } from '../../shared/components/Ui'
import { thumbSrc } from '../../shared/components/Photo'
import { pick, price } from '../../shared/i18n'
import { cx, fold, uid } from '../../shared/utils'
import { ALLERGEN_LABEL, DISH_STATUS_LABEL, emptyLocalized, moveWithin, slugify, uniqueId } from '../helpers'
import type { PushToast } from '../hooks'
import type { CommitMenu } from '../useMenuSync'
import { Chip, Segmented, type SegmentOption } from '../components/Fields'
import { DishEditor } from '../components/DishEditor'
import { CategoryEditor } from '../components/CategoryEditor'
import type { useGoogleHours } from '../useGoogleHours'
import { usePanelOpen } from '../usePanelOpen'
import { HoursPanel } from '../components/HoursPanel'

type GoogleHours = ReturnType<typeof useGoogleHours>
import { SpecialsPanel } from '../components/SpecialsPanel'

type Props = {
  menu: Menu
  ready: boolean
  commit: CommitMenu
  toast: PushToast
  confirm: (request: ConfirmRequest) => void
  google: GoogleHours
}

type Filter = 'todos' | 'agotado' | 'oculto' | 'destacado' | 'sin-alergenos'

const STATUS_OPTIONS: SegmentOption<DishStatus>[] = [
  { value: 'disponible', label: DISH_STATUS_LABEL.disponible, tone: 'ok' },
  { value: 'agotado', label: DISH_STATUS_LABEL.agotado, tone: 'warn' },
  { value: 'oculto', label: DISH_STATUS_LABEL.oculto, tone: 'muted' },
]

/** Secciones abiertas: cada teléfono recuerda las suyas (la cocina abre arroces, la sala postres). */
const OPEN_KEY = 'parisabor:admin-open-sections'

const readOpen = () => {
  try {
    const raw = localStorage.getItem(OPEN_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(list) ? list.filter((entry): entry is string => typeof entry === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

const newDish = (categoryId: string): Dish => ({
  id: uid(),
  categoryId,
  name: emptyLocalized(),
  description: emptyLocalized(),
  price: 0,
  // En la sección de arroces lo normal es cobrar por persona: se ahorra un toque.
  perPerson: categoryId === 'arroces',
  options: [],
  photo: '',
  tags: [],
  allergens: [],
  featured: false,
  status: 'disponible',
  updatedAt: Date.now(),
})

const newCategory = (): Category => ({ id: uid(), name: emptyLocalized(), note: emptyLocalized(), footnote: emptyLocalized(), visible: true })

const priceText = (dish: Dish) => {
  if (dish.options.length) return `desde ${price(Math.min(...dish.options.map((option) => option.price)), 'es')}`
  return `${price(dish.price, 'es')}${dish.perPerson ? ' / persona' : ''}`
}

type RowProps = {
  dish: Dish
  reorder: boolean
  first: boolean
  last: boolean
  onOpen: (dish: Dish) => void
  onStatus: (dish: Dish, status: DishStatus) => void
  onFeatured: (dish: Dish) => void
  onMove: (dish: Dish, delta: -1 | 1) => void
}

/**
 * Fila de un plato. Marcarlo como agotado es lo que más se hace en pleno servicio: el selector
 * de estado está siempre a la vista y cambia con un solo toque, sin abrir la ficha.
 */
const DishRow = memo(function DishRow({ dish, reorder, first, last, onOpen, onStatus, onFeatured, onMove }: RowProps) {
  const name = pick(dish.name, 'es') || 'Sin nombre'
  return (
    <li className={cx('adm-dish', `is-${dish.status}`, reorder && 'is-reorder')}>
      <button type="button" className="adm-dish-main" onClick={() => onOpen(dish)}>
        <span className="adm-dish-thumb">
          {dish.photo ? <img src={thumbSrc(dish.photo, 120)} alt="" loading="lazy" decoding="async" width={56} height={56} /> : <UtensilsCrossed size={20} aria-hidden="true" />}
        </span>
        <span className="adm-dish-text">
          <strong>{name}</strong>
          <small>{priceText(dish)}</small>
        </span>
      </button>
      {reorder ? (
        <span className="adm-dish-move">
          <button type="button" className="adm-icon-btn is-outline" disabled={first} onClick={() => onMove(dish, -1)} aria-label={`Subir ${name}`}><ArrowUp size={20} /></button>
          <button type="button" className="adm-icon-btn is-outline" disabled={last} onClick={() => onMove(dish, 1)} aria-label={`Bajar ${name}`}><ArrowDown size={20} /></button>
        </span>
      ) : (
        <>
          <button
            type="button"
            className={cx('adm-star', dish.featured && 'is-on')}
            aria-pressed={dish.featured}
            aria-label={`Especialidad de la casa: ${name}`}
            onClick={() => onFeatured(dish)}
          >
            <Star size={22} />
          </button>
          <Segmented<DishStatus> className="adm-dish-status" label={`Estado de ${name}`} value={dish.status} options={STATUS_OPTIONS} onChange={(status) => onStatus(dish, status)} />
        </>
      )}
    </li>
  )
})

export function MenuView({ menu, ready, commit, toast, confirm, google }: Props) {
  const [open, setOpen] = useState<Set<string>>(readOpen)
  /** El horario y las ofertas, plegados o no: cada teléfono recuerda los suyos. */
  const panels = usePanelOpen()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [reorderId, setReorderId] = useState<string | null>(null)
  const [editingDish, setEditingDish] = useState<{ dish: Dish; isNew: boolean } | null>(null)
  const [editingCategory, setEditingCategory] = useState<{ category: Category; isNew: boolean } | null>(null)
  /**
   * Alérgenos de toda una sección. Las veinte pizzas comparten gluten y lácteos, y marcarlos plato
   * a plato son sesenta toques: aquí se aplican de una vez a los que ya tiene cada plato.
   */
  const [bulkAllergens, setBulkAllergens] = useState<{ category: Category; chosen: Allergen[] } | null>(null)

  /** La carta más reciente para las acciones que se confirman o deshacen más tarde. */
  const latest = useRef(menu)
  latest.current = menu

  const toggleOpen = (id: string) => {
    setOpen((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify([...next]))
      } catch {
        /* sin almacenamiento se recuerdan solo en esta visita */
      }
      return next
    })
  }

  /* ---------- platos ---------- */

  const setStatus = useCallback((dish: Dish, status: DishStatus) => {
    commit((current) => ({
      ...current,
      dishes: current.dishes.map((entry) => (entry.id === dish.id && entry.status !== status ? { ...entry, status, updatedAt: Date.now() } : entry)),
    }))
  }, [commit])

  const toggleFeatured = useCallback((dish: Dish) => {
    commit((current) => ({
      ...current,
      dishes: current.dishes.map((entry) => (entry.id === dish.id ? { ...entry, featured: !entry.featured, updatedAt: Date.now() } : entry)),
    }))
  }, [commit])

  const moveDish = useCallback((dish: Dish, delta: -1 | 1) => {
    commit((current) => {
      const item = current.dishes.find((entry) => entry.id === dish.id)
      if (!item) return current
      const dishes = moveWithin(current.dishes, item, delta, (entry) => entry.categoryId === item.categoryId)
      return dishes === current.dishes ? current : { ...current, dishes }
    })
  }, [commit])

  const openDish = useCallback((dish: Dish) => setEditingDish({ dish, isNew: false }), [])

  const saveDish = (dish: Dish, isNew: boolean) => {
    commit((current) => {
      // El id legible se decide al guardar, que es cuando ya hay nombre.
      const saved = isNew ? { ...dish, id: uniqueId(slugify(dish.name.es), current.dishes.map((entry) => entry.id)) } : dish
      const existing = current.dishes.find((entry) => entry.id === saved.id)
      if (existing && existing.categoryId === saved.categoryId) {
        return { ...current, dishes: current.dishes.map((entry) => (entry.id === saved.id ? saved : entry)) }
      }
      // Plato nuevo o cambiado de sección: va al final de su sección.
      const rest = current.dishes.filter((entry) => entry.id !== saved.id)
      const lastOfCategory = rest.map((entry) => entry.categoryId).lastIndexOf(saved.categoryId)
      const at = lastOfCategory >= 0 ? lastOfCategory + 1 : rest.length
      return { ...current, dishes: [...rest.slice(0, at), saved, ...rest.slice(at)] }
    })
    setEditingDish(null)
    if (!open.has(dish.categoryId)) toggleOpen(dish.categoryId)
    toast(isNew ? `«${pick(dish.name, 'es')}» añadido a la carta` : 'Plato guardado')
  }

  const deleteDish = (dish: Dish) => confirm({
    title: 'Borrar plato',
    text: `«${pick(dish.name, 'es') || 'Sin nombre'}» desaparecerá de la carta en los cuatro idiomas. Si solo se ha acabado, márcalo como agotado.`,
    action: 'Borrar',
    danger: true,
    onConfirm: () => {
      const stored = latest.current.dishes.find((entry) => entry.id === dish.id)
      const position = latest.current.dishes.findIndex((entry) => entry.id === dish.id)
      setEditingDish(null)
      if (!stored) return
      commit((current) => ({ ...current, dishes: current.dishes.filter((entry) => entry.id !== dish.id) }))
      toast(`«${pick(stored.name, 'es') || 'Plato'}» borrado`, 'ok', () => {
        commit((current) => (current.dishes.some((entry) => entry.id === stored.id)
          ? current
          : { ...current, dishes: [...current.dishes.slice(0, position), stored, ...current.dishes.slice(position)] }))
      })
    },
  })

  /* ---------- secciones ---------- */

  const toggleVisible = (category: Category) => {
    commit((current) => ({
      ...current,
      categories: current.categories.map((entry) => (entry.id === category.id ? { ...entry, visible: !entry.visible } : entry)),
    }))
    toast(category.visible ? `«${pick(category.name, 'es')}» ya no sale en la web` : `«${pick(category.name, 'es')}» vuelve a salir en la web`)
  }

  const moveCategory = (category: Category, delta: -1 | 1) => {
    commit((current) => {
      const item = current.categories.find((entry) => entry.id === category.id)
      if (!item) return current
      const categories = moveWithin(current.categories, item, delta, () => true)
      return categories === current.categories ? current : { ...current, categories }
    })
  }

  const saveCategory = (category: Category, isNew: boolean) => {
    if (isNew) {
      const id = uniqueId(slugify(category.name.es), latest.current.categories.map((entry) => entry.id))
      commit((current) => ({ ...current, categories: [...current.categories, { ...category, id }] }))
      if (!open.has(id)) toggleOpen(id)
      toast(`Sección «${category.name.es}» creada`)
    } else {
      commit((current) => ({ ...current, categories: current.categories.map((entry) => (entry.id === category.id ? category : entry)) }))
      toast('Sección guardada')
    }
    setEditingCategory(null)
  }

  const deleteCategory = (category: Category) => {
    const count = latest.current.dishes.filter((dish) => dish.categoryId === category.id).length
    confirm({
      title: 'Borrar sección',
      text: count
        ? `Se borrará «${pick(category.name, 'es')}» y sus ${count} ${count === 1 ? 'plato' : 'platos'}. Si solo quieres quitarla de la web por un tiempo, apaga el ojo.`
        : `Se borrará la sección «${pick(category.name, 'es')}», que no tiene platos.`,
      action: 'Borrar',
      danger: true,
      onConfirm: () => {
        const snapshot = latest.current
        const categoryIndex = snapshot.categories.findIndex((entry) => entry.id === category.id)
        const removed = snapshot.dishes.map((dish, index) => ({ dish, index })).filter((entry) => entry.dish.categoryId === category.id)
        const stored = snapshot.categories[categoryIndex]
        setEditingCategory(null)
        if (!stored) return
        commit((current) => ({
          ...current,
          categories: current.categories.filter((entry) => entry.id !== category.id),
          dishes: current.dishes.filter((dish) => dish.categoryId !== category.id),
        }))
        toast(`Sección «${pick(stored.name, 'es')}» borrada`, 'ok', () => {
          commit((current) => {
            if (current.categories.some((entry) => entry.id === stored.id)) return current
            const categories = [...current.categories]
            categories.splice(Math.min(categoryIndex, categories.length), 0, stored)
            // Se reinsertan en orden ascendente: cada plato vuelve a su puesto de antes.
            const dishes = [...current.dishes]
            for (const entry of removed) dishes.splice(Math.min(entry.index, dishes.length), 0, entry.dish)
            return { ...current, categories, dishes }
          })
        })
      },
    })
  }

  /* ---------- lista ---------- */

  const counts = useMemo(() => {
    const result = { agotado: 0, oculto: 0, destacado: 0, sinAlergenos: 0 }
    for (const dish of menu.dishes) {
      if (dish.status === 'agotado') result.agotado += 1
      if (dish.status === 'oculto') result.oculto += 1
      if (dish.featured) result.destacado += 1
      // Los alérgenos hay que rellenarlos plato a plato: este contador dice cuántos quedan.
      if (!dish.allergens.length) result.sinAlergenos += 1
    }
    return result
  }, [menu.dishes])

  const text = fold(query.trim())
  const filtering = Boolean(text) || filter !== 'todos'
  const matches = useCallback((dish: Dish) => {
    if (filter === 'agotado' && dish.status !== 'agotado') return false
    if (filter === 'oculto' && dish.status !== 'oculto') return false
    if (filter === 'destacado' && !dish.featured) return false
    if (filter === 'sin-alergenos' && dish.allergens.length > 0) return false
    return !text || Object.values(dish.name).some((name) => fold(name).includes(text))
  }, [filter, text])

  const sections = useMemo(() => {
    const byCategory = new Map<string, Dish[]>()
    for (const dish of menu.dishes) {
      const list = byCategory.get(dish.categoryId)
      if (list) list.push(dish)
      else byCategory.set(dish.categoryId, [dish])
    }
    return menu.categories.map((category) => {
      const all = byCategory.get(category.id) ?? []
      return { category, all, shown: filtering ? all.filter(matches) : all }
    })
  }, [menu.categories, menu.dishes, filtering, matches])

  const visibleSections = filtering ? sections.filter((section) => section.shown.length) : sections

  if (!ready) {
    return (
      <div className="adm-view" aria-busy="true">
        <header className="adm-view-head"><div><h1>Carta</h1><p className="adm-updated">Cargando la carta…</p></div></header>
        {[0, 1, 2, 3, 4].map((index) => <div key={index} className="adm-skeleton adm-skeleton-row" />)}
      </div>
    )
  }

  return (
    <div className="adm-view adm-menu">
      <header className="adm-view-head">
        <div>
          <h1>Carta</h1>
          <p className="adm-updated">
            {menu.dishes.length} platos en {menu.categories.length} {menu.categories.length === 1 ? 'sección' : 'secciones'}
            {counts.agotado ? ` · ${counts.agotado} ${counts.agotado === 1 ? 'agotado' : 'agotados'}` : ''}
            {counts.oculto ? ` · ${counts.oculto} ${counts.oculto === 1 ? 'oculto' : 'ocultos'}` : ''}
          </p>
          {/* Las tres cosas que se hacen en pleno servicio, dichas donde se ven. */}
          <p className="adm-lead">
            Toca un plato para su precio, su foto y sus alérgenos. Durante el servicio, con la
            estrella se marca una <b>especialidad</b> y con <b>Agotado</b> se tacha en la web al momento.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingCategory({ category: newCategory(), isNew: true })}>
          <Plus size={18} /> Añadir sección
        </button>
      </header>

      {/* El horario va primero: es lo que más se pregunta y lo que peor envejece en la web. */}
      <HoursPanel menu={menu} commit={commit} toast={toast} google={google} open={panels.open.horario} onToggle={() => panels.toggle('horario')} />

      <SpecialsPanel menu={menu} commit={commit} toast={toast} confirm={confirm} open={panels.open.ofertas} onToggle={() => panels.toggle('ofertas')} />

      <label className="adm-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={query} placeholder="Buscar plato" aria-label="Buscar plato" enterKeyHint="search" onChange={(event) => setQuery(event.currentTarget.value)} />
        {query && <button type="button" className="adm-icon-btn" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={18} /></button>}
      </label>

      <div className="adm-filters" role="radiogroup" aria-label="Filtrar platos">
        {([
          ['todos', 'Todos', menu.dishes.length],
          ['agotado', 'Agotados', counts.agotado],
          ['oculto', 'Ocultos', counts.oculto],
          ['destacado', 'Especialidades', counts.destacado],
          ['sin-alergenos', 'Sin alérgenos', counts.sinAlergenos],
        ] as const).map(([value, label, count]) => (
          <button key={value} type="button" role="radio" aria-checked={filter === value} className={cx('adm-filter', filter === value && 'is-on')} onClick={() => setFilter(value)}>
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      {menu.categories.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={24} />}
          title="La carta no tiene secciones"
          text="Crea la primera sección (entrantes, arroces, postres…) y añade sus platos."
          action={<button type="button" className="btn btn-primary" onClick={() => setEditingCategory({ category: newCategory(), isNew: true })}><Plus size={18} /> Añadir sección</button>}
        />
      ) : filtering && visibleSections.length === 0 ? (
        <EmptyState icon={<Search size={24} />} title="Ningún plato coincide" text="Prueba con otra palabra o quita el filtro." action={<button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setFilter('todos') }}>Ver todos</button>} />
      ) : (
        <div className="adm-cats">
          {visibleSections.map(({ category, all, shown }, index) => {
            const expanded = filtering || open.has(category.id)
            const reorder = !filtering && reorderId === category.id
            const name = pick(category.name, 'es') || 'Sección sin nombre'
            const soldOut = all.filter((dish) => dish.status === 'agotado').length
            return (
              <section key={category.id} className={cx('adm-cat', !category.visible && 'is-hidden', expanded && 'is-open')}>
                <div className="adm-cat-head">
                  <button type="button" className="adm-cat-toggle" aria-expanded={expanded} disabled={filtering} onClick={() => toggleOpen(category.id)}>
                    <ChevronDown size={20} aria-hidden="true" className="adm-chevron" />
                    <span>
                      <strong>{name}</strong>
                      <small>
                        {all.length} {all.length === 1 ? 'plato' : 'platos'}
                        {soldOut ? ` · ${soldOut} ${soldOut === 1 ? 'agotado' : 'agotados'}` : ''}
                        {!category.visible ? ' · oculta en la web' : ''}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={cx('adm-icon-btn', !category.visible && 'is-off')}
                    aria-pressed={category.visible}
                    aria-label={`Visible en la web: ${name}`}
                    onClick={() => toggleVisible(category)}
                  >
                    {category.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                  <Dropdown className="adm-icon-btn" align="right" label={<><Ellipsis size={20} aria-hidden="true" /><span className="sr-only">Opciones de {name}</span></>}>
                    {(close) => (
                      <>
                        <button type="button" onClick={() => { close(); setEditingCategory({ category, isNew: false }) }}><Pencil size={18} /> Editar sección</button>
                        <button type="button" disabled={all.length < 2} onClick={() => { close(); setReorderId(category.id); if (!open.has(category.id)) toggleOpen(category.id) }}>
                          <ArrowUpDown size={18} /> Ordenar platos
                        </button>
                        <button type="button" disabled={index === 0 || filtering} onClick={() => { close(); moveCategory(category, -1) }}><ArrowUp size={18} /> Subir sección</button>
                        <button type="button" disabled={index === visibleSections.length - 1 || filtering} onClick={() => { close(); moveCategory(category, 1) }}><ArrowDown size={18} /> Bajar sección</button>
                        <button type="button" disabled={all.length === 0} onClick={() => { close(); setBulkAllergens({ category, chosen: [] }) }}>
                          <TriangleAlert size={18} /> Alérgenos de la sección
                        </button>
                        <button type="button" className="adm-danger-item" onClick={() => { close(); deleteCategory(category) }}><Trash2 size={18} /> Borrar sección</button>
                      </>
                    )}
                  </Dropdown>
                </div>

                {expanded && (
                  <div className="adm-cat-body">
                    {!filtering && !reorder && (
                      <button type="button" className="adm-add-row" onClick={() => setEditingDish({ dish: newDish(category.id), isNew: true })}>
                        <Plus size={20} aria-hidden="true" /> Añadir plato a {name}
                      </button>
                    )}
                    {reorder && (
                      <div className="adm-reorder-bar">
                        <span>Ordena con las flechas.</span>
                        <button type="button" className="btn btn-indigo btn-sm" onClick={() => setReorderId(null)}>Hecho</button>
                      </div>
                    )}
                    {shown.length ? (
                      <ul className="adm-dishes">
                        {shown.map((dish, position) => (
                          <DishRow
                            key={dish.id}
                            dish={dish}
                            reorder={reorder}
                            first={position === 0}
                            last={position === shown.length - 1}
                            onOpen={openDish}
                            onStatus={setStatus}
                            onFeatured={toggleFeatured}
                            onMove={moveDish}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="adm-muted adm-cat-empty">Esta sección todavía no tiene platos.</p>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {editingDish && (
        <DishEditor
          dish={editingDish.dish}
          isNew={editingDish.isNew}
          categories={menu.categories}
          onSave={(dish) => saveDish(dish, editingDish.isNew)}
          onDelete={editingDish.isNew ? undefined : () => deleteDish(editingDish.dish)}
          onClose={() => setEditingDish(null)}
        />
      )}
      {bulkAllergens && (
        <Modal
          kicker={pick(bulkAllergens.category.name, 'es')}
          title="Alérgenos de la sección"
          onClose={() => setBulkAllergens(null)}
        >
          <p className="adm-muted">
            Se añaden a los que ya tenga cada plato de la sección; no se quita ninguno. Para quitarlos, entra en el plato.
          </p>
          <div className="adm-chips">
            {ALLERGENS.map((allergen) => (
              <Chip
                key={allergen}
                on={bulkAllergens.chosen.includes(allergen)}
                onChange={(on) => setBulkAllergens((current) => current && ({
                  ...current,
                  chosen: on ? [...current.chosen, allergen] : current.chosen.filter((entry) => entry !== allergen),
                }))}
              >
                {ALLERGEN_LABEL[allergen]}
              </Chip>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="outline-btn" onClick={() => setBulkAllergens(null)}>Cancelar</button>
            <button
              type="button"
              className="primary-btn"
              disabled={!bulkAllergens.chosen.length}
              onClick={() => {
                const { category, chosen } = bulkAllergens
                const affected = latest.current.dishes.filter((dish) => dish.categoryId === category.id).length
                commit((current) => ({
                  ...current,
                  dishes: current.dishes.map((dish) => (dish.categoryId === category.id
                    ? { ...dish, allergens: [...new Set([...dish.allergens, ...chosen])], updatedAt: Date.now() }
                    : dish)),
                }))
                setBulkAllergens(null)
                toast(`Alérgenos aplicados a ${affected} ${affected === 1 ? 'plato' : 'platos'}`)
              }}
            >
              Aplicar a la sección
            </button>
          </div>
        </Modal>
      )}
      {editingCategory && (
        <CategoryEditor
          category={editingCategory.category}
          isNew={editingCategory.isNew}
          dishCount={menu.dishes.filter((dish) => dish.categoryId === editingCategory.category.id).length}
          onSave={(category) => saveCategory(category, editingCategory.isNew)}
          onDelete={editingCategory.isNew ? undefined : () => deleteCategory(editingCategory.category)}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  )
}
