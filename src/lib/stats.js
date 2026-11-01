// Totals used by This Week and Progress.
// "Done km" uses the actual distance you logged; if you only ticked a run as done
// without entering a distance, the planned distance counts instead.

import { addDays } from './dates.js'
import { parseDuration } from './pace.js'

export function loggedKm(session, log) {
  if (!log?.completed || session.type !== 'run') return 0
  const actual = Number(log.distanceKm)
  return Number.isFinite(actual) && log.distanceKm !== '' && log.distanceKm != null ? actual : session.distanceKm || 0
}

export function weekStats(week, logs) {
  let plannedKm = 0, doneKm = 0, sessions = 0, done = 0
  for (const day of week.days) {
    day.sessions.forEach((s) => {
      const log = logs[s.id]
      sessions++
      if (log?.completed) done++
      if (s.type === 'run') plannedKm += s.distanceKm || 0
      doneKm += loggedKm(s, log)
    })
  }
  return { plannedKm: week.totalKm ?? round1(plannedKm), doneKm: round1(doneKm), sessions, done }
}

export function round1(n) {
  return Math.round(n * 10) / 10
}

/**
 * Totals for every plan day from start to end (inclusive ISO dates).
 * km and time come from your logs; time only counts runs where you entered a duration.
 */
export function periodStats(plan, logs, start, end) {
  let km = 0, sec = 0, sessions = 0, done = 0, runsDone = 0, plannedKm = 0
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const day = plan.days[d]
    if (!day) continue
    for (const s of day.sessions) {
      const log = logs[s.id]
      const isRun = s.type === 'run'
      sessions++
      if (isRun) plannedKm += s.distanceKm || 0
      km += loggedKm(s, log)
      if (!log?.completed) continue
      done++
      if (isRun) { runsDone++; sec += parseDuration(log.duration) || 0 }
    }
  }
  return { km, sec, sessions, done, runsDone, plannedKm }
}
