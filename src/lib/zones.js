// Heart-rate zones worked out from LTHR, using the %LTHR bands in the plan.
// Each zone starts 1 bpm above the previous zone's top so there are no gaps,
// and the last zone is capped at max HR.

export function hrZones(planZones, lthr, maxHr) {
  let prevMax = null
  return planZones.map((z, i) => {
    const min = prevMax != null ? prevMax + 1 : Math.round((lthr * z.lthrPct.min) / 100)
    let max = Math.round((lthr * z.lthrPct.max) / 100)
    if (i === planZones.length - 1 && maxHr) max = maxHr
    prevMax = max
    return { zone: z.zone, name: z.name, pct: z.lthrPct, min, max }
  })
}

/** "Z2" or "Z1–2" for a list of zone numbers. */
export function zoneLabel(zones) {
  if (!zones?.length) return null
  const sorted = [...zones].sort((a, b) => a - b)
  return sorted.length === 1 ? `Z${sorted[0]}` : `Z${sorted[0]}–${sorted[sorted.length - 1]}`
}

/** Colour token for the hardest zone in a list. */
export function zoneColor(zones) {
  const top = zones?.length ? Math.max(...zones) : 0
  return top ? `var(--z${top})` : 'var(--muted)'
}
