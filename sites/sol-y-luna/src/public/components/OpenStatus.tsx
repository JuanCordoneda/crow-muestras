import type { DayHours } from '../../shared/types'
import { addDays, longDate, openState, weekdayOf, weekdayName } from '../../shared/hours'
import { timeLabel } from '../../shared/hours'
import { cx } from '../../shared/utils'
import { scheduleOf } from '../venues'
import { useSite } from '../site'

/**
 * «Ouvert · jusqu’à 23:00» / «Fermé · réouvre demain à 11:30», para el local cuyas horas se pasan.
 * Es lo primero que busca quien pasa por delante con hambre, así que va arriba del todo.
 */
export function OpenStatus({ hours, className = '' }: { hours: DayHours[]; className?: string }) {
  const { menu, now, t, lang } = useSite()
  const state = openState(scheduleOf(menu.settings, hours), now)

  if (state.kind === 'open') {
    return (
      <span className={cx('open-status', 'is-open', state.soon && 'is-soon', className)} role="status">
        <i aria-hidden="true" />
        {state.soon ? t.status.closingSoon(timeLabel(state.closesAt, lang)) : <>{t.status.open} · {t.status.closesAt(timeLabel(state.closesAt, lang))}</>}
      </span>
    )
  }
  if (state.kind === 'later') {
    return (
      <span className={cx('open-status', 'is-later', className)} role="status">
        <i aria-hidden="true" />
        {t.status.later(timeLabel(state.opensAt, lang))}
      </span>
    )
  }
  const next = state.next
  const day = !next
    ? ''
    : next.date === addDays(now.date, 1)
      ? t.status.tomorrow
      : addDays(now.date, 7) > next.date
        ? weekdayName(weekdayOf(next.date), lang)
        : longDate(next.date, lang)
  return (
    <span className={cx('open-status', 'is-closed', className)} role="status">
      <i aria-hidden="true" />
      {t.status.closed}{next ? <> · {t.status.reopens(day, timeLabel(next.opensAt, lang))}</> : null}
    </span>
  )
}
