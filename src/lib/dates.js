// All dates in the app are "YYYY-MM-DD" strings in local time, the same format
// the plan file uses. That avoids timezone surprises from Date objects.

export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Profile > Preview can pretend it is another day, to see how the app looks mid-plan.
export const PREVIEW_KEY = 'runapp.previewDate.v1'
export function previewDate() {
  try { return localStorage.getItem(PREVIEW_KEY) || null } catch { return null }
}

export function todayISO() {
  return previewDate() || toISO(new Date())
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseISO(toIso) - parseISO(fromIso)) / 86400000)
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso) {
  const d = parseISO(iso)
  const offset = (d.getDay() + 6) % 7 // Monday = 0
  return addDays(iso, -offset)
}

/** "YYYY-MM" key for the month containing `iso`. */
export function monthKey(iso) {
  return iso.slice(0, 7)
}

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return toISO(d).slice(0, 7)
}

export function formatDay(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseISO(iso).toLocaleDateString('en-GB', opts)
}

export function formatMonth(key) {
  return parseISO(`${key}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatRange(startIso, endIso) {
  const a = parseISO(startIso), b = parseISO(endIso)
  const sameMonth = a.getMonth() === b.getMonth()
  const left = a.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })
  const right = b.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${left} – ${right}`
}
