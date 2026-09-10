import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Activity, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../common/LanguageSwitcher'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#dce5e1]/80 bg-[#f7faf8]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 text-xl font-extrabold tracking-tight text-[#123b45]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#123b45] text-[#b9e6d0] shadow-sm"><Activity className="h-5 w-5" /></span>
            <span>NABDA <span className="text-[#16856b]">Ai</span></span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-semibold text-[#58716f] transition-colors hover:text-[#16856b]">
              المميزات
            </a>
            <a href="#how-it-works" className="text-sm font-semibold text-[#58716f] transition-colors hover:text-[#16856b]">
              كيف يعمل
            </a>
            <a href="#sos" className="text-sm font-semibold text-[#58716f] transition-colors hover:text-[#16856b]">
              SOS طوارئ
            </a>
            <a href="#security" className="text-sm font-semibold text-[#58716f] transition-colors hover:text-[#16856b]">
              الأمان
            </a>
          </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#36545a] transition-colors hover:bg-[#e9f3ee] hover:text-[#16856b]"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block">{user?.full_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#c04d4b] transition-colors hover:bg-[#fff0ed]"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:block">تسجيل خروج</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[#58716f] transition-colors hover:bg-[#e9f3ee] hover:text-[#16856b] sm:block">
                تسجيل الدخول
              </Link>
              <Link to="/signup" className="flex items-center gap-2 rounded-xl bg-[#16856b] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#106650] sm:px-5">
                ابدأ الآن <ArrowLeft className="h-4 w-4" />
              </Link>
            </>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl p-2 text-[#123b45] transition-colors hover:bg-[#e9f3ee] md:hidden"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-[#dce5e1] bg-[#f7faf8] px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span className="text-sm font-bold text-[#36545a]">اللغة</span>
              <LanguageSwitcher />
            </div>
            <a href="#features" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#58716f] hover:bg-white" onClick={() => setIsOpen(false)}>المميزات</a>
            <a href="#how-it-works" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#58716f] hover:bg-white" onClick={() => setIsOpen(false)}>كيف يعمل</a>
            <a href="#sos" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#58716f] hover:bg-white" onClick={() => setIsOpen(false)}>SOS طوارئ</a>
            <a href="#security" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#58716f] hover:bg-white" onClick={() => setIsOpen(false)}>الأمان</a>
            <div className="my-3 h-px bg-[#dce5e1]" />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#36545a] hover:bg-white" onClick={() => setIsOpen(false)}>
                  لوحة التحكم
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="rounded-xl px-4 py-3 text-right text-sm font-semibold text-[#c04d4b] hover:bg-[#fff0ed]">
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-3 text-sm font-semibold text-[#58716f] hover:bg-white" onClick={() => setIsOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link to="/signup" className="mt-2 rounded-xl bg-[#16856b] px-4 py-3 text-center text-sm font-bold text-white" onClick={() => setIsOpen(false)}>
                  ابدأ الآن
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
