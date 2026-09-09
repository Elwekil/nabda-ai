import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Hero() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="pt-32 pb-20 px-6 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-[#f7f9fc] to-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight" dir="rtl">
              صحّتك، مُنظمة وبذكاء.
            </h1>
            <h1 className="text-4xl md:text-6xl font-bold text-blue-600 leading-tight tracking-tight">
              Your Health, Organized and Intelligent.
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
            NABDA Ai is your AI-powered personal health assistant, bridging the gap between medical data and actionable wellness. Secure, private, and precise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95"
              >
                🚀 اذهب إلى لوحة التحكم
              </Link>
            ) : (
              <>
                <Link 
                  to="/signup" 
                  className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95"
                >
                  📱 إنشاء حساب مجاني
                </Link>
                <Link 
                  to="/login" 
                  className="bg-white border-2 border-gray-200 text-blue-600 px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                >
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-6 pt-8">
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 font-bold">د.س</div>
              <div className="w-12 h-12 rounded-full border-4 border-white bg-green-100 flex items-center justify-center text-green-600 font-bold">د.م</div>
              <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">+10k</div>
            </div>
            <p className="text-sm text-gray-600 font-medium">موثوق من قبل كبار المتخصصين في الرعاية الصحية حول العالم</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -z-10"></div>
          <div className="relative bg-white rounded-2xl p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white">❤️</span>
              </div>
              <p className="text-blue-800 font-semibold">تحليل صحي فوري</p>
              <p className="text-sm text-gray-500 mt-2">AI-powered insights</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}