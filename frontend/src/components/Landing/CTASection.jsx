import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CTASection() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-14">
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Start with clarity
        </span>
        <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
          Start building your health profile.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Organize your health information, understand medical records, and ask informed questions with NABDA AI.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          {isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-500">
                Get Started
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Explore NABDA
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-sm text-slate-500">
          NABDA AI provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </div>
    </section>
  )
}
