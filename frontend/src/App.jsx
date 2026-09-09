import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './pages/Landing'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Medications from './pages/Medications'
import Appointments from './pages/Appointments'
import ForgotPassword from './pages/ForgotPassword'
import Documents from './pages/Documents'
import Profile from './pages/Profile'
import HealthReport from './pages/HealthReport'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOTP from './pages/VerifyOTP'
import GoogleAuthSuccess from './pages/GoogleAuthSuccess'
import SOSFloating from './components/common/SOSFloating'
import AIChatbot from './pages/AIChatbot'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path='/' element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
                <Route path="/*" element={
                  <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} className="flex h-screen transition-colors duration-200">
                    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                      <main style={{ backgroundColor: 'var(--bg-page)' }} className="flex-1 overflow-y-auto p-6">                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/medications" element={<Medications />} />
                          <Route path="/appointments" element={<Appointments />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/health-report" element={<HealthReport />} />
                          <Route path="/ai-chatbot" element={<AIChatbot />} />
                    <Route path="/pricing" element={<Pricing />} />
                        </Routes>
                      </main>
                    </div>
                    <SOSFloating />
                  </div>
                } />
              </Routes>
            </Router>
            <Toaster position="top-center" />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
