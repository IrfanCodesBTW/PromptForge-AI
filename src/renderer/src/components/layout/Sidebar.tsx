import { NavLink } from 'react-router-dom'
import { Settings, Clock, FileText } from 'lucide-react'
import { Logo } from '../ui/Logo'

const navItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/templates', label: 'Templates', icon: FileText }
]

export function Sidebar(): JSX.Element {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col select-none">
      <div className="p-lg flex items-center gap-sm border-b border-border/60 mb-sm">
        <Logo size={26} />
        <div>
          <h1 className="text-sm font-bold text-text-primary leading-none tracking-tight">
            PromptForge <span className="text-[#8B5CF6]">AI</span>
          </h1>
          <p className="text-[9px] text-text-muted mt-1 leading-tight font-medium">
            Forge Better Prompts. Get Better Results.
          </p>
        </div>
      </div>
      <div className="p-md">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-sans px-sm">
          Navigation
        </h2>
      </div>
      <nav className="flex-1 px-sm">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-sm px-md py-sm rounded-sm text-sm transition-all duration-[160ms] ease-standard mb-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                isActive
                  ? 'bg-mint-100 text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card-hover'
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
          <span className="text-xs text-text-secondary font-medium">Ready</span>
        </div>
      </div>
    </aside>
  )
}
