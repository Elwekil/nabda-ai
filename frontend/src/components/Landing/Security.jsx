import { Link } from 'react-router-dom'
import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'

const securityFeatures = [
  'Access control and user-bound medical data',
  'File validation and upload safeguards',
  'Private handling of sensitive health information',
]

export default function Security() {
  return (
    <section id="security" className="bg-slate-50 px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-slate-200 bg-slate-900 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-14">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <LockKeyhole className="h-4 w-4" /> Privacy & Security
            </span>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Sensitive medical information deserves careful handling.
            </h2>
            <p className="max-w-xl text-base leading-8 text-slate-300">
              NABDA is designed to keep health data organized, protected, and limited to the people and systems that need it. Secure architecture, validation, and careful access rules help reduce risk without overpromising.
            </p>

            <ul className="space-y-4 text-slate-200">
              {securityFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/signup" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
              Get started
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <div className="absolute inset-4 rounded-[24px] border border-emerald-500/20" />
              <div className="relative space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-300">
                  <Sparkles className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Protected health context</h3>
                  <p className="mt-2 text-base text-slate-300">
                    Structured, user-specific guidance with privacy-aware AI workflows.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left text-sm text-slate-200">
                  Secure access rules • validated uploads • limited logging
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
