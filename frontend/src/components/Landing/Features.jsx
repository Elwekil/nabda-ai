import { BrainCircuit, BellRing, Activity, ShieldAlert, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Features() {
  return (
    <section id="features" className="bg-white px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4" dir="rtl">
            <span className="text-sm font-bold tracking-wide text-[#16856b]">من لوحة واحدة إلى رعاية أهدأ</span>
            <h2 className="text-3xl font-extrabold leading-tight text-[#123b45] md:text-5xl">أدوات صحية مصممة حول يومك</h2>
          </div>
          <p className="max-w-sm text-right text-base leading-7 text-[#6b817e]" dir="rtl">كل ميزة هنا لها هدف واحد: أن ترى بياناتك بوضوح وتتخذ خطوتك التالية بثقة.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="group relative overflow-hidden rounded-[2rem] bg-[#123b45] p-8 text-white shadow-[0_18px_50px_rgba(18,59,69,0.12)] transition-transform hover:-translate-y-1 md:col-span-7 md:p-10" dir="rtl">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
            <div className="relative flex h-full flex-col justify-between gap-12">
              <div className="max-w-md space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b9e6d0] text-[#123b45]"><BrainCircuit className="h-6 w-6" /></div>
                <h3 className="text-2xl font-bold">تحليل ذكي يفهمك</h3>
                <p className="leading-7 text-[#c4ddd5]">ارفع تقريرك واحصل على ملخص واضح يساعدك في تجهيز الأسئلة المناسبة لطبيبك.</p>
              </div>
              <div className="flex items-center justify-between border-t border-white/15 pt-5 text-sm text-[#b9e6d0]">
                <span>ملخص مبسط خلال ثوانٍ</span><ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dce5e1] bg-[#f2f8f4] p-8 md:col-span-5 md:p-10" dir="rtl">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2c879] text-[#123b45]"><BellRing className="h-6 w-6" /></div>
                <h3 className="text-2xl font-bold text-[#123b45]">حماية أدويتك</h3>
                <p className="leading-7 text-[#58716f]">تذكيرات واضحة وتنبيهات للتداخلات المحتملة قبل أن تحتاج إليها.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#36545a] shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f3eb] text-[#16856b]"><BellRing className="h-4 w-4" /></span>
                الجرعة التالية بعد 20 دقيقة
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dce5e1] bg-white p-8 md:col-span-5 md:p-10" dir="rtl">
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f3eb] text-[#16856b]"><Activity className="h-6 w-6" /></div>
              <h3 className="text-2xl font-bold text-[#123b45]">صورة أوضح مع الوقت</h3>
              <p className="leading-7 text-[#58716f]">سجل مؤشراتك وأعراضك عبر الزمن لترى الأنماط التي تستحق نقاشها مع طبيبك.</p>
            </div>
          </div>

          <div id="sos" className="relative overflow-hidden rounded-[2rem] bg-[#c94d4b] p-8 text-white md:col-span-7 md:p-10" dir="rtl">
            <div className="relative flex h-full flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-lg space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><ShieldAlert className="h-6 w-6" /></div>
                <h3 className="text-2xl font-bold">ملف طوارئ جاهز عند الحاجة</h3>
                <p className="leading-7 text-[#ffe1dc]">شارك معلوماتك المهمة بسرعة، مثل الحساسية وفصيلة الدم والأدوية الحالية.</p>
              </div>
              <Link to="/signup" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#b33e3d] transition-colors hover:bg-[#fff4f0]">
                فعّل ملفك <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
