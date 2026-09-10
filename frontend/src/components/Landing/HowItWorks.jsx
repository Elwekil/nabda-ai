const steps = [
  {
    number: '01',
    title: 'Complete your profile',
    description: 'Add the key details that help NABDA personalize your health journey without collecting unnecessary data.',
  },
  {
    number: '02',
    title: 'Upload your medical documents',
    description: 'Support blood tests, prescriptions, doctor notes, discharge summaries, and other common medical records.',
  },
  {
    number: '03',
    title: 'NABDA extracts and organizes the information',
    description: 'OCR, structured data extraction, and review help turn unstructured reports into usable health knowledge.',
  },
  {
    number: '04',
    title: 'Ask the AI assistant questions',
    description: 'Understand symptoms, medication questions, lab results, and care recommendations in natural language.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-2xl space-y-4">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">How NABDA Works</span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Your health data becomes clarity, action, and confidence.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="group rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-100">{step.number}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-semibold text-emerald-700">
                  {step.number}
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-base leading-7 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
