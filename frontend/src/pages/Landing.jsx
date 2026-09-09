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
    <div className="min-h-screen bg-[#f7f9fc]">
      <Navbar />
      <Hero />
      
      {/* Optional: Show welcome message for logged in users */}
      {isAuthenticated && user && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700">
              مرحباً بعودتك {user.full_name}! 🎉
            </p>
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