import { useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { PREVIEW_KEY, formatDay, previewDate, todayISO } from '../lib/dates.js'
import { downloadJSON, readJSONFile } from '../lib/storage.js'
import { hrZones } from '../lib/zones.js'
import Icon from '../components/Icon.jsx'
import { Segmented } from '../components/ui.jsx'
import { useTheme } from '../lib/theme.js'

const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' }

/** Profile is a settings menu: a list of sections, each opening its own page (#/profile/<id>). */
export default function Profile({ section }) {
  const { plan, profile, isCustomPlan } = useStore()
  const [theme, setTheme] = useTheme()
  const openedHere = useRef(false) // did we push the section page ourselves?

  const open = (id) => { openedHere.current = true; window.location.hash = `/profile/${id}` }
  const back = () => {
    // Same as the phone's back button when we opened it; otherwise just go to the menu.
    if (openedHere.current) { openedHere.current = false; window.history.back() }
    else window.location.replace('#/profile')
  }

  const SECTIONS = {
    heart: { title: 'Heart rate', icon: 'heart', value: profile.lthr ? `LTHR ${profile.lthr} bpm` : 'Not set', page: <HeartRate /> },
    zones: { title: 'Zones & paces', icon: 'zones', value: `${plan.zones.length} zones`, page: <ZonesPaces /> },
    appearance: { title: 'Appearance', icon: 'moon', value: THEME_LABELS[theme], page: <Appearance theme={theme} setTheme={setTheme} /> },
    preview: { title: 'Preview date', icon: 'eye', value: previewDate() ? formatDay(previewDate()) : 'Off', page: <Preview /> },
    data: { title: 'Data & backup', icon: 'download', value: isCustomPlan ? 'Imported plan' : 'Built-in plan', page: <DataTools /> },
  }
  const GROUPS = [['Training', ['heart', 'zones']], ['App', ['appearance', 'preview']], ['Data', ['data']]]

  const current = SECTIONS[section]
  if (current) {
    return (
      <div key={section} className="settings-page">
        <header className="settings-head">
          <button type="button" className="icon-btn" onClick={back} aria-label="Back to Profile"><Icon name="back" /></button>
          <h1>{current.title}</h1>
        </header>
        {current.page}
      </div>
    )
  }

  return (
    <>
      <header className="page-head">
        <h1>Profile</h1>
      </header>
      {GROUPS.map(([group, ids]) => (
        <section key={group} className="settings-group">
          <h3 className="eyebrow">{group}</h3>
          {ids.map((id) => {
            const s = SECTIONS[id]
            return (
              <button key={id} type="button" className="settings-row" onClick={() => open(id)}>
                <span className="settings-icon"><Icon name={s.icon} size={18} /></span>
                <span className="settings-label">{s.title}</span>
                <span className="settings-value">{s.value}</span>
                <Icon name="right" size={18} />
              </button>
            )
          })}
        </section>
      ))}
    </>
  )
}

function HeartRate() {
  const { profile, updateProfile } = useStore()
  return (
    <div className="card flat">
      <div className="field-grid">
        <label className="field">
          <span>LTHR (bpm)</span>
          <input type="number" inputMode="numeric" value={profile.lthr ?? ''}
            onChange={(e) => updateProfile({ lthr: e.target.value })} />
        </label>
        <label className="field">
          <span>Max HR (bpm)</span>
          <input type="number" inputMode="numeric" value={profile.maxHr ?? ''}
            onChange={(e) => updateProfile({ maxHr: e.target.value })} />
        </label>
      </div>
      <p className="small muted">Zones update automatically from your LTHR.</p>
    </div>
  )
}

function ZonesPaces() {
  const { plan, profile, updateProfile } = useStore()
  const lthr = Number(profile.lthr)
  const zones = lthr > 0 ? hrZones(plan.zones, lthr, Number(profile.maxHr) || null) : []
  const setPace = (zone, end, value) => {
    updateProfile({ paces: { ...profile.paces, [zone]: { ...profile.paces?.[zone], [end]: value || null } } })
  }

  if (!zones.length) return <p className="empty">Set your LTHR under Heart rate to see your zones.</p>
  return (
    <div className="zone-list">
      {zones.map((z) => (
        <div key={z.zone} className="card flat zone-card" style={{ '--zc': `var(--z${z.zone})` }}>
          <div className="zone-head">
            <span className="zone-badge">Z{z.zone}</span>
            <div>
              <div className="zone-name">{z.name}</div>
              <div className="muted small">{z.pct.min}–{z.pct.max}% LTHR</div>
            </div>
            <div className="zone-hr"><strong>{z.min}–{z.max}</strong><span>bpm</span></div>
          </div>
          <div className="pace-inputs">
            <label>
              <span>Fast</span>
              <input type="text" inputMode="numeric" placeholder="m:ss" value={profile.paces?.[z.zone]?.fast ?? ''}
                onChange={(e) => setPace(z.zone, 'fast', e.target.value)} />
            </label>
            <span className="muted">–</span>
            <label>
              <span>Slow</span>
              <input type="text" inputMode="numeric" placeholder="m:ss" value={profile.paces?.[z.zone]?.slow ?? ''}
                onChange={(e) => setPace(z.zone, 'slow', e.target.value)} />
            </label>
            <span className="muted small">/km</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Appearance({ theme, setTheme }) {
  return (
    <div className="card flat">
      <Segmented label="Theme" value={theme} onChange={setTheme}
        options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      <p className="small muted">System follows your phone's light or dark setting.</p>
    </div>
  )
}

function Preview() {
  const [, rerender] = useState(0)
  const setPreview = (value) => {
    try { value ? localStorage.setItem(PREVIEW_KEY, value) : localStorage.removeItem(PREVIEW_KEY) } catch {}
    rerender((n) => n + 1)
  }
  return (
    <div className="card flat">
      <label className="field">
        <span>Pretend today is…</span>
        <input type="date" value={previewDate() || ''} onChange={(e) => setPreview(e.target.value)} />
      </label>
      <button type="button" className="btn" onClick={() => setPreview('')}>Back to real date</button>
      <p className="small muted">See how Home looks on another day of the plan. Only changes what the app shows as "today".</p>
    </div>
  )
}

function DataTools() {
  const { plan, exportData, importData, importPlan, resetPlan, isCustomPlan } = useStore()
  const [message, setMessage] = useState(null)
  const logsInput = useRef(null)
  const planInput = useRef(null)

  // Shared wrapper: read the chosen file, run the action, show the result.
  const handleFile = (action) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again later
    if (!file) return
    try {
      const data = await readJSONFile(file)
      setMessage({ ok: true, text: action(data) })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message })
    }
  }

  return (
    <>
      <div className="card flat data-tools">
        <p className="small muted">
          Plan: <strong>{plan.meta.name}</strong> · {plan.weeks.length} weeks loaded{isCustomPlan ? ' (imported)' : ' (built-in)'}
        </p>

        <button type="button" className="btn" onClick={() => downloadJSON(`running-logs-${todayISO()}.json`, exportData())}>
          <Icon name="download" size={20} /> Export logs backup
        </button>
        <button type="button" className="btn" onClick={() => logsInput.current.click()}>
          <Icon name="upload" size={20} /> Import logs backup
        </button>
        <button type="button" className="btn" onClick={() => planInput.current.click()}>
          <Icon name="upload" size={20} /> Import new plan file
        </button>
        {isCustomPlan && (
          <button type="button" className="btn ghost" onClick={() => {
            if (confirm('Go back to the plan built into the app? Your logs are kept.')) { resetPlan(); setMessage({ ok: true, text: 'Using the built-in plan.' }) }
          }}>Use built-in plan</button>
        )}

        <input ref={logsInput} type="file" accept="application/json,.json" hidden
          onChange={handleFile((data) => `Imported ${importData(data)} log entries.`)} />
        <input ref={planInput} type="file" accept="application/json,.json" hidden
          onChange={handleFile((data) => { importPlan(data); return `Loaded "${data.plan.name}" (${data.weeks.length} weeks).` })} />

        {message && <p className={`message ${message.ok ? 'ok' : 'error'}`} role="status">{message.text}</p>}
      </div>
    </>
  )
}
