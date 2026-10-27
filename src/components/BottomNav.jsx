import Icon from './Icon.jsx'

const ITEMS = [
  { id: 'week', label: 'This Week' },
  { id: 'plan', label: 'Plan' },
  { id: 'progress', label: 'Progress' },
  { id: 'profile', label: 'Profile' },
]

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <button key={item.id} type="button"
          className={`nav-item${tab === item.id ? ' active' : ''}`}
          aria-current={tab === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}>
          <Icon name={item.id} size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
