import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { exportMedicalFile } from '../services/api'
import { Download, RefreshCw, Heart, Activity, Pill, Calendar, CheckCircle, AlertTriangle, XCircle, Sparkles, Mail, X } from 'lucide-react'
import { generatePDF } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'

const ScoreRing = ({ score, size = 120 }) => {
  const r = 45
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#6b7280">/ 100</text>
    </svg>
  )
}

const StatusBadge = ({ status }) => {
  const map = {
    'ممتاز':        { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
    'Excellent':    { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
    'جيد':          { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: CheckCircle },
    'Good':         { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: CheckCircle },
    'متوسط':        { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
    'Average':      { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
    'يحتاج اهتمام': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
    'Needs Attention':{ bg: 'bg-orange-100',text: 'text-orange-700', icon: AlertTriangle },
    'حرج':          { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
    'Critical':     { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
  }
  const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle }
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  )
}

const categoryIcon = (name) => {
  if (name.includes('حيوية') || name.includes('Vital')) return Activity
  if (name.includes('دواء') || name.includes('Medic')) return Pill
  if (name.includes('متابعة') || name.includes('Follow') || name.includes('Appoint')) return Calendar
  return Heart
}

export default function HealthReport() {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(null)
  
  // Email export modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/health-report')
      // Backend returns report directly in res.data.data (not in res.data.data.report)
      setReport(res.data.data)
      setGeneratedAt(new Date().toISOString())
      toast.success('تم إنشاء التقرير بنجاح')
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل في إنشاء التقرير'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!report) return
    generatePDF(report, user, generatedAt)
    toast.success('جاري تحميل التقرير...')
  }

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('الرجاء إدخال البريد الإلكتروني')
      return
    }
    
    setSendingEmail(true)
    try {
      await exportMedicalFile(email)
      toast.success('تم إرسال الملف الطبي بنجاح إلى ' + email)
      setShowEmailModal(false)
      setEmail('')
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل في إرسال الملف الطبي'
      toast.error(msg)
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقرير الصحي الشامل</h1>
          <p className="text-gray-500 text-sm mt-1">تحليل ذكي لحالتك الصحية بناءً على جميع بياناتك</p>
        </div>
        <div className="flex gap-3">
          {report && (
            <>
              <button onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                <Mail className="w-4 h-4" />
                إرسال على الإيميل
              </button>
              <button onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                تحميل PDF
              </button>
            </>
          )}
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-60">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'جاري التحليل...' : report ? 'إعادة التحليل' : 'إنشاء التقرير'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!report && !loading && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد تقرير بعد</h3>
          <p className="text-gray-400 text-sm mb-6">اضغط على "إنشاء التقرير" لتحليل حالتك الصحية بالذكاء الاصطناعي</p>
          <button onClick={fetchReport}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
            <Sparkles className="w-5 h-5" />
            إنشاء التقرير الصحي
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-16 text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">جاري تحليل بياناتك الصحية...</p>
          <p className="text-gray-400 text-sm mt-1">قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div id="health-report-content" className="space-y-6">

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">النتيجة الصحية الإجمالية</h2>
                <p className="text-primary-100 text-sm mb-3">{report.summary}</p>
                <StatusBadge status={report.overall_status} />
                {generatedAt && (
                  <p className="text-primary-200 text-xs mt-3">
                    تم التحليل: {new Date(generatedAt).toLocaleString('ar-EG')}
                  </p>
                )}
              </div>
              <div className="bg-white/10 rounded-2xl p-4">
                <ScoreRing score={report.overall_score} size={130} />
              </div>
            </div>
          </div>

          {/* Urgent Alerts */}
          {report.urgent_alerts?.length > 0 && report.urgent_alerts[0] && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-700">تنبيهات عاجلة</h3>
              </div>
              <ul className="space-y-1">
                {report.urgent_alerts.map((alert, i) => (
                  <li key={i} className="text-red-600 text-sm flex items-start gap-2">
                    <span className="mt-1">•</span>{alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.categories?.map((cat, i) => {
              const Icon = categoryIcon(cat.name)
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    </div>
                    <StatusBadge status={cat.status} />
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${cat.score}%`,
                          backgroundColor: cat.score >= 75 ? '#10b981' : cat.score >= 50 ? '#f59e0b' : '#ef4444'
                        }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-10 text-left">{cat.score}%</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{cat.details}</p>

                  {cat.recommendations?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">التوصيات:</p>
                      <ul className="space-y-1">
                        {cat.recommendations.map((rec, j) => (
                          <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-primary-500 mt-0.5">→</span>{rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Positive Points & Top Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.positive_points?.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-5">
                <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> النقاط الإيجابية
                </h3>
                <ul className="space-y-2">
                  {report.positive_points.map((p, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="mt-1">✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.top_recommendations?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-5">
                <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> أهم التوصيات
                </h3>
                <ul className="space-y-2">
                  {report.top_recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="font-bold">{i + 1}.</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center pb-4">
            ⚠️ هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي للمعلومات العامة فقط. لا يغني عن استشارة الطبيب المختص.
          </p>
        </div>
      )}

      {/* Email Export Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                إرسال الملف الطبي على الإيميل
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              سيتم إرسال الملف الطبي الكامل (PDF) إلى البريد الإلكتروني الذي تحدده.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !email}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    إرسال
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
