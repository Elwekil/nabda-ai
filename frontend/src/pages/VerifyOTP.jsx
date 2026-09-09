import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, RefreshCw, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import Button from '../components/common/Button'

const DEV_MODE = import.meta.env.DEV

const readPendingVerification = () => {
  try {
    const raw = sessionStorage.getItem('pendingVerification')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function VerifyOTP() {
  const location = useLocation()
  const pendingVerification = location.state || readPendingVerification()
  const email = pendingVerification?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [debugOtp, setDebugOtp] = useState(pendingVerification?.otp || '')
  const { verifyOTP, resendOTP } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      navigate('/signup')
    }
  }, [email, navigate])

  useEffect(() => {
    if (email) {
      sessionStorage.setItem('pendingVerification', JSON.stringify({
        email,
        otp: debugOtp || null
      }))
    }
  }, [email, debugOtp])

  useEffect(() => {
    if (DEV_MODE && debugOtp?.length === 6) {
      setOtp(debugOtp.split(''))
    }
  }, [debugOtp])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return
    
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')
    
    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
    
    // Auto submit when all digits are filled
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      setTimeout(() => {
        document.getElementById('verify-form')?.requestSubmit()
      }, 100)
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const result = await verifyOTP(email, otpCode)
      if (result.success) {
        sessionStorage.removeItem('pendingVerification')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      const message = error.response?.data?.message || 'رمز التحقق غير صحيح'
      setError(message)
      if (message.includes('No active verification code found') || message.includes('resend')) {
        setCountdown(0)
      }
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', ''])
      // Focus first input
      document.getElementById('otp-0')?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    
    setResendLoading(true)
    setError('')
    try {
      const data = await resendOTP(email)
      if (data?.otp) {
        setDebugOtp(data.otp)
      }
      sessionStorage.setItem('pendingVerification', JSON.stringify({
        email,
        otp: data?.otp || null
      }))
      setCountdown(300) // Reset to 5 minutes
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } catch (error) {
      console.error('Resend failed:', error)
      setError(error.response?.data?.message || 'فشل في إعادة إرسال الرمز')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">تحقق من بريدك</h1>
          <p className="text-gray-500 mt-2">
            تم إرسال رمز التحقق إلى
            <br />
            <strong className="text-primary-600">{email}</strong>
          </p>
        </div>

        {/* OTP Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form id="verify-form" onSubmit={handleSubmit} className="space-y-6">
            {DEV_MODE && debugOtp && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-700">
                <p className="mb-2">رمز التطوير الحالي</p>
                <button
                  type="button"
                  dir="ltr"
                  onClick={() => setOtp(debugOtp.split(''))}
                  className="font-bold tracking-[0.35em] hover:text-amber-900"
                >
                  {debugOtp}
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-4">
                أدخل رمز التحقق المكون من 6 أرقام
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-2xl font-bold border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      error ? 'border-red-300' : 'border-gray-300'
                    }`}
                    autoFocus={index === 0}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={otp.join('').length !== 6 || loading}
              loading={loading}
              className="w-full"
            >
              التحقق
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  إعادة الإرسال بعد {formatTime(countdown)}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  إعادة إرسال الرمز
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            لم تصلك الرسالة؟ تحقق من صندوق الوارد أو البريد المزعج (Spam)
          </p>
        </div>
      </div>
    </div>
  )
}
