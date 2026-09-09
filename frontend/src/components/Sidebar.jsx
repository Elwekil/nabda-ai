import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Pill, Calendar, FileText, User, Heart, Menu, X, ClipboardList, CreditCard, Bot } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
  { path: '/dashboard',     icon: LayoutDashboard, key: 'nav.dashboard' },
  { path: '/medications',   icon: Pill,            key: 'nav.medications' },
  { path: '/appointments',  icon: Calendar,        key: 'nav.appointments' },
  { path: '/documents',     icon: FileText,        key: 'nav.documents' },
  { path: '/health-report', icon: ClipboardList,   key: 'nav.health_report' },
  { path: '/ai-chatbot',    icon: Bot,             key: 'nav.ai_chatbot' },
  { path: '/pricing',       icon: CreditCard,      key: 'nav.pricing' },
  { path: '/profile',       icon: User,            key: 'nav.profile' },
]

export default function Sidebar({ open, setOpen }) {
  const { t } = useLanguage()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
        className={`fixed top-0 right-0 h-full shadow-xl z-30 transition-all duration-300 ${open ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div style={{ borderBottom: '1px solid var(--border)' }} className="flex items-center justify-between p-4">
            <div className={`flex items-center gap-2 ${!open && 'lg:hidden'}`}>
              <Heart className="w-8 h-8 text-primary-600" />
              {open && <span style={{ color: 'var(--text-primary)' }} className="font-bold text-xl">NABDA Ai</span>}
            </div>
            <button onClick={() => setOpen(!open)} style={{ color: 'var(--text-muted)' }} className="p-1 rounded-lg hover:opacity-70">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex-1 py-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                >
                  {({ isActive }) => (
                    <div
                      style={{ color: isActive ? undefined : 'var(--text-muted)' }}
                      className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors cursor-pointer ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'hover:opacity-80'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {open && <span>{t(item.key)}</span>}
                    </div>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
