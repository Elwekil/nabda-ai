import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Landing/Navbar'
import Hero from '../components/Landing/Hero'
import Features from '../components/Landing/Features'
import HowItWorks from '../components/Landing/HowItWorks'
import Security from '../components/Landing/Security'
import CTASection from '../components/Landing/CTASection'
import Footer from '../components/Landing/Footer'

export default function Landing() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Hero />

      {isAuthenticated && user && (
        <div className="mx-auto max-w-7xl px-6 pb-2 pt-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
            Welcome back, {user.full_name || 'NABDA user'}.
          </div>
        </div>
      )}

      <Features />
      <HowItWorks />
      <Security />
      <CTASection />
      <Footer />
    </div>
  )
}
