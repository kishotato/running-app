// Helpers for "m:ss" paces and "h:mm:ss" / "mm:ss" durations.

/** "1:02:30" or "45:10" or "45" -> seconds. Returns null if it can't be read. */
export function parseDuration(text) {
  if (text == null || String(text).trim() === '') return null
  const parts = String(text).trim().split(':').map(Number)
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return null
  if (parts.length === 1) return parts[0] * 60 // plain number = minutes
  return parts.reduce((total, n) => total * 60 + n, 0)
}

export function formatDuration(totalSec) {
  if (totalSec == null) return ''
  const s = Math.round(totalSec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Seconds per km -> "m:ss". */
export function formatPace(secPerKm) {
  if (!secPerKm || !Number.isFinite(secPerKm)) return null
  const s = Math.round(secPerKm)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function paceFrom(distanceKm, durationText) {
  const sec = parseDuration(durationText)
  if (!sec || !distanceKm) return null
  return formatPace(sec / distanceKm)
}

/** {fast, slow} -> "5:30–6:10 /km" (either end may be missing). */
export function paceRange(pace) {
  if (!pace) return null
  const { fast, slow } = pace
  if (fast && slow) return `${fast}–${slow} /km`
  if (fast) return `faster than ${fast} /km`
  if (slow) return `slower than ${slow} /km`
  return null
}
