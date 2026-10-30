import { useStore } from '../store.jsx'
import { daysBetween, formatDay, todayISO } from '../lib/dates.js'
import { runsOf, weekIndexFor } from '../lib/plan.js'
import { parseDuration, paceRange } from '../lib/pace.js'
import { weekStats } from '../lib/stats.js'
import { zoneColor, zoneLabel } from '../lib/zones.js'
import Icon from '../components/Icon.jsx'
import DayBlock from '../components/DayBlock.jsx'
import SessionRow from '../components/SessionRow.jsx'
import { DoneButton, ProgressBar, SlotIcon } from '../components/ui.jsx'

export default function ThisWeek({ onOpenSession }) {
  const { plan, logs } = useStore()
  const today = todayISO()
  const week = plan.weeks[weekIndexFor(plan, today)]
  if (!week) return <p className="empty">No plan loaded.</p>

  const beforeStart = today < plan.firstDate
  const afterEnd = today > plan.lastDate
  const todayDay = plan.days[today]
  const stats = weekStats(week, logs)
  const upcoming = week.days.filter((d) => d.date > today)

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">Week {week.weekNumber} · {formatDay(today, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        <h1>Today</h1>
      </header>

      {beforeStart && (
        <div className="card flat hero-card">
          <p className="eyebrow">Plan starts {formatDay(plan.firstDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <div className="hero-number">{daysBetween(today, plan.firstDate)}<span> days to go</span></div>
          <p className="muted">Here's what week 1 looks like.</p>
        </div>
      )}

      {afterEnd && (
        <div className="card flat hero-card">
          <p className="eyebrow">End of loaded plan</p>
          <p className="muted">Import a plan with more weeks from Profile.</p>
        </div>
      )}

      {todayDay && <TodayCard day={todayDay} onOpenSession={onOpenSession} />}

      {!afterEnd && (
        <div className="card flat week-progress">
          <div className="row-between">
            <span className="muted">This week</span>
            <span className="big-stat"><strong>{stats.doneKm}</strong><span> / {stats.plannedKm} km</span></span>
          </div>
          <ProgressBar value={stats.doneKm} max={stats.plannedKm} label="Kilometres completed this week" />
          {week.events?.length > 0 && <p className="small muted">{week.events.join(' · ')}</p>}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h3 className="section-title eyebrow">{beforeStart ? 'Week 1' : 'Coming up'}</h3>
          {upcoming.map((d) => <DayBlock key={d.date} day={d} onOpenSession={onOpenSession} compact hideDone flat />)}
        </>
      )}
    </>
  )
}

/** Rough duration for a plain steady run: distance x the middle of the pace range. */
function estimateMinutes(run) {
  const { main, distanceKm } = run
  if (!distanceKm || !main?.pace?.fast || !main?.pace?.slow) return null
  if (main.intervals || main.strides || main.target) return null
  const mid = (parseDuration(main.pace.fast) + parseDuration(main.pace.slow)) / 2
  return Math.round((mid * distanceKm) / 60)
}

function TodayCard({ day, onOpenSession }) {
  const { logs, toggleDone } = useStore()
  const zoneName = (zones) => (zones?.length ? `Zone ${zoneLabel(zones).slice(1)}` : null)
  const runs = runsOf(day)
  const others = day.sessions.filter((s) => s.type !== 'run')

  if (day.isRestDay || day.sessions.length === 0) {
    return (
      <div className="card flat today-card rest-card">
        <p className="eyebrow">Today</p>
        <div className="today-title rest-title"><Icon name="bed" size={26} /> Rest day</div>
        <p className="muted">Recover well. {day.notes?.planned || ''}</p>
      </div>
    )
  }

  return (
    <>
      {runs.map((run) => {
        const done = !!logs[run.id]?.completed
        const mins = estimateMinutes(run)
        const meta = [
          run.main?.intervals?.label,
          paceRange(run.main?.pace),
          run.main?.target?.description,
          mins && `about ${mins} min`,
        ].filter(Boolean)
        return (
          <div key={run.id} className={`card flat today-card${done ? ' is-done' : ''}`}>
            {run.zones?.length > 0 && (
              <div className="chip-line">
                <span className="zone-chip" style={{ '--zc': zoneColor(run.zones) }}>
                  <i className="zone-dot" />{zoneName(run.zones)}
                </span>
              </div>
            )}
            <div className="today-title">{run.title}<SlotIcon slot={run.slot} /></div>
            {run.distanceKm != null && <div className="hero-number">{Math.round(run.distanceKm)}<span> km</span></div>}
            {meta.length > 0 && <div className="today-meta">{meta.map((m, i) => <span key={i}>{m}</span>)}</div>}
            <div className="today-actions">
              <button type="button" className="btn primary" onClick={() => onOpenSession(run.id)}>View details</button>
              <DoneButton done={done} onToggle={() => toggleDone(run.id)} />
            </div>
          </div>
        )
      })}
      {others.map((s) => <SessionRow key={s.id} session={s} onOpen={onOpenSession} flat />)}
    </>
  )
}
