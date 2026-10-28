// Light / dark / follow-the-phone. The choice is saved in localStorage and
// applied as a data-theme attribute on <html>; styles.css does the rest.
// "system" means no attribute, so the phone's own setting decides.
import { useEffect, useState } from 'react'
import { KEYS, load, save } from './storage.js'

const CHROME = { dark: '#130f0e', light: '#fbf7f1' } // colour of the phone's status bar area

export function getTheme() {
  const t = load(KEYS.theme, 'system')
  return t === 'light' || t === 'dark' ? t : 'system'
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? CHROME.dark : CHROME.light)
}

export function useTheme() {
  const [theme, setThemeState] = useState(getTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return undefined
    // While following the phone, react if its setting changes.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next) => { save(KEYS.theme, next); setThemeState(next) }
  return [theme, setTheme]
}
