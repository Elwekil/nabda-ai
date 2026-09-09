import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CTASection() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          ابدأ رحلتك نحو صحة متزامنة
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            انضم إلى أكثر من 10,000 مستخدم نشط استعادوا السيطرة على تاريخهم الطبي مع NABDA Ai
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="bg-blue-600 text-white px-10 py-5 rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              🚀 اذهب إلى لوحة التحكم
            </Link>
          ) : (
            <>
              <Link 
                to="/signup" 
                className="bg-blue-600 text-white px-10 py-5 rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                📱 إنشاء حساب مجاني
              </Link>
              <Link 
                to="/login" 
                className="bg-gray-900 text-white px-10 py-5 rounded-full text-xl font-bold flex items-center justify-center gap-3 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                ▶️ تسجيل الدخول
              </Link>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500">متاح عالمياً. آمن دائماً.</p>
      </div>
    </section>
  )
}