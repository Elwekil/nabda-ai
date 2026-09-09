import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/check-auth')
      if (response.data.success) {
        // Fetch full profile to get profile_image and all fields
        const profileRes = await api.get('/users/profile')
        if (profileRes.data.success) {
          const fullUser = profileRes.data.data
          setUser(fullUser)
          localStorage.setItem('user', JSON.stringify(fullUser))
        } else {
          setUser(response.data.data.user)
          localStorage.setItem('user', JSON.stringify(response.data.data.user))
        }
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData)
      if (response.data.success) {
        toast.success('تم إنشاء الحساب بنجاح، يرجى إدخال رمز التحقق')
        return { 
          success: true, 
          email: response.data.data.email,
          userId: response.data.data.userId,
          otp: response.data.data.otp
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'فشل في إنشاء الحساب'
      toast.error(message)
      throw error
    }
  }

  const verifyOTP = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp
      })
      if (response.data.success) {
        const { user, token } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        toast.success('تم التحقق من البريد الإلكتروني بنجاح')
        return { success: true, user }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'رمز التحقق غير صحيح'
      toast.error(message)
      throw error
    }
  }

  const resendOTP = async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase()
      })
      if (response.data.success) {
        toast.success('تم إرسال رمز التحقق الجديد')
        return response.data.data
      }
    } catch (error) {
      const message = error.response?.data?.message || 'فشل في إرسال الرمز'
      toast.error(message)
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        const { user, token } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        toast.success('تم تسجيل الدخول بنجاح')
        return { success: true, user }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'فشل في تسجيل الدخول'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('تم تسجيل الخروج')
  }

  const updateProfile = async (profileData) => {
    try {
      // If empty object, just refresh profile from server
      if (Object.keys(profileData).length === 0) {
        const res = await api.get('/users/profile')
        if (res.data.success) {
          const freshUser = res.data.data
          localStorage.setItem('user', JSON.stringify(freshUser))
          setUser(freshUser)
          return freshUser
        }
        return
      }
      const response = await api.put('/users/profile', profileData)
      if (response.data.success) {
        const updatedUser = response.data.data
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        toast.success('تم تحديث الملف الشخصي')
        return updatedUser
      }
    } catch (error) {
      const message = error.response?.data?.message || 'فشل في تحديث الملف الشخصي'
      toast.error(message)
      throw error
    }
  }

  const getDashboardStats = async () => {
    try {
      const response = await api.get('/users/dashboard-stats')
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      return null
    }
  }

  const value = {
    user,
    loading,
    signup,
    verifyOTP,
    resendOTP,
    login,
    logout,
    updateProfile,
    getDashboardStats,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
