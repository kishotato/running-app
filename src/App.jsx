import { useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import ThisWeek from './screens/ThisWeek.jsx'
import Plan from './screens/Plan.jsx'
import Progress from './screens/Progress.jsx'
import Profile from './screens/Profile.jsx'
import SessionDetail from './screens/SessionDetail.jsx'

const TABS = ['week', 'plan', 'progress', 'profile']

// Reads "#/plan/s/2026-11-04-AM" into { tab: 'plan', sessionId: '2026-11-04-AM' }.
function parseHash() {
  const [, tab, s, id] = window.location.hash.split('/')
  return {
    tab: TABS.includes(tab) ? tab : 'week',
    sessionId: s === 's' && id ? decodeURIComponent(id) : null,
  }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const openedHere = useRef(false) // did we push the detail page ourselves?

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const goTab = (tab) => { window.location.hash = `/${tab}` }

  const openSession = (id) => {
    openedHere.current = true
    window.location.hash = `/${route.tab}/s/${encodeURIComponent(id)}`
  }

  const closeSession = () => {
    // Going "back" means the phone's back button and our close button behave the same.
    if (openedHere.current) { openedHere.current = false; window.history.back() }
    else window.location.replace(`#/${route.tab}`)
  }

  const screens = { week: ThisWeek, plan: Plan, progress: Progress, profile: Profile }
  const Screen = screens[route.tab]

  return (
    <div className="app">
      <main className="screen" aria-hidden={route.sessionId ? true : undefined}>
        <Screen onOpenSession={openSession} />
      </main>
      {route.sessionId && <SessionDetail id={route.sessionId} onClose={closeSession} />}
      {!route.sessionId && <BottomNav tab={route.tab} onChange={goTab} />}
    </div>
  )
}
