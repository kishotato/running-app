import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { formatDay } from '../lib/dates.js'
import { sessionLabel } from '../lib/plan.js'
import { paceFrom, paceRange } from '../lib/pace.js'
import { hrZones, zoneColor, zoneLabel } from '../lib/zones.js'
import Icon from '../components/Icon.jsx'
import { DoneButton } from '../components/ui.jsx'

const FEELS = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'ok', label: 'OK' },
  { value: 'tough', label: 'Tough' },
  { value: 'bad', label: 'Bad' },
]

const RPE_SCALE = [
  [1, 'Very light', 'Barely any effort, like a slow walk.'],
  [2, 'Light', 'Very easy. You could chat all day.'],
  [3, 'Easy', 'Comfortable. Full sentences, no problem.'],
  [4, 'Moderate', 'Warming up. Breathing a little deeper.'],
  [5, 'Steady', 'Working but controlled. Short sentences.'],
  [6, 'Somewhat hard', 'Breathing is heavy. A few words at a time.'],
  [7, 'Hard', 'Uncomfortable but sustainable for a while.'],
  [8, 'Very hard', 'Hard to keep going. Only a word or two.'],
  [9, 'Near max', 'Almost all-out. You can hold it only briefly.'],
  [10, 'Max effort', 'Absolute limit. Nothing left.'],
]
// Blue (easy) through green, yellow and orange to red (max).
const rpeColor = (n) => `hsl(${Math.round(210 - ((n - 1) / 9) * 210)} 70% 58%)`

export default function SessionDetail({ id, onClose }) {
  const { plan, logs, toggleDone } = useStore()
  const session = plan.sessions[id]

  // Lock the page behind the sheet so only the sheet scrolls.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Session details">
      <header className="sheet-head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Back"><Icon name="back" /></button>
        <span className="muted">{session ? formatDay(session.date, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</span>
        {session && <DoneButton done={!!logs[id]?.completed} onToggle={() => toggleDone(id)} />}
      </header>
      <div className="sheet-body">
        {!session
          ? <p className="empty">This session isn't in the current plan.</p>
          : (
            <>
              {session.type === 'run' ? <RunInfo session={session} /> : <StrengthInfo session={session} />}
              <LogForm session={session} onSaved={onClose} />
            </>
          )}
      </div>
    </div>
  )
}

function RunInfo({ session }) {
  const { plan, profile } = useStore()
  const zones = profile.lthr ? hrZones(plan.zones, Number(profile.lthr), Number(profile.maxHr) || null) : []
  const hrFor = (zs) => {
    const matched = zones.filter((z) => zs?.includes(z.zone))
    if (!matched.length) return null
    return `${matched[0].min}–${matched[matched.length - 1].max} bpm`
  }
  const { warmup, main, recovery, cooldown, day, week } = session

  return (
    <>
      <p className="eyebrow">Week {week.weekNumber} · {week.phase}{session.slot ? ` · ${session.slot}` : ''}</p>
      <h1 className="detail-title" style={{ '--accent-bar': zoneColor(session.zones) }}>{session.title}</h1>

      <div className="stat-grid">
        {session.distanceKm != null && <Stat label="Distance" value={`${session.distanceKm} km`} />}
        {session.zones?.length > 0 && <Stat label="Zone" value={zoneLabel(session.zones)} sub={hrFor(session.zones)} color={zoneColor(session.zones)} />}
        {paceRange(main?.pace) && <Stat label="Pace" value={paceRange(main.pace)} />}
      </div>

      {warmup && (
        <Block title="Warm-up">
          <Line items={[warmup.distanceKm != null && `${warmup.distanceKm} km`, zoneLabel(warmup.zones), hrFor(warmup.zones)]} />
          {warmup.description && <p>{warmup.description}</p>}
          {warmup.strides && <p>{stridesText(warmup.strides)}</p>}
        </Block>
      )}

      {main && (main.intervals || main.strides || main.target) && (
        <Block title="Main set">
          {main.intervals && (
            <p><strong>{main.intervals.label || `${main.intervals.reps} reps`}</strong>
              {main.intervals.workDistanceM ? ` · ${main.intervals.workDistanceM} m reps` : ''}
              {paceRange(main.pace) ? ` @ ${paceRange(main.pace)}` : ''}</p>
          )}
          {main.strides && <p>{stridesText(main.strides)}</p>}
          {main.target && (
            <>
              {main.target.description && <p><strong>{main.target.description}</strong></p>}
              <Line items={[main.target.distanceKm != null && `${main.target.distanceKm} km`,
                main.target.timeFast && main.target.timeSlow && `Target ${main.target.timeFast}–${main.target.timeSlow}`]} />
            </>
          )}
        </Block>
      )}

      {recovery && (
        <Block title="Recovery">
          <p>{recovery.description || `${recovery.durationSec}s ${recovery.type || ''}`}</p>
        </Block>
      )}

      {cooldown && (
        <Block title="Cool-down">
          <Line items={[cooldown.distanceKm != null && `${cooldown.distanceKm} km`, zoneLabel(cooldown.zones), hrFor(cooldown.zones)]} />
          {cooldown.description && <p>{cooldown.description}</p>}
        </Block>
      )}

      {day.notes?.planned && <Block title="Run notes"><p>{day.notes.planned}</p></Block>}
    </>
  )
}

function StrengthInfo({ session }) {
  const { plan } = useStore()
  const lib = plan.strength[session.strengthId]
  return (
    <>
      <p className="eyebrow">Week {session.week.weekNumber}{session.slot ? ` · ${session.slot}` : ''}</p>
      <h1 className="detail-title" style={{ '--accent-bar': 'var(--strength)' }}>{sessionLabel(session, plan.strength)}</h1>
      {lib ? (
        <>
          <div className="stat-grid">
            <Stat label="Duration" value={`${lib.durationMin} min`} />
            {lib.restSec && <Stat label="Rest" value={`${lib.restSec.min}–${lib.restSec.max}s`} />}
            {lib.variant && <Stat label="Variant" value={lib.variant} />}
          </div>
          <Block title="Exercises">
            <ul className="exercise-list">
              {lib.exercises.map((ex, i) => (
                <li key={i}>
                  <span>{ex.name}</span>
                  <span className="muted">
                    {ex.sets} × {ex.reps ?? `${ex.durationSec}s`}{ex.perSide ? ' each side' : ''}
                  </span>
                  {ex.notes && <small className="muted">{ex.notes}</small>}
                </li>
              ))}
            </ul>
          </Block>
        </>
      ) : <p className="muted">Strength session "{session.strengthId}" isn't in the plan's library.</p>}
    </>
  )
}

function LogForm({ session, onSaved }) {
  const { logs, saveLog } = useStore()
  const existing = logs[session.id] || {}
  const isRun = session.type === 'run'
  const [form, setForm] = useState({
    distanceKm: existing.distanceKm ?? '',
    duration: existing.duration ?? '',
    avgHr: existing.avgHr ?? '',
    rpe: existing.rpe ?? null,
    feel: existing.feel ?? null,
    notes: existing.notes ?? '',
  })
  const [showRpe, setShowRpe] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }))
  const pace = isRun ? paceFrom(Number(form.distanceKm), form.duration) : null

  const submit = (e) => {
    e.preventDefault()
    // Logging any details implies you did the session.
    const anyDetail = form.distanceKm !== '' || form.duration !== '' || form.rpe || form.feel
    saveLog(session.id, { ...form, completed: !!existing.completed || !!anyDetail, pace })
    onSaved()
  }

  return (
    <form className="card flat log-form" onSubmit={submit}>
      <h3>Log</h3>

      {isRun && (
        <div className="field-grid">
          <label className="field">
            <span>Distance (km)</span>
            <input type="number" inputMode="decimal" step="0.01" min="0" placeholder={session.distanceKm ?? ''}
              value={form.distanceKm} onChange={set('distanceKm')} />
          </label>
          <label className="field">
            <span>Time (h:mm:ss)</span>
            <input type="text" inputMode="numeric" placeholder="45:30" value={form.duration} onChange={set('duration')} />
          </label>
          <label className="field">
            <span>Avg HR</span>
            <input type="number" inputMode="numeric" min="0" value={form.avgHr} onChange={set('avgHr')} />
          </label>
          <div className="field">
            <span>Pace</span>
            <output className="computed">{pace ? `${pace} /km` : '—'}</output>
          </div>
        </div>
      )}

      <div className="field" role="group" aria-labelledby="rpe-label">
        <span id="rpe-label" className="label-row">
          RPE (effort 1–10)
          <button type="button" className="help-btn" aria-label="What do the RPE numbers mean?" onClick={() => setShowRpe(true)}>
            <Icon name="help" size={16} strokeWidth={2.4} />
          </button>
        </span>
        <div className="chip-row rpe">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className={`chip${form.rpe === n ? ' active' : ''}`}
              style={form.rpe === n ? { background: rpeColor(n), color: '#111' } : undefined}
              aria-pressed={form.rpe === n} onClick={() => set('rpe')(form.rpe === n ? null : n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="field" role="group" aria-labelledby="feel-label">
        <span id="feel-label">How did it feel?</span>
        <div className="chip-row feel-row">
          {FEELS.map((f) => (
            <button key={f.value} type="button" className={`chip${form.feel === f.value ? ' active' : ''}`}
              aria-pressed={form.feel === f.value} onClick={() => set('feel')(form.feel === f.value ? null : f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Legs, weather, terrain…" />
      </label>

      <button type="submit" className="btn primary block">Save</button>
      {showRpe && <RpeDialog onClose={() => setShowRpe(false)} />}
    </form>
  )
}

/** Centred popup (a modal, not a popover) explaining each RPE number. */
function RpeDialog({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rpe-title" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h3 id="rpe-title">RPE: rate of perceived effort</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <p className="muted small">How hard the run felt, from 1 (very easy) to 10 (all-out).</p>
        <ul className="rpe-list">
          {RPE_SCALE.map(([n, name, desc]) => (
            <li key={n}>
              <span className="rpe-num" style={{ background: rpeColor(n) }}>{n}</span>
              <span><strong>{name}</strong><br /><span className="muted small">{desc}</span></span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn primary block" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

function stridesText(s) {
  return `${s.count} × ${s.durationSec}s strides${s.recoverySec ? `, ${s.recoverySec}s ${s.recoveryType || 'recovery'}` : ''}`
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="stat flat" style={color ? { '--zc': color } : undefined}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${color ? ' zoned' : ''}`}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function Block({ title, children }) {
  return <section className="detail-block flat"><h3>{title}</h3>{children}</section>
}

function Line({ items }) {
  const parts = items.filter(Boolean)
  return parts.length ? <p>{parts.join(' · ')}</p> : null
}
