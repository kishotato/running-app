import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { addDays, addMonths, formatMonth, formatRange, monthKey, parseISO, startOfWeek, todayISO } from '../lib/dates.js'
import { runsOf, weekIndexFor } from '../lib/plan.js'
import { weekStats } from '../lib/stats.js'
import { zoneColor } from '../lib/zones.js'
import DayBlock from '../components/DayBlock.jsx'
import { ProgressBar, Segmented, Swipeable } from '../components/ui.jsx'

export default function Plan({ onOpenSession }) {
  const { plan } = useStore()
  const today = todayISO()

  // Remembered while you stay on this tab (e.g. after opening a run and coming back).
  const [mode, setMode] = useState('plan') // 'plan' | 'calendar'
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

      {mode === 'plan'
        ? <WeekView idx={weekIdx} setIdx={setWeekIdx} onOpenSession={onOpenSession} />
        : <CalendarView month={month} setMonth={setMonth} onOpenSession={onOpenSession} />}
    </>
  )
}

function clampDate(iso, min, max) {
  return iso < min ? min : iso > max ? max : iso
}

// Phase colour by the kind of phase, worked out from words in its name.
// First match wins, so "Brighton Taper and Race" counts as a race week.
const PHASE_KINDS = [
  [/race|100|ultra|marathon/i, 'var(--ph-race)'],
  [/recover/i, 'var(--ph-recovery)'],
  [/taper/i, 'var(--ph-taper)'],
  [/peak|block/i, 'var(--ph-peak)'],
  [/build/i, 'var(--ph-build)'],
  [/base/i, 'var(--ph-base)'],
]
const phaseColor = (name) => PHASE_KINDS.find(([re]) => re.test(name))?.[1] || 'var(--ph-other)'

function usePhaseColors(plan) {
  return useMemo(() => {
    const map = {}
    for (const w of plan.weeks) if (w.phase) map[w.phase] = phaseColor(w.phase)
    return map
  }, [plan])
}

/** Day blocks laid out like Home: rows on the page, ticks only for today and earlier. */
function Days({ days, onOpenSession }) {
  const today = todayISO()
  return days.map((d) => <DayBlock key={d.date} day={d} onOpenSession={onOpenSession} flat hideDone={d.date > today} />)
}

function WeekProgress({ week, label }) {
  const { plan, logs } = useStore()
  const stats = weekStats(week, logs, plan.races)
  return (
    <div className="card flat week-progress">
      <div className="row-between">
        <span className="muted">{label}</span>
        <span className="big-stat"><strong>{stats.doneKm}</strong><span> / {stats.plannedKm} km</span></span>
      </div>
      <ProgressBar value={stats.doneKm} max={stats.plannedKm} label="Kilometres completed this week" />
      {week.events?.length > 0 && <p className="small muted">{week.events.join(' · ')}</p>}
    </div>
  )
}

function WeekView({ idx, setIdx, onOpenSession }) {
  const { plan } = useStore()
  const week = plan.weeks[idx]
  const hasPrev = idx > 0
  const hasNext = idx < plan.weeks.length - 1

  return (
    <Swipeable
      title={`Week ${week.weekNumber}`}
      subtitle={`${formatRange(week.startDate, week.endDate)} · ${week.phase}${week.isDownWeek ? ' · Down week' : ''}`}
      onPrev={hasPrev ? () => setIdx(idx - 1) : null}
      onNext={hasNext ? () => setIdx(idx + 1) : null}
      prev={hasPrev && <WeekPage week={plan.weeks[idx - 1]} onOpenSession={onOpenSession} />}
      next={hasNext && <WeekPage week={plan.weeks[idx + 1]} onOpenSession={onOpenSession} />}>
      <WeekPage week={week} onOpenSession={onOpenSession} />
    </Swipeable>
  )
}

function WeekPage({ week, onOpenSession }) {
  return (
    <>
      <WeekProgress week={week} label="This week" />
      <Days days={week.days} onOpenSession={onOpenSession} />
    </>
  )
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const noop = () => {}

function CalendarView({ month, setMonth, onOpenSession }) {
  const { plan } = useStore()
  const today = todayISO()
  const dayIn = (m) => (monthKey(today) === m ? today : `${m}-01`)
  // Either one day or a whole plan week (tapped from the left column) is shown under the calendar.
  const [selected, setSelected] = useState(() => ({ day: dayIn(month) }))

  const hasPrev = month > monthKey(plan.firstDate)
  const hasNext = month < monthKey(plan.lastDate)
  const changeMonth = (n) => {
    const next = addMonths(month, n)
    setMonth(next)
    setSelected({ day: dayIn(next) })
  }
  // The months either side, as they will look once you land on them.
  const side = (n) => {
    const m = addMonths(month, n)
    return <MonthPage month={m} selected={{ day: dayIn(m) }} setSelected={noop} onOpenSession={onOpenSession} />
  }

  return (
    <Swipeable title={formatMonth(month)}
      onPrev={hasPrev ? () => changeMonth(-1) : null}
      onNext={hasNext ? () => changeMonth(1) : null}
      prev={hasPrev && side(-1)}
      next={hasNext && side(1)}>
      <MonthPage month={month} selected={selected} setSelected={setSelected} onOpenSession={onOpenSession} />
    </Swipeable>
  )
}

function MonthPage({ month, selected, setSelected, onOpenSession }) {
  const { plan, logs } = useStore()
  const today = todayISO()
  const phaseColors = usePhaseColors(plan)

  // Rows of 7 days, starting on the Monday on or before the 1st.
  const first = startOfWeek(`${month}-01`)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const all = cells.slice(35).some((d) => monthKey(d) === month) ? cells : cells.slice(0, 35)
  const rows = Array.from({ length: all.length / 7 }, (_, r) => all.slice(r * 7, r * 7 + 7))

  const selectedWeek = selected.week != null ? plan.weeks.find((w) => w.weekNumber === selected.week) : null
  const selectedDay = selected.day ? plan.days[selected.day] : null
  const phases = [...new Set(rows.flat().map((iso) => plan.days[iso]?.week?.phase).filter(Boolean))]

  return (
    <>
      <div className="calendar" role="grid">
        <div className="cal-head" />
        {WEEKDAYS.map((w, i) => <div key={i} className="cal-head">{w}</div>)}
        {rows.map((row) => {
          const week = row.map((iso) => plan.days[iso]?.week).find(Boolean)
          return [
            week
              ? (
                <button key={`w-${row[0]}`} type="button"
                  className={`cal-week${selected.week === week.weekNumber ? ' selected' : ''}`}
                  style={{ '--pc': phaseColors[week.phase] }}
                  onClick={() => setSelected({ week: week.weekNumber })}
                  aria-label={`Week ${week.weekNumber}, ${week.totalKm} km`}>
                  <span className="cal-week-num">W{week.weekNumber}</span>
                  <span className="cal-week-km">{week.totalKm}</span>
                </button>
              )
              : <div key={`w-${row[0]}`} />,
            ...row.map((iso) => {
              const day = plan.days[iso]
              const runs = runsOf(day)
              const allDone = day && day.sessions.length > 0 && day.sessions.every((s) => logs[s.id]?.completed)
              const topZones = runs.flatMap((r) => r.zones || [])
              const cls = ['cal-cell',
                day && 'in-plan',
                monthKey(iso) !== month && 'outside',
                iso === today && 'is-today',
                selected.day === iso && 'selected',
                day && week && selected.week === week.weekNumber && 'in-week',
                allDone && 'all-done'].filter(Boolean).join(' ')
              return (
                <button key={iso} type="button" className={cls} onClick={() => setSelected({ day: iso })}
                  style={day ? { '--pc': phaseColors[day.week.phase] } : undefined}
                  aria-label={parseISO(iso).toDateString()}>
                  <span className="cal-num">{Number(iso.slice(8))}</span>
                  {runs.length > 0 && <span className="cal-dot" style={{ background: zoneColor(topZones) }} />}
                </button>
              )
            }),
          ]
        })}
      </div>

      {phases.length > 0 && (
        <div className="phase-legend">
          {phases.map((p) => <span key={p}><i style={{ background: phaseColors[p] }} />{p}</span>)}
        </div>
      )}

      {selectedWeek
        ? (
          <>
            <WeekProgress week={selectedWeek}
              label={`Week ${selectedWeek.weekNumber} · ${selectedWeek.phase}${selectedWeek.isDownWeek ? ' · Down week' : ''}`} />
            <Days days={selectedWeek.days} onOpenSession={onOpenSession} />
          </>
        )
        : selectedDay
          ? <Days days={[selectedDay]} onOpenSession={onOpenSession} />
          : <p className="empty">Nothing planned on this day.</p>}
    </>
  )
}
