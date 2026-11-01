import { useState } from 'react'
import { useStore } from '../store.jsx'
import { addDays, daysBetween, formatDay, formatRange, startOfWeek, todayISO } from '../lib/dates.js'
import { periodStats, round1 } from '../lib/stats.js'
import Icon from '../components/Icon.jsx'
import LineChart from '../components/LineChart.jsx'
import SessionRow from '../components/SessionRow.jsx'

// How far back the weekly chart looks. "plan" = from the first plan week.
const RANGES = [
  { value: '4', label: 'Last month' },
  { value: '13', label: 'Last 3 months' },
  { value: '26', label: 'Last 6 months' },
  { value: 'plan', label: 'Whole plan' },
]

export default function Progress({ onOpenSession }) {
  const { plan } = useStore()
  const today = todayISO()
  const races = [...(plan.meta.races || [])].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <header className="page-head">
        <h1>Progress</h1>
      </header>

      <h3 className="section-title">Races</h3>
      <div className="race-list">
        {races.map((r) => {
          const days = daysBetween(today, r.date)
          return (
            <div key={r.name} className={`card flat race-card prio-${r.priority}`}>
              <div className="race-left">
                <span className="prio">{r.priority}</span>
                <div>
                  <div className="race-name">{r.name}</div>
                  <div className="muted small">
                    {formatDay(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.dateConfirmed === false && ' (TBC)'}
                    {r.distanceKm ? ` · ${r.distanceKm} km` : ''}
                    {r.goal ? ` · Goal ${r.goal}` : ''}
                  </div>
                </div>
              </div>
              <div className="race-days">
                {days >= 0 ? <><strong>{days}</strong><span>days</span></> : <span className="muted"><Icon name="flag" size={18} /> Done</span>}
              </div>
            </div>
          )
        })}
      </div>

      <WeeklySection />
      <PlanToDate onOpenSession={onOpenSession} />
    </>
  )
}

/** "1h 05m" style; "0m" when nothing was logged. */
function formatTime(sec) {
  const m = Math.round(sec / 60)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`
}

/** Weekly distance over the chosen range, Strava-style: tap or drag along the line to pick a week. */
function WeeklySection() {
  const { plan, logs } = useStore()
  const today = todayISO()
  const [range, setRange] = useState('13')

  // Monday-start weeks, ending with the current one.
  const thisWeek = startOfWeek(today)
  const count = range === 'plan'
    ? Math.max(1, Math.floor(daysBetween(startOfWeek(plan.firstDate), thisWeek) / 7) + 1)
    : Number(range)
  const weeks = Array.from({ length: count }, (_, i) => {
    const start = addDays(thisWeek, -7 * (count - 1 - i))
    const end = addDays(start, 6)
    return { start, end, ...periodStats(plan, logs, start, end) }
  })

  const [picked, setPicked] = useState(null)
  const active = picked != null && picked < weeks.length ? picked : weeks.length - 1
  const sel = weeks[active]

  return (
    <section className="card flat progress-section">
      <div className="row-between">
        <h3>Weekly distance</h3>
        <label className="select-pill">
          <span className="sr-only">Time range</span>
          <select value={range} onChange={(e) => { setRange(e.target.value); setPicked(null) }}>
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Icon name="down" size={16} />
        </label>
      </div>

      <p className="period-title">{formatRange(sel.start, sel.end)} {sel.end.slice(0, 4)}</p>
      <div className="period-stats">
        <div><span className="stat-label">Distance</span><strong>{round1(sel.km)} km</strong></div>
        <div><span className="stat-label">Time</span><strong>{formatTime(sel.sec)}</strong></div>
        <div><span className="stat-label">Sessions</span><strong>{sel.done}<span className="muted"> / {sel.sessions}</span></strong></div>
      </div>

      <LineChart
        points={weeks.map((w) => ({ date: w.start, value: round1(w.km) }))}
        active={active} onSelect={setPicked}
        label="Kilometres run each week" />

      <details className="table-toggle">
        <summary>Show as table</summary>
        <table className="data-table">
          <thead><tr><th>Week of</th><th>Km</th><th>Time</th><th>Sessions</th></tr></thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.start}>
                <td>{formatDay(w.start, { day: 'numeric', month: 'short' })}</td>
                <td>{round1(w.km)}</td><td>{formatTime(w.sec)}</td><td>{w.done}/{w.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

/** Totals from the first day of the plan up to today, plus a running total of km against the plan. */
function PlanToDate({ onOpenSession }) {
  const { plan, logs } = useStore()
  const today = todayISO()
  const started = today >= plan.firstDate
  const end = today < plan.lastDate ? today : plan.lastDate
  const totals = started ? periodStats(plan, logs, plan.firstDate, end) : null

  // Missed = before today and not ticked. Today's sessions still have time.
  const missed = Object.values(plan.sessions)
    .filter((s) => s.date < today && !logs[s.id]?.completed)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  // Running totals, one point per plan week up to the current one.
  let doneSum = 0, plannedSum = 0
  const points = plan.weeks.filter((w) => w.startDate <= end).map((w) => {
    const s = periodStats(plan, logs, w.startDate, w.endDate < end ? w.endDate : end)
    doneSum += s.km
    plannedSum += s.plannedKm
    return { date: w.startDate, value: round1(doneSum), compare: round1(plannedSum), week: w.weekNumber }
  })
  const [picked, setPicked] = useState(null)
  const active = picked != null && picked < points.length ? picked : points.length - 1
  const sel = points[active]

  return (
    <section className="card flat progress-section">
      <h3>Plan to date</h3>
      {!started
        ? <p className="muted">The plan starts {formatDay(plan.firstDate, { weekday: 'long', day: 'numeric', month: 'long' })}. Totals appear from then.</p>
        : (
          <>
            <div className="period-stats four">
              <div><span className="stat-label">Total km</span><strong>{round1(totals.km)}</strong></div>
              <div><span className="stat-label">Runs</span><strong>{totals.runsDone}</strong></div>
              <div>
                <span className="stat-label">Completed</span>
                <strong>{totals.sessions ? Math.round((totals.done / totals.sessions) * 100) : 0}%</strong>
              </div>
              <div><span className="stat-label">Missed</span><strong>{missed.length}</strong></div>
            </div>

            <div className="chart-legend">
              <span><i className="key line" /> Done</span>
              <span><i className="key dashed" /> Planned</span>
            </div>
            {sel && (
              <p className="chart-readout">
                By week {sel.week}: <strong>{sel.value} km</strong> <span className="muted">of {sel.compare} km planned</span>
              </p>
            )}
            <LineChart points={points} active={active} onSelect={setPicked}
              label="Running total of kilometres since the plan started, done versus planned" />

            {missed.length > 0 && (
              <details className="table-toggle missed">
                <summary>Show missed sessions ({missed.length})</summary>
                {missed.map((s) => (
                  <div key={s.id} className="missed-item">
                    <span className="eyebrow">{formatDay(s.date)}</span>
                    <SessionRow session={s} onOpen={onOpenSession} flat />
                  </div>
                ))}
              </details>
            )}
          </>
        )}
    </section>
  )
}
