import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full rounded-t-[3rem] mt-20 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-8 py-16 max-w-7xl mx-auto gap-12">
        <div className="space-y-6 max-w-xs">
          <Link to="/" className="text-lg font-bold text-gray-900">NABDA Ai</Link>
          <p className="text-gray-500 text-sm leading-relaxed">
            نسد الفجوة بين البيانات الطبية والرعاية الإنسانية من خلال تقنية ذكية وآمنة.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all">
              🌐
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all">
              💬
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-900">المنتج</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-500 hover:text-blue-600 transition-all text-sm">المميزات</a></li>
              <li><a href="#how-it-works" className="text-gray-500 hover:text-blue-600 transition-all text-sm">كيف يعمل</a></li>
              <li><a href="#security" className="text-gray-500 hover:text-blue-600 transition-all text-sm">الأمان</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-900">قانوني</h4>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-gray-500 hover:text-blue-600 transition-all text-sm">سياسة الخصوصية</a></li>
              <li><a href="/terms" className="text-gray-500 hover:text-blue-600 transition-all text-sm">شروط الاستخدام</a></li>
              <li><a href="/disclaimer" className="text-gray-500 hover:text-blue-600 transition-all text-sm">إخلاء المسؤولية الطبية</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-900">الدعم</h4>
            <ul className="space-y-2">
              <li><a href="/support" className="text-gray-500 hover:text-blue-600 transition-all text-sm">اتصل بالدعم</a></li>
              <li><a href="/help" className="text-gray-500 hover:text-blue-600 transition-all text-sm">مركز المساعدة</a></li>
              <li><Link to="/signup" className="text-gray-500 hover:text-blue-600 transition-all text-sm">إنشاء حساب</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-xs">© 2024 NABDA Ai. Clinical Serenity Systems.</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-gray-500 font-medium">جميع الأنظمة تعمل</span>
        </div>
      </div>
    </footer>
  )
}