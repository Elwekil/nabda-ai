import { Activity, ArrowRight, Bot, BrainCircuit, FileText, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

const featureCards = [
  {
    icon: BrainCircuit,
    title: 'AI Health Assistant',
    description: 'Ask natural-language questions about symptoms, medications, labs, and recent health context without the rigid keyword patterns of a basic chatbot.',
    accent: 'bg-slate-900 text-white',
    tone: 'dark',
  },
  {
    icon: FileText,
    title: 'Medical OCR',
    description: 'Upload reports and receive extracted text, structured data, and AI explanations designed to help you review what matters most.',
    accent: 'bg-emerald-50 text-emerald-700',
    tone: 'light',
  },
  {
    icon: Activity,
    title: 'Personal Health Profile',
    description: 'Complete just the essentials that support better personalization and a more useful medical dashboard.',
    accent: 'bg-sky-50 text-sky-700',
    tone: 'light',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-slate-50 px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl space-y-4">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Core capabilities</span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            A healthcare AI platform built around your medical context.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description, accent, tone }) => (
            <article
              key={title}
              className={`rounded-[28px] border p-7 shadow-sm ${tone === 'dark' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">{title}</h3>
              <p className={`text-base leading-7 ${tone === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {description}
              </p>
            </article>
          ))}
        </div>

        <div id="sos" className="mt-8 overflow-hidden rounded-[30px] bg-gradient-to-r from-rose-500 to-red-600 p-8 text-white shadow-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">Emergency access and a clear medical safety layer.</h3>
              <p className="text-base leading-7 text-rose-50">
                Supportive tools and emergency guidance should be available when risk increases, while general information remains informational rather than diagnostic.
              </p>
            </div>
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-rose-600 shadow-lg transition hover:bg-rose-50">
              Start building your profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
