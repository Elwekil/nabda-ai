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
    <section id="features" className="bg-white px-5 py-24 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#19705e]">كل ما تحتاجه في يومك</span>
          <h2 className="text-3xl font-extrabold text-[#153b3b] md:text-5xl">أدوات بسيطة، وقرارات أوضح</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI Analysis - Large Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#dce6df] bg-[#f6f8f4] p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d7f0df] text-2xl">
                  🧠
                </div>
                <h3 className="text-2xl font-bold text-[#153b3b]">تحليل ذكي يفهمك</h3>
                <p className="text-[#52706a]">ارفع تقريرك واحصل على ملخص واضح يساعدك في تجهيز الأسئلة المناسبة لطبيبك.</p>
              </div>
              <div className="flex-1">
                <div className="rounded-2xl bg-[#153b3b] p-6 text-center text-white">
                  <span className="text-4xl">📊</span>
                  <p className="mt-2 font-semibold">AI Analysis</p>
                  <p className="text-xs opacity-80">98% accuracy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Meds Guard */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-4">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0d9] text-2xl">
                💊
              </div>
              <h3 className="text-2xl font-bold text-[#153b3b]">حماية أدويتك</h3>
              <p className="text-[#52706a]">تذكيرات واضحة وتنبيهات للتداخلات المحتملة قبل أن تحتاج إليها.</p>
            </div>
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-inner text-3xl">
                🔔
              </div>
            </div>
          </div>

          {/* Symptom Logging */}
          <div className="rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-4">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f0ee] text-2xl">
                🩺
              </div>
              <h3 className="text-2xl font-bold text-[#153b3b]">سجل ما تشعر به</h3>
              <p className="text-[#52706a]">تابع مؤشراتك وأعراضك عبر الزمن لترى الصورة كاملة بدل لحظة منفردة.</p>
            </div>
          </div>

          {/* SOS Emergency */}
          <div id="sos" className="relative overflow-hidden rounded-3xl bg-[#c94842] p-8 text-white md:col-span-8">
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
