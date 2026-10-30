import { formatDay, todayISO } from '../lib/dates.js'
import Icon from './Icon.jsx'
import SessionRow from './SessionRow.jsx'

/** A day heading followed by its sessions (or "Rest"). */
export default function DayBlock({ day, onOpenSession, compact = false, hideDone = false, flat = false }) {
  const isToday = day.date === todayISO()
  return (
    <section className={`day-block${isToday ? ' today' : ''}${compact ? ' compact' : ''}`}>
      <header className="day-head">
        <span className="day-name">{formatDay(day.date)}</span>
        {isToday && <span className="pill accent">Today</span>}
        {!flat && day.plannedDistanceKm > 0 && <span className="day-km">{day.plannedDistanceKm} km</span>}
      </header>
      {day.isRestDay || day.sessions.length === 0
        ? <div className="rest"><Icon name="bed" size={18} /> Rest day</div>
        : day.sessions.map((s) => <SessionRow key={s.id} session={s} onOpen={onOpenSession} hideDone={hideDone} flat={flat} />)}
      {!compact && day.notes?.planned && <p className="day-note">{day.notes.planned}</p>}
    </section>
  )
}
