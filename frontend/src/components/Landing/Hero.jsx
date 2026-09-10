import { Link } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, FileText, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const capabilityList = [
  'AI Health Assistant',
  'Medical Document OCR',
  'Personal Health Profile',
]

export default function Hero() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="relative overflow-hidden border-b border-slate-200 bg-white px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-36">
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
      <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-slate-50 lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            <Sparkles className="h-4 w-4" /> Healthcare intelligence for everyday decisions
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              Understand Your Health.
              <span className="mt-2 block text-emerald-600">Powered by AI.</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
              Analyze medical documents, understand health information, organize your medical profile, and interact with an AI health assistant — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-500">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Explore NABDA
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-sm font-medium text-slate-600">
            {capabilityList.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="rounded-[22px] bg-slate-900 p-5 text-white md:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">NABDA AI</p>
                  <h2 className="mt-2 text-2xl font-bold">Your health overview</h2>
                </div>
                <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                  <HeartPulse className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Profile</p>
                  <p className="mt-3 text-2xl font-bold">81%</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-100">
                  <p className="text-xs uppercase tracking-wide">Docs</p>
                  <p className="mt-3 text-2xl font-bold">12</p>
                </div>
                <div className="rounded-2xl bg-sky-500/10 p-4 text-sky-100">
                  <p className="text-xs uppercase tracking-wide">Vitals</p>
                  <p className="mt-3 text-2xl font-bold">Healthy</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Health summary</span>
                  <span className="text-emerald-300">Stable</span>
                </div>
                <div className="mt-4 flex h-16 items-end gap-2">
                  {[35, 48, 42, 58, 66, 74, 82].map((height, index) => (
                    <span key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-400 to-emerald-200" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-slate-200">
                    <FileText className="h-4 w-4 text-emerald-300" />
                    Latest report
                  </div>
                  <p className="mt-3 text-sm text-slate-100">Blood test review ready</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Bot className="h-4 w-4 text-emerald-300" />
                    AI Assistant
                  </div>
                  <p className="mt-3 text-sm text-slate-100">Explain this report</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Your medical information stays protected and organized
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
