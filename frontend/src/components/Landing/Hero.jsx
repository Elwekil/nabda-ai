import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Hero() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="relative overflow-hidden bg-[#f6f8f4] px-5 pb-20 pt-32 md:px-8 md:pb-28 md:pt-44">
      <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[#d9eee0] blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-[1.02fr_.98fr]">
        <div className="space-y-8" dir="rtl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cce2d3] bg-white/70 px-4 py-2 text-sm font-semibold text-[#19705e]">
            <Sparkles className="h-4 w-4" /> رعاية أذكى تبدأ من بياناتك
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.22] tracking-tight text-[#153b3b] md:text-6xl">
              كل تفاصيل صحتك، في مكان واحد وبوضوح.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#52706a] md:text-xl">
              NABDA Ai يساعدك على فهم تقاريرك، تنظيم أدويتك، ومتابعة مؤشراتك اليومية بهدوء وأمان.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            {isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-xl bg-[#19705e] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#145548]">
                اذهب إلى لوحة التحكم <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="flex items-center justify-center gap-2 rounded-xl bg-[#19705e] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#145548]">
                  ابدأ مجانًا <ArrowLeft className="h-5 w-5" />
                </Link>
                <Link to="/login" className="flex items-center justify-center rounded-xl border border-[#cce2d3] bg-white px-7 py-3.5 text-base font-bold text-[#19705e] transition-colors hover:bg-[#edf5ef]">
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#52706a]">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#19705e]" /> خصوصية أولًا</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#19705e]" /> مصمم للعائلة</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[31rem]">
          <div className="absolute -inset-8 rounded-[2.5rem] bg-[#dcefe2] blur-2xl" />
          <div className="relative rounded-[2rem] border border-white bg-white p-3 shadow-[0_24px_70px_rgba(21,59,59,0.15)]">
            <div className="rounded-[1.5rem] bg-[#153b3b] p-6 text-white md:p-8" dir="rtl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#b9d8c4]">ملخصك اليومي</p>
                  <h2 className="mt-1 text-2xl font-bold">صباح هادئ، أحمد</h2>
                </div>
                <div className="rounded-xl bg-white/10 p-3"><HeartPulse className="h-6 w-6 text-[#a8e2b7]" /></div>
              </div>
              <div className="mt-8 flex items-end justify-between rounded-2xl bg-white/10 p-5">
                <div><p className="text-sm text-[#b9d8c4]">مؤشر العافية</p><p className="mt-1 text-4xl font-extrabold">84<span className="text-lg text-[#b9d8c4]">/100</span></p></div>
                <div className="flex h-20 items-end gap-1.5">{[32, 45, 38, 62, 54, 74, 86].map((height, index) => <span key={index} className="w-2 rounded-full bg-[#a8e2b7]" style={{ height: `${height}%` }} />)}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-[#f3b562] p-4 text-[#153b3b]"><p className="font-semibold">الأدوية</p><p className="mt-2 text-xl font-extrabold">2 / 3</p></div>
                <div className="rounded-2xl bg-[#d7f0df] p-4 text-[#153b3b]"><p className="font-semibold">النبض</p><p className="mt-2 text-xl font-extrabold">72 bpm</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#b9d8c4]"><ShieldCheck className="h-4 w-4" /> بياناتك مشفرة ومحمية</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
