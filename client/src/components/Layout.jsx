import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../App'
import {
  LayoutDashboard, FileText, ArrowLeftRight, Users, Settings, LogOut, ChevronDown, Building2, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/invoices',     label: 'Invoices',     icon: FileText },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/clients',      label: 'Clients',      icon: Users },
  { to: '/settings',     label: 'Settings',     icon: Settings },
]

function SidebarContent({ currentBusiness, businesses, selectBusiness, onLogout, bizOpen, setBizOpen, appLogo }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#111827' }}>

      {/* Brand / Logo */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
        {appLogo ? (
          <img
            src={appLogo}
            alt="App Logo"
            style={{ maxHeight: 52, maxWidth: 160, objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dc2626' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: '#f9fafb' }}>AVTR</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>Invoice Generator</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Switcher */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
        <div className="relative">
          <button
            onClick={() => setBizOpen(!bizOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left"
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
                isActive ? 'text-white' : 'text-gray-400 hover:text-gray-100'
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
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
          style={{ color: '#9ca3af' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#7f1d1d'; e.currentTarget.style.color = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { businesses, currentBusiness, selectBusiness, logout, appLogo } = useApp()
  const [bizOpen, setBizOpen]       = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Auto-close sidebar on route change (mobile UX)
  useEffect(() => { setSidebarOpen(false); setBizOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarProps = { currentBusiness, businesses, selectBusiness, onLogout: handleLogout, bizOpen, setBizOpen, appLogo }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Desktop sidebar ── fixed, always visible on md+ */}
      <aside className="hidden md:flex fixed h-full w-60 z-10 flex-col" style={{ background: '#111827' }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Slide-in panel */}
          <div className="relative w-64 flex-shrink-0 z-10">
            <SidebarContent {...sidebarProps} />
          </div>
          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-20 rounded-full p-1"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30 shadow-md" style={{ background: '#111827' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {appLogo ? (
              <img src={appLogo} alt="" style={{ height: 30, maxWidth: 90, objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#dc2626' }}>
                <span className="text-white font-bold text-xs">A</span>
              </div>
            )}
            <span className="font-bold text-white text-sm truncate">{currentBusiness?.name || 'AVTR'}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
