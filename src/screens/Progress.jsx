import { useState } from 'react'
import { useStore } from '../store.jsx'
import { daysBetween, formatDay, todayISO } from '../lib/dates.js'
import { loggedKm, round1, weekStats } from '../lib/stats.js'
import Icon from '../components/Icon.jsx'

export default function Progress() {
  const { plan, logs } = useStore()
  const today = todayISO()

  // Completion only counts sessions up to today, so future runs don't drag it down.
  let due = 0, doneDue = 0, totalKm = 0, runsDone = 0
  for (const s of Object.values(plan.sessions)) {
    const log = logs[s.id]
    if (s.date <= today) { due++; if (log?.completed) doneDue++ }
    if (log?.completed && s.type === 'run') runsDone++
    totalKm += loggedKm(s, log)
  }
  const completion = due ? Math.round((doneDue / due) * 100) : null

  const weeks = plan.weeks.map((w) => ({ week: w, ...weekStats(w, logs) }))
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

      <div className="tiles">
        <div className="card flat tile"><span className="stat-label">Km logged</span><strong>{round1(totalKm)}</strong></div>
        <div className="card flat tile"><span className="stat-label">Runs done</span><strong>{runsDone}</strong></div>
        <div className="card flat tile">
          <span className="stat-label">Completion</span>
          <strong>{completion == null ? '—' : `${completion}%`}</strong>
          <span className="stat-sub">{due ? `${doneDue} of ${due} so far` : 'plan not started'}</span>
        </div>
      </div>

      <div className="card flat">
        <h3>Weekly km</h3>
        <WeeklyKmChart weeks={weeks} />
        <details className="table-toggle">
          <summary>Show as table</summary>
          <table className="data-table">
            <thead><tr><th>Week</th><th>Planned</th><th>Done</th><th>Sessions</th></tr></thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week.weekNumber}>
                  <td>{w.week.weekNumber}</td><td>{w.plannedKm}</td><td>{w.doneKm}</td><td>{w.done}/{w.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  )
}

/** Bars per week: grey outline = planned km, filled accent = km done. Tap a week for its numbers. */
function WeeklyKmChart({ weeks }) {
  const today = todayISO()
  const current = weeks.findIndex((w) => today >= w.week.startDate && today <= w.week.endDate)
  const [active, setActive] = useState(current >= 0 ? current : 0)

  const H = 160, PAD_TOP = 8, PAD_BOTTOM = 22, LEFT = 30
  const slot = 36, barW = 22
  const W = LEFT + weeks.length * slot
  const maxKm = Math.max(10, ...weeks.map((w) => Math.max(w.plannedKm, w.doneKm)))
  const niceMax = Math.ceil(maxKm / 20) * 20
  const y = (km) => PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * (1 - km / niceMax)
  const ticks = [0, niceMax / 2, niceMax]
  const sel = weeks[active]

  return (
    <div className="chart">
      <div className="chart-legend">
        <span><i className="key planned" /> Planned</span>
        <span><i className="key done" /> Done</span>
      </div>
      {sel && (
        <p className="chart-readout">
          Week {sel.week.weekNumber}: <strong>{sel.doneKm}</strong> of {sel.plannedKm} km · {sel.done}/{sel.sessions} sessions
        </p>
      )}
      <div className="chart-scroll">
        <svg width={W} height={H} role="img" aria-label="Weekly kilometres, planned versus done">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={LEFT} x2={W} y1={y(t)} y2={y(t)} className="grid" />
              <text x={LEFT - 6} y={y(t) + 4} className="axis" textAnchor="end">{t}</text>
            </g>
          ))}
          {weeks.map((w, i) => {
            const x = LEFT + i * slot + (slot - barW) / 2
            return (
              <g key={w.week.weekNumber} onClick={() => setActive(i)} className={`bar-group${i === active ? ' active' : ''}`}>
                {/* Invisible tall hit area so the whole column is tappable. */}
                <rect x={LEFT + i * slot} y={0} width={slot} height={H} fill="transparent" />
                <rect x={x} y={y(w.plannedKm)} width={barW} height={Math.max(0, y(0) - y(w.plannedKm))} rx={4} className="bar-planned" />
                {w.doneKm > 0 && <rect x={x + 3} y={y(w.doneKm)} width={barW - 6} height={y(0) - y(w.doneKm)} rx={3} className="bar-done" />}
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" className={`axis${i === current ? ' current' : ''}`}>{w.week.weekNumber}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
