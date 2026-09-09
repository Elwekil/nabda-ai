import { Link } from 'react-router-dom'

export default function Security() {
  return (
    <section id="security" className="py-24 px-6 bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto rounded-2xl bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="relative z-10 grid md:grid-cols-2 gap-12 p-12 md:p-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full border border-blue-500/30">
              <span className="text-sm">🔒</span>
              <span className="text-xs font-bold uppercase tracking-widest">أمان طبي معتمد</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">خصوصيتك هي أولويتنا الأساسية</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              بنينا NABDA Ai على بنية "غير متصلة أولاً". بياناتك الأكثر حساسية لا تغادر جهازك أبداً إلا إذا اخترت مزامنتها—وحتى ذلك الحين، فهي محمية بتشفير طبي من الدرجة الأولى.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span>
                <span>تشفير AES-256 في السحابة</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span>
                <span>معالجة متوافقة مع HIPAA</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">✓</span>
                <span>بنية عدم المعرفة</span>
              </li>
            </ul>
            <Link 
              to="/signup" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all mt-4"
            >
              ابدأ الآن مجاناً
            </Link>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="relative bg-gray-800/40 border border-white/10 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <span className="text-7xl mb-4 text-blue-400">🔒</span>
                <span className="text-xl font-bold">الدرع مشغل</span>
                <span className="text-sm opacity-60 mt-2">البيانات محلية بالكامل</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}