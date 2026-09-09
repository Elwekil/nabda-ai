import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiOrigin } from '../services/api'
import { Heart, User, Mail, Phone, Lock, Calendar, MapPin, Droplet, ArrowRight, Shield } from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { BLOOD_TYPES } from '../utils/constants'

const getFriendlyErrorMessage = (error, fallback) => {
  if (error.response?.status === 429) {
    const retryAfter = error.response?.data?.retryAfter
    return retryAfter
      ? `عدد المحاولات كبير. حاول مرة أخرى بعد ${retryAfter}.`
      : 'عدد المحاولات كبير. حاول مرة أخرى لاحقًا.'
  }

  return error.response?.data?.message || fallback
}

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    city: '',
    blood_type: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}

    if (!formData.full_name) {
      newErrors.full_name = 'الاسم الكامل مطلوب'
    } else if (formData.full_name.length < 3) {
      newErrors.full_name = 'الاسم يجب أن يكون 3 أحرف على الأقل'
    }

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }

    if (formData.phone && !/^[0-9]{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صحيح'
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }

    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'العمر غير صحيح'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
    if (generalError) setGeneralError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) return

    const payload = {
      ...formData,
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      city: formData.city.trim()
    }

    setLoading(true)
    try {
      const result = await signup(payload)
      if (result.success) {
        sessionStorage.setItem('pendingVerification', JSON.stringify({
          email: result.email,
          otp: result.otp || null
        }))
        // Navigate to OTP verification page with email
        navigate('/verify-otp', {
          state: {
            email: result.email,
            otp: result.otp || null
          }
        })
      }
    } catch (error) {
      console.error('Signup failed:', error)
      if (error.response?.status === 429) {
        setGeneralError(getFriendlyErrorMessage(error, 'عدد المحاولات كبير. حاول مرة أخرى لاحقًا.'))
        return
      }
      const message = error.response?.data?.message || 'فشل في إنشاء الحساب'
      if (message.includes('Email already registered') || message.includes('مسجل بالفعل')) {
        setErrors({ email: 'البريد الإلكتروني مسجل بالفعل' })
      } else {
        setGeneralError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">انضم إلى NABDA Ai</h1>
          <p className="text-gray-500 mt-2">ابدأ رحلتك نحو حياة أكثر صحة وتوازناً</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="الاسم الكامل"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="أحمد محمد"
                icon={<User className="w-4 h-4 text-gray-400" />}
                error={errors.full_name}
                required
              />

              <Input
                label="البريد الإلكتروني"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                error={errors.email}
                required
              />

              <Input
                label="رقم الهاتف"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05XXXXXXXXX"
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                error={errors.phone}
              />

              <Input
                label="كلمة المرور"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4 text-gray-400" />}
                error={errors.password}
                required
              />

              <Input
                label="العمر"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                error={errors.age}
              />

              <Input
                label="المدينة"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="الرياض"
                icon={<MapPin className="w-4 h-4 text-gray-400" />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  فصيلة الدم
                </label>
                <div className="relative">
                  <Droplet className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">اختر فصيلة الدم</option>
                    {BLOOD_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                {errors.blood_type && (
                  <p className="text-xs text-red-500 mt-1">{errors.blood_type}</p>
                )}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-4">
              إنشاء حساب
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">أو سجّل بـ</span>
            </div>
          </div>

          <a
            href={`${getApiOrigin()}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            إنشاء حساب بـ Google
          </a>

          <div className="text-center">
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              تسجيل الدخول إلى حسابك
            </Link>
          </div>
        </div>

        {/* Terms Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            بالتسجيل أنت توافق على{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">شروط الاستخدام</Link>
            {' '}و{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">سياسة الخصوصية</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
