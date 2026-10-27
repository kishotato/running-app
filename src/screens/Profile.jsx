import { useRef, useState } from 'react'
import { useStore } from '../store.jsx'
import { todayISO } from '../lib/dates.js'
import { downloadJSON, readJSONFile } from '../lib/storage.js'
import { hrZones } from '../lib/zones.js'
import Icon from '../components/Icon.jsx'

export default function Profile() {
  const { plan, profile, updateProfile } = useStore()
  const lthr = Number(profile.lthr)
  const zones = lthr > 0 ? hrZones(plan.zones, lthr, Number(profile.maxHr) || null) : []

  const setPace = (zone, end, value) => {
    updateProfile({ paces: { ...profile.paces, [zone]: { ...profile.paces?.[zone], [end]: value || null } } })
  }

  return (
    <>
      <header className="page-head">
        <h1>Profile</h1>
      </header>

      <div className="card">
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

      <h3 className="section-title">Zones &amp; paces</h3>
      <div className="zone-list">
        {zones.map((z) => (
          <div key={z.zone} className="card zone-card" style={{ '--zc': `var(--z${z.zone})` }}>
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

      <DataTools />
    </>
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
      <h3 className="section-title">Data</h3>
      <div className="card data-tools">
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
