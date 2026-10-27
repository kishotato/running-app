// The app's shared state. Any screen can call useStore() to read the plan,
// logs and profile, or to change them. Changes are saved to localStorage.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import bundledPlan from '../lakeland-plan-weeks-1-5.json'
import { indexPlan, validatePlan } from './lib/plan.js'
import { KEYS, load, save } from './lib/storage.js'

const StoreContext = createContext(null)

function defaultProfile(plan) {
  const paces = {}
  for (const z of plan.zones || []) paces[z.zone] = { ...z.pace }
  return { lthr: plan.plan.lthr ?? null, maxHr: plan.plan.maxHr ?? null, paces }
}

export function StoreProvider({ children }) {
  const [rawPlan, setRawPlan] = useState(() => load(KEYS.plan, null) || bundledPlan)
  const [logs, setLogs] = useState(() => load(KEYS.logs, {}))
  const [profile, setProfile] = useState(() => ({ ...defaultProfile(rawPlan), ...load(KEYS.profile, {}) }))

  useEffect(() => { save(KEYS.logs, logs) }, [logs])
  useEffect(() => { save(KEYS.profile, profile) }, [profile])

  const plan = useMemo(() => indexPlan(rawPlan), [rawPlan])

  const value = useMemo(() => ({
    plan,
    logs,
    profile,
    isCustomPlan: rawPlan !== bundledPlan,

    saveLog(id, log) {
      setLogs((prev) => ({ ...prev, [id]: { ...prev[id], ...log, updatedAt: new Date().toISOString() } }))
    },
    toggleDone(id) {
      setLogs((prev) => ({ ...prev, [id]: { ...prev[id], completed: !prev[id]?.completed, updatedAt: new Date().toISOString() } }))
    },
    updateProfile(changes) {
      setProfile((prev) => ({ ...prev, ...changes }))
    },

    exportData() {
      return { app: 'running-app', type: 'logs-backup', version: 1, exportedAt: new Date().toISOString(), logs, profile }
    },
    /** Merges a backup into the current logs (backup wins on clashes). */
    importData(obj) {
      const incoming = obj?.type === 'logs-backup' ? obj.logs : obj
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('This file is not a logs backup.')
      setLogs((prev) => ({ ...prev, ...incoming }))
      if (obj?.profile) setProfile((prev) => ({ ...prev, ...obj.profile }))
      return Object.keys(incoming).length
    },

    importPlan(obj) {
      const problem = validatePlan(obj)
      if (problem) throw new Error(problem)
      if (!save(KEYS.plan, obj)) throw new Error('Could not save the plan on this device (storage full?).')
      setRawPlan(obj)
    },
    resetPlan() {
      save(KEYS.plan, null)
      setRawPlan(bundledPlan)
    },
  }), [plan, logs, profile, rawPlan])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
