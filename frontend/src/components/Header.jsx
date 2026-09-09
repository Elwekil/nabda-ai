import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Menu, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react'
import NotificationPanel from './common/NotificationPanel'
import LanguageSwitcher from './common/LanguageSwitcher'
import { useTheme } from '../context/ThemeContext'

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }} className="shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ color: 'var(--text-muted)' }}
          className="p-2 rounded-lg hover:opacity-70 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            style={{ border: '1px solid var(--border)' }}
            className="p-2 rounded-xl hover:opacity-70 transition-opacity"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark
              ? <Sun className="w-4 h-4 text-yellow-400" />
              : <Moon className="w-4 h-4 text-gray-500" />
            }
          </button>

          <NotificationPanel />

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:opacity-70"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden md:block text-right">
                <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{user?.full_name || ''}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{user?.email || ''}</p>
              </div>
              <ChevronDown style={{ color: 'var(--text-faint)' }} className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg z-50"
                >
                  <button
                    onClick={() => { logout(); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-right text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
