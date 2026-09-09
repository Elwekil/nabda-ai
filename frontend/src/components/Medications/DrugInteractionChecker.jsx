import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const severityConfig = {
  mild:     { bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', label: 'خفيف' },
  moderate: { bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', label: 'متوسط' },
  severe:   { bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    label: 'خطير' },
  critical: { bg: 'bg-red-100',    border: 'border-red-300',    text: 'text-red-800',    badge: 'bg-red-200 text-red-800',    label: 'حرج' },
  none:     { bg: 'bg-green-50',   border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700', label: 'لا يوجد' },
  // legacy mappings
  high:     { bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    label: 'خطير' },
  medium:   { bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', label: 'متوسط' },
  low:      { bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', label: 'خفيف' },
}

export default function DrugInteractionChecker({ medications = [] }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  const checkInteractions = async () => {
    if (medications.length < 2) {
      setResult(null)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/medications/check-interactions-local', { medications })
      const payload = data.data ?? data
      setResult(payload)
      if (payload.hasInteractions) {
        toast.error('⚠️ تم اكتشاف تعارض بين الأدوية!')
      } else {
        toast.success('✅ لا يوجد تعارض بين أدويتك')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في فحص التعارضات')
    } finally {
      setLoading(false)
    }
  }

  // Auto-trigger when medications list changes
  useEffect(() => {
    checkInteractions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-900">فحص التعارض الدوائي</h3>
        </div>
        <button
          onClick={checkInteractions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-60 text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'جاري الفحص...' : 'فحص الآن'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">يفحص التعارضات بين جميع أدويتك النشطة باستخدام الذكاء الاصطناعي</p>

      {medications.length < 2 && !loading && (
        <p className="text-sm text-gray-400 text-center py-4">أضف دواءين أو أكثر لفحص التعارضات</p>
      )}

      {result && (
        <div className="space-y-3">
          {/* Overall status */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${result.hasInteractions ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            {result.hasInteractions
              ? <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              : <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            }
            <div>
              <p className={`font-semibold text-sm ${result.hasInteractions ? 'text-red-700' : 'text-green-700'}`}>
                {result.hasInteractions
                  ? `تم اكتشاف ${result.interactions?.length || 0} تعارض`
                  : 'لا يوجد تعارض بين أدويتك'}
              </p>
              {result.generalAdvice && (
                <p className="text-xs text-gray-600 mt-0.5">{result.generalAdvice}</p>
              )}
            </div>
          </div>

          {/* Interactions list */}
          {result.interactions?.map((inter, i) => {
            const cfg = severityConfig[inter.severity] || severityConfig.mild
            return (
              <div key={i} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${cfg.text}`}>
                    {inter.drug1} ↔ {inter.drug2}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>

                {inter.description && (
                  <p className={`text-xs ${cfg.text} mb-1`}>{inter.description}</p>
                )}

                {inter.effects?.length > 0 && (
                  <ul className="text-xs text-gray-600 list-disc list-inside mb-1 space-y-0.5">
                    {inter.effects.map((effect, j) => (
                      <li key={j}>{effect}</li>
                    ))}
                  </ul>
                )}

                {inter.recommendation && (
                  <p className="text-xs text-gray-600 bg-white/60 rounded-lg px-2 py-1">
                    💡 {inter.recommendation}
                  </p>
                )}
              </div>
            )
          })}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">التوصيات:</p>
              <ul className="text-xs text-blue-600 list-disc list-inside space-y-0.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives section — shown when safeToTake is false */}
          {result.safeToTake === false && result.alternatives?.length > 0 && (
            <div className="border border-purple-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAlternatives(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-700 text-sm font-semibold"
              >
                <span>💊 بدائل آمنة مقترحة ({result.alternatives.length})</span>
                {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAlternatives && (
                <div className="divide-y divide-purple-100">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="px-3 py-2 bg-white">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="line-through text-gray-400">{alt.originalDrug}</span>
                          {' → '}
                          <span className="text-purple-700">{alt.alternativeDrug}</span>
                        </p>
                        {alt.effectivenessPercentage != null && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            {alt.effectivenessPercentage}% فعالية
                          </span>
                        )}
                      </div>
                      {alt.reason && (
                        <p className="text-xs text-gray-500">{alt.reason}</p>
                      )}
                      {alt.sideEffects?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          الآثار الجانبية: {alt.sideEffects.join('، ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400">⚠️ هذا الفحص للمعلومات العامة فقط. استشر طبيبك أو صيدلانيك.</p>
        </div>
      )}
    </div>
  )
}
