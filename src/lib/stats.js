// Totals used by This Week and Progress.
// "Done km" uses the actual distance you logged; if you only ticked a run as done
// without entering a distance, the planned distance counts instead.

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
