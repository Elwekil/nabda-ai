import { useState, useEffect, useRef } from 'react'
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
  const inputRefs = useRef([])
  const { verifyOTP, resendOTP } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      navigate('/signup')
    }
  }, [email, navigate])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

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
    
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6)
      if (digits.length === 6) {
        setOtp(digits.split(''))
        inputRefs.current[5]?.focus()
      }
      return
    }
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
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
      inputRefs.current[index - 1]?.focus()
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
      inputRefs.current[0]?.focus()
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
      inputRefs.current[0]?.focus()
    } catch (error) {
      console.error('Resend failed:', error)
      setError(error.response?.data?.message || 'فشل في إعادة إرسال الرمز')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8f6] px-4 py-8 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        {/* Logo & Brand */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex w-fit items-center gap-3 rounded-2xl bg-[#123b45] px-4 py-3 text-white shadow-sm">
            <Shield className="h-5 w-5 text-[#b9e6d0]" />
            <span className="text-lg font-extrabold tracking-tight">NABDA <span className="text-[#b9e6d0]">Ai</span></span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#123b45]">تحقق من بريدك</h1>
          <p className="mt-2 leading-7 text-[#6b817e]">
            تم إرسال رمز التحقق إلى
            <br />
            <strong className="text-[#16856b]">{email}</strong>
          </p>
        </div>

        {/* OTP Card */}
        <div className="rounded-[2rem] border border-[#dce5e1] bg-white p-6 shadow-[0_20px_60px_rgba(18,59,69,0.10)] sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
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
              <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { inputRefs.current[index] = element }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`h-14 w-11 rounded-xl border text-center text-2xl font-bold text-[#123b45] outline-none transition-all focus:border-[#16856b] focus:ring-4 focus:ring-[#b9e6d0]/60 sm:w-12 ${
                      error ? 'border-red-300' : 'border-[#d5e2de]'
                    }`}
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

          <div className="mt-6 border-t border-[#edf2ef] pt-5 text-center">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-[#16856b] transition-colors hover:bg-[#edf7f1] disabled:cursor-not-allowed disabled:text-gray-400"
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
          <p className="text-xs text-[#829490]">
            لم تصلك الرسالة؟ تحقق من صندوق الوارد أو البريد المزعج (Spam)
          </p>
        </div>
      </div>
    </div>
  )
}
