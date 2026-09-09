export default function Features() {
  const features = [
    {
      icon: "🧠",
      title: "تحليل تشخيصي بالذكاء الاصطناعي",
      description: "قم برفع تقارير الدم أو الأشعة. يقوم الذكاء الاصطناعي بتحليل النتائج وتقديم ملخص سهل الفهم في ثوانٍ.",
      size: "large",
      bgColor: "bg-blue-50"
    },
    {
      icon: "💊",
      title: "حماية الأدوية",
      description: "تتبع أدويتك ومكملاتك الغذائية. يكتشف نظامنا التداخلات الدوائية المحتملة قبل تناولها.",
      size: "small",
      bgColor: "bg-green-50"
    },
    {
      icon: "🩺",
      title: "تسجيل الأعراض",
      description: "سجل التغيرات في جسمك بسهولة. احصل على اقتراحات صحية فورية بناءً على المعايير الطبية العالمية.",
      size: "small",
      bgColor: "bg-purple-50"
    },
    {
      icon: "🚨",
      title: "مشاركة SOS للطوارئ",
      description: "في حالة الطوارئ، يمكن مشاركة ملفك الطبي (الحساسية، فصيلة الدم، الأدوية) مع المستجيبين الأوائل بنقرة واحدة.",
      size: "large",
      bgColor: "bg-red-50"
    }
  ]

  return (
    <section id="features" className="py-24 px-6 bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-blue-600 text-sm uppercase tracking-widest font-semibold">إمكانيات متقدمة</span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">مصممة للدقة السريرية</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI Analysis - Large Card */}
          <div className="md:col-span-8 bg-white rounded-2xl p-8 group overflow-hidden relative border border-gray-100 hover:border-blue-200 transition-all shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  🧠
                </div>
                <h3 className="text-2xl font-bold text-gray-900">تحليل تشخيصي بالذكاء الاصطناعي</h3>
                <p className="text-gray-600">قم برفع تقارير الدم أو الأشعة. يقوم الذكاء الاصطناعي بتحليل النتائج وتقديم ملخص سهل الفهم في ثوانٍ.</p>
              </div>
              <div className="flex-1">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
                  <span className="text-4xl">📊</span>
                  <p className="mt-2 font-semibold">AI Analysis</p>
                  <p className="text-xs opacity-80">98% accuracy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meds Guard */}
          <div className="md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 transition-all shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
                💊
              </div>
              <h3 className="text-2xl font-bold text-gray-900">حماية الأدوية</h3>
              <p className="text-gray-600">تتبع أدويتك ومكملاتك الغذائية. يكتشف نظامنا التداخلات الدوائية المحتملة قبل تناولها.</p>
            </div>
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-inner text-3xl">
                🔔
              </div>
            </div>
          </div>

          {/* Symptom Logging */}
          <div className="md:col-span-4 bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-200 transition-all shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
                🩺
              </div>
              <h3 className="text-2xl font-bold text-gray-900">تسجيل الأعراض</h3>
              <p className="text-gray-600">سجل التغيرات في جسمك بسهولة. احصل على اقتراحات صحية فورية بناءً على المعايير الطبية العالمية.</p>
            </div>
          </div>

          {/* SOS Emergency */}
          <div className="md:col-span-8 bg-red-600 text-white rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/20 to-transparent"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 w-full">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  🚨 SOS Emergency Sharing
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                </h3>
                <p className="opacity-90">في حالة الطوارئ، يمكن مشاركة ملفك الطبي (الحساسية، فصيلة الدم، الأدوية) مع المستجيبين الأوائل بنقرة واحدة.</p>
              </div>
              <button className="bg-white text-red-600 px-8 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform shrink-0">
                تفعيل الملف الطبي
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}