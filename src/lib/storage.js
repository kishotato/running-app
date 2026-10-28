// Thin wrapper around localStorage. Every read/write is wrapped in try/catch
// because storage can be unavailable (private mode, storage full).

export const KEYS = {
  logs: 'runapp.logs.v1', // { [sessionId]: log }
  profile: 'runapp.profile.v1', // { lthr, maxHr, paces }
  plan: 'runapp.plan.v1', // an imported plan that replaces the bundled one
  theme: 'runapp.theme.v1', // 'system' | 'light' | 'dark'
}

export function load(key, fallback) {
  try {
    const text = localStorage.getItem(key)
    return text ? JSON.parse(text) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Triggers a file download of `data` as pretty JSON. */
export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Reads a File chosen in an <input type="file"> and parses it as JSON. */
export function readJSONFile(file) {
  return file.text().then((text) => JSON.parse(text))
}
