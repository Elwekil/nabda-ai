export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "📤",
      title: "مسح أو رفع",
      description: "التقط صورة لتقريرك الطبي أو ارفع PDF مباشرة. تقنية التعرف الضوئي على الحروف تقوم بتحويل البيانات رقمياً."
    },
    {
      number: "02",
      icon: "📊",
      title: "معالجة الذكاء الاصطناعي",
      description: "يقوم محركنا السريري بتحليل الاتجاهات بناءً على تاريخك الطبي والمعايير العالمية لاكتشاف الرؤى التي قد تفوتك."
    },
    {
      number: "03",
      icon: "✅",
      title: "رؤى قابلة للتنفيذ",
      description: "احصل على تفسيرات واضحة، أسئلة مقترحة للطبيب، وتعديلات في نمط الحياة مصممة خصيصاً لنتائجك."
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="text-blue-600 text-sm uppercase tracking-widest font-semibold">الخطوات</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              من البيانات إلى القرارات في ثلاث خطوات بسيطة
            </h2>
          </div>
          <div className="hidden md:block pb-2">
            <span className="text-gray-200 text-8xl">→</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative space-y-6 group">
              <div className="text-8xl font-black text-gray-100 absolute -top-10 -left-4 group-hover:text-blue-100 transition-colors">
                {step.number}
              </div>
              <div className="relative z-10 pt-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl mb-6 shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}