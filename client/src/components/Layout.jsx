import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import {
  LayoutDashboard, FileText, ArrowLeftRight, Users, Settings, LogOut, ChevronDown, Building2
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/invoices',     label: 'Invoices',     icon: FileText },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/clients',      label: 'Clients',      icon: Users },
  { to: '/settings',     label: 'Settings',     icon: Settings },
]

export default function Layout() {
  const { businesses, currentBusiness, selectBusiness, logout } = useApp()
  const [bizOpen, setBizOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex flex-col fixed h-full z-10" style={{ background: '#111827' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #1f2937' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dc2626' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: '#f9fafb' }}>AVTR</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Invoice Generator</p>
            </div>
          </div>
        </div>

        {/* Business Switcher */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
          <div className="relative">
            <button
              onClick={() => setBizOpen(!bizOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left"
              style={{ hover: undefined }}
              onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#7f1d1d' }}>
                <Building2 className="w-4 h-4" style={{ color: '#fca5a5' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: '#6b7280' }}>Current Business</p>
                <p className="text-sm font-medium truncate" style={{ color: '#f3f4f6' }}>{currentBusiness?.name || '—'}</p>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7280' }} />
            </button>

            {bizOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl z-20 overflow-hidden" style={{ background: '#1f2937', border: '1px solid #374151' }}>
                {businesses.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => { selectBusiness(biz); setBizOpen(false) }}
                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition"
                    style={{ color: currentBusiness?.id === biz.id ? '#fca5a5' : '#d1d5db', background: currentBusiness?.id === biz.id ? '#7f1d1d' : 'transparent' }}
                    onMouseEnter={e => { if (currentBusiness?.id !== biz.id) e.currentTarget.style.background = '#374151' }}
                    onMouseLeave={e => { if (currentBusiness?.id !== biz.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Building2 className="w-4 h-4" />
                    {biz.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-100'
                }`
              }
              style={({ isActive }) => isActive ? { background: '#dc2626' } : {}}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #1f2937' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
            style={{ color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7f1d1d'; e.currentTarget.style.color = '#fca5a5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
