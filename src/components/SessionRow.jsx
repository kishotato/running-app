import { useStore } from '../store.jsx'
import { sessionLabel } from '../lib/plan.js'
import { paceRange } from '../lib/pace.js'
import { zoneColor, zoneLabel } from '../lib/zones.js'
import { DoneButton, SlotIcon } from './ui.jsx'
import Icon from './Icon.jsx'

/** One run or strength session as a tappable row with a done tick. */
export default function SessionRow({ session, onOpen }) {
  const { plan, logs, toggleDone } = useStore()
  const done = !!logs[session.id]?.completed
  const isRun = session.type === 'run'
  const detail = isRun
    ? [zoneLabel(session.zones), session.main?.intervals?.label, paceRange(session.main?.pace)].filter(Boolean).join(' · ')
    : `${plan.strength[session.strengthId]?.durationMin ?? ''} min`.trim()

  return (
    <div className={`session-row${done ? ' is-done' : ''}`} role="button" tabIndex={0}
      onClick={() => onOpen(session.id)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(session.id) }}
      style={{ '--accent-bar': isRun ? zoneColor(session.zones) : 'var(--strength)' }}>
      <div className="session-main">
        <div className="session-title">
          <Icon name={isRun ? 'run' : 'dumbbell'} size={16} />
          <span>{sessionLabel(session, plan.strength)}</span>
          <SlotIcon slot={session.slot} />
        </div>
        {detail && <div className="session-detail">{detail}</div>}
      </div>
      <DoneButton done={done} onToggle={() => toggleDone(session.id)} />
    </div>
  )
}
