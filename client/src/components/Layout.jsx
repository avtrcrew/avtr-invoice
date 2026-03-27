import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import {
  LayoutDashboard, FileText, ArrowLeftRight, Users, Settings, LogOut, ChevronDown, Building2
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
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
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">AVTR</p>
              <p className="text-gray-400 text-xs">Invoice Generator</p>
            </div>
          </div>
        </div>

        {/* Business Switcher */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <button
              onClick={() => setBizOpen(!bizOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Current Business</p>
                <p className="text-sm font-medium text-gray-800 truncate">{currentBusiness?.name || '—'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
            {bizOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                {businesses.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => { selectBusiness(biz); setBizOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex items-center gap-2 ${currentBusiness?.id === biz.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}`}
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
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
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
