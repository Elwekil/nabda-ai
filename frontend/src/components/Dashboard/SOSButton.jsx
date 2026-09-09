import { useState } from 'react'
import { Shield, Phone, X, AlertTriangle, MapPin, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../services/api'

export default function SOSButton() {
  const { t } = useLanguage()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [result, setResult] = useState(null)

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  const confirmSOS = async () => {
    setLoading(true)
    try {
      const location = await getLocation()
      const { data } = await api.post('/sos', { location })

      setResult(data.data)
      setSent(true)
      setShowConfirm(false)
      toast.success(t('dashboard.emergency_alert_sent'))

      // Auto-dial emergency contact if available
      const phone = data.data?.emergencyContact?.phone
      if (phone) {
        setTimeout(() => {
          window.location.href = `tel:${phone}`
        }, 1500)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في إرسال إشارة الاستغاثة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setSent(false); setResult(null); setShowConfirm(true) }}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <div>
            <p className="font-bold">{t('dashboard.sos')}</p>
            <p className="text-xs text-red-100">{t('dashboard.sos_description')}</p>
          </div>
        </div>
        <Phone className="w-6 h-6" />
      </button>

      {/* Sent confirmation card */}
      {sent && result && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800 text-sm">{t('dashboard.emergency_alert_sent')}</p>
          </div>
          {result.emergencyContact?.phone && (
            <div className="flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <a href={`tel:${result.emergencyContact.phone}`}
                className="text-sm text-primary-600 font-medium hover:underline">
                {result.emergencyContact.name} — {result.emergencyContact.phone}
              </a>
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('dashboard.confirm_sos')}</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-4">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <p className="text-gray-800 mb-2">{t('dashboard.sos_confirm_message')}</p>
              <p className="text-gray-600 text-sm">{t('dashboard.sos_notify_message')}</p>
              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>سيتم إرسال موقعك الحالي مع ملفك الطبي</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmSOS}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {loading ? 'جاري الإرسال...' : t('common.confirm')}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
