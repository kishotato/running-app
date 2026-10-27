// Turns the raw plan JSON into something easy for screens to use:
// every session gets a stable id ("2026-11-04-AM") that logs are keyed by,
// and days can be looked up by date.

export function sessionId(date, session, index) {
  return `${date}-${session.slot || index + 1}`
}

/** Builds lookup tables once per plan. */
export function indexPlan(plan) {
  const days = {} // date -> day (sessions have ids, plus a link to its week)
  const sessions = {} // id -> { ...session, id, date, day, week }

  const weeks = [...plan.weeks]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((rawWeek) => {
      const week = { ...rawWeek }
      week.days = [...rawWeek.days].sort((a, b) => a.date.localeCompare(b.date)).map((rawDay) => {
        const seen = new Set()
        const day = { ...rawDay, week }
        day.sessions = rawDay.sessions.map((s, i) => {
          let id = sessionId(rawDay.date, s, i)
          if (seen.has(id)) id = `${id}-${i + 1}` // two sessions in the same slot
          seen.add(id)
          const full = { ...s, id, date: rawDay.date }
          sessions[id] = { ...full, day, week }
          return full
        })
        days[day.date] = day
        return day
      })
      return week
    })

  return {
    raw: plan,
    meta: plan.plan,
    zones: plan.zones || [],
    strength: plan.strengthLibrary || {},
    weeks,
    days,
    sessions,
    firstDate: weeks[0]?.startDate,
    lastDate: weeks[weeks.length - 1]?.endDate,
  }
}

/** Index of the week containing `iso`; clamps to first/last week outside the plan. */
export function weekIndexFor(index, iso) {
  const { weeks } = index
  if (!weeks.length) return -1
  if (iso < weeks[0].startDate) return 0
  const i = weeks.findIndex((w) => iso >= w.startDate && iso <= w.endDate)
  return i === -1 ? weeks.length - 1 : i
}

export function runsOf(day) {
  return (day?.sessions || []).filter((s) => s.type === 'run')
}

/** Basic shape check before accepting an imported plan file. */
export function validatePlan(obj) {
  if (!obj || typeof obj !== 'object') return 'File is not a JSON object.'
  if (!obj.plan || typeof obj.plan !== 'object') return 'Missing "plan" section.'
  if (!Array.isArray(obj.weeks) || obj.weeks.length === 0) return 'Missing "weeks" list.'
  for (const w of obj.weeks) {
    if (!w.startDate || !w.endDate || !Array.isArray(w.days)) return `Week ${w.weekNumber ?? '?'} is missing dates or days.`
    for (const d of w.days) {
      if (!d.date || !Array.isArray(d.sessions)) return `A day in week ${w.weekNumber ?? '?'} is missing its date or sessions.`
    }
  }
  return null
}

/** Session label for lists, e.g. "Threshold · 10 km". */
export function sessionLabel(session, strengthLib) {
  if (session.type === 'strength') return strengthLib[session.strengthId]?.name || 'Strength'
  const km = session.distanceKm != null ? ` · ${session.distanceKm} km` : ''
  return `${session.title || 'Run'}${km}`
}
