import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Hero() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="relative overflow-hidden border-b border-[#dce5e1] bg-[#f7faf8] px-5 pb-20 pt-32 md:px-8 md:pb-28 md:pt-44">
      <div className="absolute inset-x-0 top-0 h-2 bg-[#16856b]" />
      <div className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-[#dce5e1] bg-[#eef6f1] lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-[1.02fr_.98fr]">
        <div className="space-y-8" dir="rtl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cce2d3] bg-white px-4 py-2 text-sm font-semibold text-[#16856b] shadow-sm">
            <Sparkles className="h-4 w-4" /> رعاية أذكى تبدأ من بياناتك
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.18] tracking-tight text-[#123b45] md:text-6xl">
              كل تفاصيل صحتك، في مكان واحد وبوضوح.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#58716f] md:text-xl">
              NABDA Ai يساعدك على فهم تقاريرك، تنظيم أدويتك، ومتابعة مؤشراتك اليومية بهدوء وأمان.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            {isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-xl bg-[#16856b] px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#106650]">
                اذهب إلى لوحة التحكم <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="flex items-center justify-center gap-2 rounded-xl bg-[#16856b] px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#106650]">
                  ابدأ مجانًا <ArrowLeft className="h-5 w-5" />
                </Link>
                <Link to="/login" className="flex items-center justify-center rounded-xl border border-[#cce2d3] bg-white px-7 py-3.5 text-base font-bold text-[#16856b] transition-colors hover:bg-[#edf5ef]">
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#58716f]">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16856b]" /> خصوصية أولًا</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#16856b]" /> مصمم للعائلة</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[31rem]">
          <div className="relative rounded-[2rem] border border-[#dce5e1] bg-white p-3 shadow-[0_24px_70px_rgba(18,59,69,0.14)]">
            <div className="rounded-[1.5rem] bg-[#123b45] p-6 text-white md:p-8" dir="rtl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#b9d8c4]">ملخصك اليومي</p>
                  <h2 className="mt-1 text-2xl font-bold">صباح هادئ، أحمد</h2>
                </div>
                <div className="rounded-xl bg-white/10 p-3"><HeartPulse className="h-6 w-6 text-[#b9e6d0]" /></div>
              </div>
              <div className="mt-8 flex items-end justify-between rounded-2xl bg-white/10 p-5">
                <div><p className="text-sm text-[#b9e6d0]">مؤشر العافية</p><p className="mt-1 text-4xl font-extrabold">84<span className="text-lg text-[#b9e6d0]">/100</span></p></div>
                <div className="flex h-20 items-end gap-1.5">{[32, 45, 38, 62, 54, 74, 86].map((height, index) => <span key={index} className="w-2 rounded-full bg-[#b9e6d0]" style={{ height: `${height}%` }} />)}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-[#f2c879] p-4 text-[#123b45]"><p className="font-semibold">الأدوية</p><p className="mt-2 text-xl font-extrabold">2 / 3</p></div>
                <div className="rounded-2xl bg-[#b9e6d0] p-4 text-[#123b45]"><p className="font-semibold">النبض</p><p className="mt-2 text-xl font-extrabold">72 bpm</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#b9e6d0]"><ShieldCheck className="h-4 w-4" /> بياناتك مشفرة ومحمية</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
