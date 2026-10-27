import { useState } from 'react'
import { useStore } from '../store.jsx'
import { addDays, addMonths, formatMonth, formatRange, monthKey, parseISO, startOfWeek, todayISO } from '../lib/dates.js'
import { runsOf, weekIndexFor } from '../lib/plan.js'
import { loggedKm, round1, weekStats } from '../lib/stats.js'
import { zoneColor } from '../lib/zones.js'
import DayBlock from '../components/DayBlock.jsx'
import { ProgressBar, Segmented, Swipeable } from '../components/ui.jsx'

export default function Plan({ onOpenSession }) {
  const { plan } = useStore()
  const today = todayISO()

  // Remembered while you stay on this tab (e.g. after opening a run and coming back).
  const [mode, setMode] = useState('plan') // 'plan' | 'calendar'
  const [view, setView] = useState('week') // 'week' | 'month'
  const [weekIdx, setWeekIdx] = useState(() => weekIndexFor(plan, today))
  const [month, setMonth] = useState(() => monthKey(clampDate(today, plan.firstDate, plan.lastDate)))

  return (
    <>
      <header className="page-head">
        <h1>Plan</h1>
        <p className="muted">{plan.meta.name}</p>
      </header>

      <Segmented label="Plan or calendar" value={mode} onChange={setMode}
        options={[{ value: 'plan', label: 'Plan' }, { value: 'calendar', label: 'Calendar' }]} />

      {mode === 'plan' && (
        <>
          <Segmented label="Week or month" value={view} onChange={setView}
            options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
          {view === 'week'
            ? <WeekView idx={weekIdx} setIdx={setWeekIdx} onOpenSession={onOpenSession} />
            : <MonthView month={month} setMonth={setMonth} onOpenSession={onOpenSession} />}
        </>
      )}

      {mode === 'calendar' && <CalendarView month={month} setMonth={setMonth} onOpenSession={onOpenSession} />}
    </>
  )
}

function clampDate(iso, min, max) {
  return iso < min ? min : iso > max ? max : iso
}

function WeekView({ idx, setIdx, onOpenSession }) {
  const { plan, logs } = useStore()
  const week = plan.weeks[idx]
  const stats = weekStats(week, logs)
  const hasPrev = idx > 0
  const hasNext = idx < plan.weeks.length - 1

  return (
    <Swipeable
      title={`Week ${week.weekNumber}`}
      subtitle={`${formatRange(week.startDate, week.endDate)} · ${week.phase}${week.isDownWeek ? ' · Down week' : ''}`}
      onPrev={hasPrev ? () => setIdx(idx - 1) : null}
      onNext={hasNext ? () => setIdx(idx + 1) : null}>
      <div className="card summary-card">
        <div className="row-between">
          <span><strong>{stats.doneKm}</strong> / {stats.plannedKm} km</span>
          <span className="muted small">{stats.done}/{stats.sessions} done</span>
        </div>
        <ProgressBar value={stats.doneKm} max={stats.plannedKm} label="Week kilometres" />
        {week.events?.length > 0 && <p className="small muted week-events">{week.events.join(' · ')}</p>}
      </div>
      {week.days.map((d) => <DayBlock key={d.date} day={d} onOpenSession={onOpenSession} />)}
    </Swipeable>
  )
}

function MonthView({ month, setMonth, onOpenSession }) {
  const { plan, logs } = useStore()
  const days = Object.values(plan.days).filter((d) => monthKey(d.date) === month).sort((a, b) => a.date.localeCompare(b.date))

  let plannedKm = 0, doneKm = 0
  for (const d of days) {
    plannedKm += d.plannedDistanceKm || 0
    for (const s of d.sessions) doneKm += loggedKm(s, logs[s.id])
  }

  // Group the month's days under their plan week.
  const groups = []
  for (const d of days) {
    const last = groups[groups.length - 1]
    if (last && last.week === d.week) last.days.push(d)
    else groups.push({ week: d.week, days: [d] })
  }

  const hasPrev = month > monthKey(plan.firstDate)
  const hasNext = month < monthKey(plan.lastDate)

  return (
    <Swipeable title={formatMonth(month)}
      onPrev={hasPrev ? () => setMonth(addMonths(month, -1)) : null}
      onNext={hasNext ? () => setMonth(addMonths(month, 1)) : null}>
      <div className="card summary-card">
        <div className="row-between">
          <span><strong>{round1(doneKm)}</strong> / {round1(plannedKm)} km</span>
          <span className="muted small">{days.length ? 'this month' : 'nothing planned'}</span>
        </div>
        <ProgressBar value={doneKm} max={plannedKm} label="Month kilometres" />
      </div>
      {groups.map((g) => (
        <div key={g.week.weekNumber} className="month-week">
          <h3 className="section-title">
            Week {g.week.weekNumber} <span className="muted small">· {g.week.phase}{g.week.isDownWeek ? ' · Down week' : ''} · {g.week.totalKm} km</span>
          </h3>
          {g.days.map((d) => <DayBlock key={d.date} day={d} onOpenSession={onOpenSession} compact />)}
        </div>
      ))}
    </Swipeable>
  )
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function CalendarView({ month, setMonth, onOpenSession }) {
  const { plan, logs } = useStore()
  const today = todayISO()
  const [selected, setSelected] = useState(() => (monthKey(today) === month ? today : `${month}-01`))

  // 6 rows x 7 days, starting on the Monday on or before the 1st.
  const first = startOfWeek(`${month}-01`)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const rows = cells.slice(35).some((d) => monthKey(d) === month) ? cells : cells.slice(0, 35)

  const changeMonth = (n) => {
    const next = addMonths(month, n)
    setMonth(next)
    setSelected(monthKey(today) === next ? today : `${next}-01`)
  }

  const selectedDay = plan.days[selected]

  return (
    <Swipeable title={formatMonth(month)} onPrev={() => changeMonth(-1)} onNext={() => changeMonth(1)}>
      <div className="calendar" role="grid">
        {WEEKDAYS.map((w, i) => <div key={i} className="cal-head">{w}</div>)}
        {rows.map((iso) => {
          const day = plan.days[iso]
          const runs = runsOf(day)
          const allDone = day && day.sessions.length > 0 && day.sessions.every((s) => logs[s.id]?.completed)
          const topZones = runs.flatMap((r) => r.zones || [])
          const cls = ['cal-cell',
            monthKey(iso) !== month && 'outside',
            iso === today && 'is-today',
            iso === selected && 'selected',
            allDone && 'all-done'].filter(Boolean).join(' ')
          return (
            <button key={iso} type="button" className={cls} onClick={() => setSelected(iso)}
              aria-label={parseISO(iso).toDateString()}>
              <span className="cal-num">{Number(iso.slice(8))}</span>
              {day?.plannedDistanceKm > 0 && <span className="cal-km">{day.plannedDistanceKm}</span>}
              {runs.length > 0 && <span className="cal-dot" style={{ background: zoneColor(topZones) }} />}
            </button>
          )
        })}
      </div>
      {selectedDay
        ? <DayBlock day={selectedDay} onOpenSession={onOpenSession} />
        : <p className="empty">Nothing planned on this day.</p>}
    </Swipeable>
  )
}
