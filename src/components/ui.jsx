// Small reusable pieces of UI.
import { useRef } from 'react'
import { flushSync } from 'react-dom'
import Icon from './Icon.jsx'

/** Two or more options side by side, one selected (e.g. Plan | Calendar). Styled like the nav bar. */
export function Segmented({ options, value, onChange, label }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="segmented" role="tablist" aria-label={label} style={{ '--n': options.length, '--i': index }}>
      {/* The solid pill slides under the selected option. */}
      <span className="seg-indicator" aria-hidden="true" />
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

const SLIDE_MS = 280
const PAGE_GAP = 32 // space between pages while swiping (two side gutters)
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Header with ‹ title › arrows, and a body you can swipe left/right.
 * Swipe left = next, swipe right = previous (like turning a page).
 * The previous and next pages (`prev`, `next`) sit either side of the current one, so you see
 * them come in as you drag. Movement is written straight to the element's style (no React
 * re-render per frame) so it stays smooth.
 */
export function Swipeable({ title, subtitle, onPrev, onNext, prev, next, children }) {
  const track = useRef(null)
  const drag = useRef(null)
  const busy = useRef(false)

  const place = (x, ms = 0) => {
    const el = track.current
    if (!el) return
    el.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none'
    el.style.transform = x ? `translate3d(${x}px, 0, 0)` : ''
  }

  // dir: 1 = next, -1 = previous.
  const go = (dir) => {
    const fn = dir > 0 ? onNext : onPrev
    if (busy.current) return
    if (!fn) { place(0, SLIDE_MS); return }
    if (reduceMotion()) { fn(); place(0); return }
    busy.current = true
    place(-dir * (track.current.offsetWidth + PAGE_GAP), SLIDE_MS) // bring the neighbour fully into view
    setTimeout(() => {
      // The neighbour becomes the current page; reset the track in the same frame so nothing jumps.
      flushSync(fn)
      place(0)
      busy.current = false
    }, SLIDE_MS)
  }

  const onTouchStart = (e) => {
    if (busy.current) return
    const t = e.touches[0]
    drag.current = { x: t.clientX, y: t.clientY, t: performance.now(), dx: 0, horizontal: null }
  }
  const onTouchMove = (e) => {
    const d = drag.current
    if (!d) return
    const t = e.touches[0]
    const mx = t.clientX - d.x, my = t.clientY - d.y
    // Decide once whether this gesture is a sideways swipe or a normal scroll.
    if (d.horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) d.horizontal = Math.abs(mx) > Math.abs(my)
    if (!d.horizontal) return
    // Resist when there is nothing more in that direction.
    d.dx = (mx > 0 && !onPrev) || (mx < 0 && !onNext) ? mx * 0.25 : mx
    place(d.dx)
  }
  const onTouchEnd = () => {
    const d = drag.current
    drag.current = null
    if (!d?.horizontal) return
    const speed = d.dx / (performance.now() - d.t) // px per ms; a quick flick counts too
    const w = track.current.offsetWidth
    if (d.dx < -w / 3 || (d.dx < -25 && speed < -0.4)) go(1)
    else if (d.dx > w / 3 || (d.dx > 25 && speed > 0.4)) go(-1)
    else place(0, SLIDE_MS)
  }

  return (
    <div className="swipeable">
      <div className="swipe-header">
        <button type="button" className="icon-btn" onClick={() => go(-1)} disabled={!onPrev} aria-label="Previous">
          <Icon name="left" />
        </button>
        <div className="swipe-title">
          <h2>{title}</h2>
          {subtitle && <p className="muted small">{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn" onClick={() => go(1)} disabled={!onNext} aria-label="Next">
          <Icon name="right" />
        </button>
      </div>
      <div className="swipe-viewport">
        <div ref={track} className="swipe-track" onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
          {prev && onPrev && <div className="swipe-page side prev" aria-hidden="true">{prev}</div>}
          <div className="swipe-page">{children}</div>
          {next && onNext && <div className="swipe-page side next" aria-hidden="true">{next}</div>}
        </div>
      </div>
    </div>
  )
}
