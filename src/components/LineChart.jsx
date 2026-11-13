import { useEffect, useId, useRef, useState } from 'react'
import { parseISO } from '../lib/dates.js'

/** Rounds the top of the y-axis up to a tidy number (10, 20… 50, 100, 150…). */
function niceMax(v) {
  if (!(v > 0)) return 10
  const step = v <= 30 ? 5 : v <= 100 ? 10 : v <= 300 ? 50 : v <= 1000 ? 100 : 500
  return Math.ceil(v / step) * step
}

const monthOf = (iso) => iso.slice(0, 7)

/**
 * Smooth curve through the points (monotone cubic): rounded like Nuxt Charts,
 * but it never bulges above a peak or dips below zero between two points.
 */
function smoothPath(pts) {
  const n = pts.length
  if (n < 2) return n ? `M${pts[0][0]} ${pts[0][1]}` : ''
  const dx = [], m = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0]
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0
      : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
  }
  t[n - 1] = m[n - 2]
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3
    d += ` C${x0 + h} ${y0 + t[i] * h} ${x1 - h} ${y1 - t[i + 1] * h} ${x1} ${y1}`
  }
  return d
}

/**
 * Line + soft area, one point per week (points: [{ date, value, compare? }]).
 * `compare` draws a dashed second line (e.g. planned). Tap, drag or hover to pick a point;
 * the picked point gets a vertical guide. Y labels sit on the right, months along the bottom.
 */
export default function LineChart({ points, active, onSelect, label, height = 200 }) {
  const box = useRef(null)
  const [W, setW] = useState(320)
  const gradId = useId()

  // Draw at the real pixel width so text and lines stay crisp at any screen size.
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const PAD = { top: 44, right: 52, bottom: 28, left: 10 }
  const n = points.length
  const innerW = W - PAD.left - PAD.right
  const max = niceMax(Math.max(...points.flatMap((p) => [p.value, p.compare ?? 0])))
  const x = (i) => PAD.left + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const y = (v) => PAD.top + (height - PAD.top - PAD.bottom) * (1 - v / max)
  const base = y(0)

  const path = (key) => smoothPath(points.map((p, i) => [x(i), y(p[key])]))
  const line = path('value')
  const area = `${line} L${x(n - 1)} ${base} L${x(0)} ${base} Z`
  const hasCompare = points.some((p) => p.compare != null)
  const cLine = hasCompare ? path('compare') : ''
  const cArea = hasCompare ? `${cLine} L${x(n - 1)} ${base} L${x(0)} ${base} Z` : ''
  const gradPlan = gradId + 'p'

  // A month label wherever a new month starts, skipped if it would crowd the previous one.
  const months = []
  points.forEach((p, i) => {
    if (i && monthOf(p.date) === monthOf(points[i - 1].date)) return
    if (months.length && x(i) - months[months.length - 1].x < 40) return
    months.push({ x: x(i), text: parseISO(p.date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() })
  })

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = n === 1 ? 0 : Math.round(((px - PAD.left) / innerW) * (n - 1))
    onSelect(Math.max(0, Math.min(n - 1, i)))
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') onSelect(Math.max(0, active - 1))
    if (e.key === 'ArrowRight') onSelect(Math.min(n - 1, active + 1))
  }

  const sel = points[active]
  // Rounded value bubble above the picked point, kept inside the chart.
  const tip = sel && !hasCompare && (() => {
    const text = `${sel.value} km`
    const w = text.length * 7 + 18
    const cx = Math.min(Math.max(x(active), PAD.left + w / 2), W - PAD.right - w / 2)
    const top = Math.max(2, y(sel.value) - 40)
    return { text, w, cx, top }
  })()

  // Two-value popup (done vs planned), beside the picked point, kept inside the chart.
  const pop = sel && hasCompare && (() => {
    const w = 140, h = 66
    const px = x(active)
    const left = px + 16 + w <= W - PAD.right + 6 ? px + 16 : px - 16 - w
    return { w, h, left: Math.max(2, left), top: PAD.top - 6, title: sel.week ? `Week ${sel.week}` : sel.date }
  })()

  return (
    <div ref={box} className="line-chart">
      <svg width={W} height={height} role="img" aria-label={label} tabIndex={0}
        onPointerDown={pick} onPointerMove={pick} onKeyDown={onKey}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--chart)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gradPlan} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--plan)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--plan)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right + 6} y1={y(t)} y2={y(t)} className="grid" />
            <text x={W - PAD.right + 12} y={y(t) + 4} className="axis">{round(t)} km</text>
          </g>
        ))}
        {months.map((m) => <text key={m.x} x={m.x} y={height - 6} textAnchor="middle" className="axis">{m.text}</text>)}

        {points.map((p, i) => <line key={p.date} x1={x(i)} x2={x(i)} y1={PAD.top - 8} y2={base} className="weekline" />)}

        {sel && <line x1={x(active)} x2={x(active)} y1={y(sel.value)} y2={base} className="guide" />}

        {hasCompare && <path d={cArea} fill={`url(#${gradPlan})`} />}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} className="value-line" />
        {hasCompare && <path d={cLine} className="compare-line" />}

        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={x(i)} cy={y(p.value)} r={4} className="dot" />
            {hasCompare && <circle cx={x(i)} cy={y(p.compare)} r={4} className="dot plan" />}
          </g>
        ))}

        {sel && (
          <>
            <circle cx={x(active)} cy={y(sel.value)} r={12} className="dot-halo" />
            {hasCompare && (
              <>
                <circle cx={x(active)} cy={y(sel.compare)} r={12} className="dot-halo plan" />
                <circle cx={x(active)} cy={y(sel.compare)} r={6} className="dot-active plan" />
              </>
            )}
            <circle cx={x(active)} cy={y(sel.value)} r={6} className="dot-active" />
            {tip && (
              <g className="tip">
                <rect x={tip.cx - tip.w / 2} y={tip.top} width={tip.w} height={26} rx={13} />
                <text x={tip.cx} y={tip.top + 17} textAnchor="middle">{tip.text}</text>
              </g>
            )}
            {pop && (
              <g className="pop">
                <rect x={pop.left} y={pop.top} width={pop.w} height={pop.h} rx={10} />
                <text x={pop.left + 12} y={pop.top + 19} className="head">{pop.title}</text>
                <circle cx={pop.left + 16} cy={pop.top + 36} r={4} fill="var(--chart)" />
                <text x={pop.left + 26} y={pop.top + 40} className="mute">Done</text>
                <text x={pop.left + pop.w - 12} y={pop.top + 40} textAnchor="end" className="val">{sel.value} km</text>
                <circle cx={pop.left + 16} cy={pop.top + 54} r={4} fill="var(--plan)" />
                <text x={pop.left + 26} y={pop.top + 58} className="mute">Planned</text>
                <text x={pop.left + pop.w - 12} y={pop.top + 58} textAnchor="end" className="val">{sel.compare} km</text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  )
}

function round(v) {
  return Math.round(v * 10) / 10
}
