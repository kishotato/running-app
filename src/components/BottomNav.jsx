import Icon from './Icon.jsx'

const ITEMS = [
  { id: 'profile', label: 'Profile' },
  { id: 'plan', label: 'Plan' },
  { id: 'progress', label: 'Progress' },
  { id: 'week', label: 'This Week' },
]

export default function BottomNav({ tab, onChange }) {
  const index = Math.max(0, ITEMS.findIndex((i) => i.id === tab))
  return (
    <nav className="bottom-nav" aria-label="Main" style={{ '--i': index }}>
      {/* The solid pill slides under the active item. */}
      <span className="nav-indicator" aria-hidden="true" />
      {ITEMS.map((item) => (
        <button key={item.id} type="button"
          className={`nav-item${tab === item.id ? ' active' : ''}`}
          aria-current={tab === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}>
          <Icon name={item.id} size={19} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
