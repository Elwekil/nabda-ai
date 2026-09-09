import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Activity } from 'lucide-react'
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
    <nav className="fixed top-0 w-full z-50 bg-[#f6f8f4]/90 backdrop-blur-xl border-b border-[#dce6df]">
      <div className="flex justify-between items-center w-full px-5 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#153b3b]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d7f0df] text-[#19705e]"><Activity className="h-5 w-5" /></span>
            NABDA <span className="text-[#19705e]">Ai</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <a href="#features" className="text-[#52706a] font-medium hover:text-[#19705e] transition-colors">
              المميزات
            </a>
            <a href="#how-it-works" className="text-[#52706a] font-medium hover:text-[#19705e] transition-colors">
              كيف يعمل
            </a>
            <a href="#sos" className="text-[#52706a] font-medium hover:text-[#19705e] transition-colors">
              SOS طوارئ
            </a>
            <a href="#security" className="text-[#52706a] font-medium hover:text-[#19705e] transition-colors">
              الأمان
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block">{user?.full_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:block">تسجيل خروج</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-[#52706a] font-medium hover:text-[#19705e] transition-colors">
                تسجيل الدخول
              </Link>
              <Link to="/signup" className="bg-[#19705e] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#145548] transition-colors">
                ابدأ الآن
              </Link>
            </>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6">
          <div className="flex flex-col gap-3">
            <a href="#features" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>المميزات</a>
            <a href="#how-it-works" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>كيف يعمل</a>
            <a href="#sos" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>SOS طوارئ</a>
            <a href="#security" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>الأمان</a>
            <hr className="my-2" />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>
                  لوحة التحكم
                </Link>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="text-red-600 py-2 text-right">
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 py-2" onClick={() => setIsOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-full text-center" onClick={() => setIsOpen(false)}>
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
