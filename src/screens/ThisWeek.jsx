import { useStore } from '../store.jsx'
import { daysBetween, formatDay, formatRange, todayISO } from '../lib/dates.js'
import { runsOf, weekIndexFor } from '../lib/plan.js'
import { paceRange } from '../lib/pace.js'
import { weekStats } from '../lib/stats.js'
import { zoneColor, zoneLabel } from '../lib/zones.js'
import Icon from '../components/Icon.jsx'
import DayBlock from '../components/DayBlock.jsx'
import SessionRow from '../components/SessionRow.jsx'
import { DoneButton, ProgressBar } from '../components/ui.jsx'

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
        <p className="eyebrow">{formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>This Week</h1>
        <p className="muted">
          Week {week.weekNumber} · {week.phase}{week.isDownWeek ? ' · Down week' : ''} · {formatRange(week.startDate, week.endDate)}
        </p>
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
        <div className="card flat">
          <div className="row-between">
            <h3>Week progress</h3>
            <span className="muted small">{stats.done} of {stats.sessions} sessions</span>
          </div>
          <div className="big-stat">
            <strong>{stats.doneKm}</strong><span> / {stats.plannedKm} km</span>
          </div>
          <ProgressBar value={stats.doneKm} max={stats.plannedKm} label="Kilometres completed this week" />
          {week.events?.length > 0 && <p className="small muted week-events">{week.events.join(' · ')}</p>}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h3 className="section-title">{beforeStart ? 'Week 1' : 'Coming up'}</h3>
          {upcoming.map((d) => <DayBlock key={d.date} day={d} onOpenSession={onOpenSession} compact />)}
        </>
      )}
    </>
  )
}

function TodayCard({ day, onOpenSession }) {
  const { logs, toggleDone } = useStore()
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
        return (
          <div key={run.id} className={`card flat today-card${done ? ' is-done' : ''}`}
            style={{ '--accent-bar': zoneColor(run.zones) }}
            role="button" tabIndex={0} onClick={() => onOpenSession(run.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenSession(run.id) }}>
            <div className="row-between">
              <p className="eyebrow">Today{run.slot ? ` · ${run.slot}` : ''}</p>
              {run.zones?.length > 0 && <span className="zone-chip" style={{ '--zc': zoneColor(run.zones) }}>{zoneLabel(run.zones)}</span>}
            </div>
            <div className="today-title">{run.title}</div>
            {run.distanceKm != null && <div className="hero-number">{run.distanceKm}<span> km</span></div>}
            <div className="today-meta">
              {run.main?.intervals?.label && <span>{run.main.intervals.label}</span>}
              {paceRange(run.main?.pace) && <span>{paceRange(run.main.pace)}</span>}
              {run.main?.target?.description && <span>{run.main.target.description}</span>}
            </div>
            {day.notes?.planned && <p className="day-note">{day.notes.planned}</p>}
            <div className="today-actions">
              <DoneButton done={done} onToggle={() => toggleDone(run.id)} size="lg" />
              <span className="muted">{done ? 'Done — tap card to log details' : 'Tap to see details & log'}</span>
            </div>
          </div>
        )
      })}
      {others.map((s) => <SessionRow key={s.id} session={s} onOpen={onOpenSession} />)}
    </>
  )
}
