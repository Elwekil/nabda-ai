import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiOrigin } from '../services/api'
import { Heart, CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateProfile } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const token = searchParams.get('token')
      const userId = searchParams.get('userId')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        toast.error('فشل تسجيل الدخول بحساب Google')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
        return
      }

      if (!token || !userId) {
        setStatus('error')
        toast.error('بيانات غير صحيحة')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
        return
      }

      try {
        // Save token to localStorage
        localStorage.setItem('token', token)

        // Fetch user data
        const response = await fetch(`${getApiOrigin()}/api/auth/check-auth`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const user = data.data.user

          // Save user to localStorage
          localStorage.setItem('user', JSON.stringify(user))

          // Update context by refreshing profile
          await updateProfile({})

          setStatus('success')
          toast.success('تم تسجيل الدخول بنجاح!')

          // Redirect to dashboard after 1.5 seconds
          setTimeout(() => {
            navigate('/dashboard')
          }, 1500)
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error) {
        console.error('Google auth error:', error)
        setStatus('error')
        toast.error('حدث خطأ أثناء تسجيل الدخول')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    handleGoogleAuth()
  }, [searchParams, navigate, updateProfile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NABDA Ai</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'processing' && (
            <div className="text-center">
              <Loader className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                جاري تسجيل الدخول...
              </h2>
              <p className="text-gray-500">
                يرجى الانتظار بينما نقوم بإعداد حسابك
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                تم تسجيل الدخول بنجاح!
              </h2>
              <p className="text-gray-500">
                سيتم توجيهك إلى لوحة التحكم...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                فشل تسجيل الدخول
              </h2>
              <p className="text-gray-500 mb-4">
                حدث خطأ أثناء تسجيل الدخول بحساب Google
              </p>
              <p className="text-sm text-gray-400">
                سيتم توجيهك إلى صفحة تسجيل الدخول...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
