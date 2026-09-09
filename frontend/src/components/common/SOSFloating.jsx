import { useState } from 'react'
import { Shield, Phone, X, AlertTriangle, MapPin, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function SOSFloating() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [result, setResult] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)

  // Get user location (local browser API - no external API)
  const getLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false)
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => {
        setLocationLoading(false)
        console.error('Location error:', err)
        resolve(null)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  })

  const confirmSOS = async () => {
    setLoading(true)
    try {
      // Get location (local only - no external API)
      const locationData = await getLocation()
      
      const { data } = await api.post('/sos/emergency', { location: locationData })
      const { contactsNotified } = data.data
      setResult(data.data)
      setSent(true)
      setShowConfirm(false)
      toast.success(`تم إرسال إشارة الطوارئ — تم إخطار ${contactsNotified} جهة اتصال`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في إرسال إشارة الاستغاثة')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setSent(false)
    setResult(null)
    setShowConfirm(true)
  }

  return (
    <>
      {/* Floating SOS button - small, bottom left */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 left-4 z-40 w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="طوارئ - طلب مساعدة"
      >
        <Shield className="w-4 h-4" />
      </button>

      {/* Success panel after SOS sent */}
      {sent && result && (
        <div className="fixed bottom-20 left-6 z-40 bg-white border border-green-200 rounded-2xl shadow-xl p-4 max-w-xs w-full">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="font-semibold text-green-800 text-sm">
              تم إرسال إشارة الطوارئ — تم إخطار {result.contactsNotified} جهة اتصال
            </p>
          </div>
          {result.primaryContact?.phone && (
            <a
              href={`tel:${result.primaryContact.phone}`}
              className="flex items-center gap-2 mt-2 text-sm text-red-600 font-medium hover:underline"
            >
              <Phone className="w-4 h-4" />
              اتصل بـ {result.primaryContact.name || 'جهة الطوارئ'} — {result.primaryContact.phone}
            </a>
          )}
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">تأكيد طلب المساعدة</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-3">
              <AlertTriangle className="w-14 h-14 text-red-600 mx-auto mb-3" />
              <p className="text-gray-700 text-sm mb-1">هل أنت متأكد من طلب المساعدة الطارئة؟</p>
              <p className="text-gray-500 text-xs">سيتم إرسال ملفك الطبي وموقعك لجهة الطوارئ</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
                {locationLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>جاري تحديد الموقع...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>سيتم طلب موقعك الحالي</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={confirmSOS}
                disabled={loading || locationLoading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {loading ? 'جاري...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 disabled:opacity-60 font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
