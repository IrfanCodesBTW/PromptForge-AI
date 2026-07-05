import { NavLink } from 'react-router-dom'
import { Settings, Clock, FileText } from 'lucide-react'

const navItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/templates', label: 'Templates', icon: FileText }
]

export function Sidebar(): JSX.Element {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="p-lg">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Navigation
        </h2>
      </div>
      <nav className="flex-1 px-sm">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-sm px-md py-sm rounded-md text-sm transition-colors duration-150 mb-xs ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-lg border-t border-border">
        <div className="flex items-center gap-sm">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted">Ready</span>
        </div>
      </div>
    </aside>
  )
}
