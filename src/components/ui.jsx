// Small reusable pieces of UI.
import { useRef, useState } from 'react'
import Icon from './Icon.jsx'

/** Two or more options side by side, one selected (e.g. Plan | Calendar). */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** AM = little yellow sun, PM = little crescent moon. */
export function SlotIcon({ slot }) {
  if (slot !== 'AM' && slot !== 'PM') return slot ? <span className="slot">{slot}</span> : null
  const am = slot === 'AM'
  return (
    <span className={`slot-icon ${am ? 'sun' : 'moon'}`} role="img" aria-label={slot}>
      <Icon name={am ? 'sun' : 'moon'} size={16} strokeWidth={am ? 2.2 : 1.5} />
    </span>
  )
}

/** Round tick button. Stops the tap from also opening the session. */
export function DoneButton({ done, onToggle, size = 'md' }) {
  return (
    <button type="button" className={`done-btn ${size}${done ? ' done' : ''}`}
      aria-pressed={done} aria-label={done ? 'Mark as not done' : 'Mark as done'}
      onClick={(e) => { e.stopPropagation(); onToggle() }}>
      <Icon name="check" size={size === 'lg' ? 28 : 20} strokeWidth={3} />
    </button>
  )
}

/**
 * Header with ‹ title › arrows, and a body you can swipe left/right.
 * Swipe left = next, swipe right = previous (like turning a page).
 */
export function Swipeable({ title, subtitle, onPrev, onNext, children }) {
  const start = useRef(null)
  const [dx, setDx] = useState(0)

  const onTouchStart = (e) => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY, horizontal: null }
  }
  const onTouchMove = (e) => {
    if (!start.current) return
    const t = e.touches[0]
    const mx = t.clientX - start.current.x, my = t.clientY - start.current.y
    // Decide once whether this gesture is a sideways swipe or a normal scroll.
    if (start.current.horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      start.current.horizontal = Math.abs(mx) > Math.abs(my)
    }
    if (start.current.horizontal) setDx(mx)
  }
  const onTouchEnd = () => {
    if (start.current?.horizontal) {
      if (dx < -60 && onNext) onNext()
      else if (dx > 60 && onPrev) onPrev()
    }
    start.current = null
    setDx(0)
  }

  return (
    <div className="swipeable">
      <div className="swipe-header">
        <button type="button" className="icon-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous">
          <Icon name="left" />
        </button>
        <div className="swipe-title">
          <h2>{title}</h2>
          {subtitle && <p className="muted small">{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn" onClick={onNext} disabled={!onNext} aria-label="Next">
          <Icon name="right" />
        </button>
      </div>
      <div className="swipe-body" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ transform: dx ? `translateX(${dx * 0.4}px)` : undefined, transition: dx ? 'none' : undefined }}>
        {children}
      </div>
    </div>
  )
}
