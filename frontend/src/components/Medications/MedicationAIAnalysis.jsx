import { Brain, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useState, useEffect } from 'react'

export default function MedicationAIAnalysis({ medicationData }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    runAnalysis()
  }, [])

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/medications/analyze', medicationData)
      setAnalysis(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في تحليل الدواء')
    } finally {
      setLoading(false)
    }
  }

  const getEffectivenessColor = (pct) => {
    if (pct >= 75) return 'text-green-600'
    if (pct >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEffectivenessBar = (pct) => {
    if (pct >= 75) return 'bg-green-500'
    if (pct >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">تحليل الذكاء الاصطناعي للدواء</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-4 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span className="text-sm">جاري تحليل الدواء...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={runAnalysis} className="mr-auto text-xs underline">إعادة</button>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-3">
          {/* Suitability */}
          <div className={`flex items-center gap-2 p-3 rounded-xl ${analysis.is_suitable ? 'bg-green-50' : 'bg-red-50'}`}>
            {analysis.is_suitable
              ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            }
            <div>
              <p className={`text-sm font-medium ${analysis.is_suitable ? 'text-green-700' : 'text-red-700'}`}>
                {analysis.is_suitable ? 'الدواء مناسب لك' : 'الدواء غير مناسب لك'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{analysis.suitability_reason}</p>
            </div>
          </div>

          {/* Effectiveness */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">نسبة الفعالية المتوقعة</span>
              <span className={`text-lg font-bold ${getEffectivenessColor(analysis.effectiveness_percentage)}`}>
                {analysis.effectiveness_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getEffectivenessBar(analysis.effectiveness_percentage)}`}
                style={{ width: `${analysis.effectiveness_percentage}%` }}
              />
            </div>
          </div>

          {/* Warnings */}
          {analysis.warnings?.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-xl">
              <p className="text-xs font-medium text-yellow-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> تحذيرات
              </p>
              <ul className="space-y-1">
                {analysis.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-800">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {analysis.alternatives?.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-medium text-blue-700 mb-2">بدائل مقترحة</p>
              <div className="space-y-2">
                {analysis.alternatives.map((alt, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-xs font-semibold text-blue-800 min-w-fit">{alt.name}</span>
                    <span className="text-xs text-blue-600">— {alt.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.general_notes && (
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">{analysis.general_notes}</p>
          )}

          <p className="text-xs text-gray-400">⚠️ هذا التحليل للمعلومات العامة فقط ولا يغني عن استشارة الطبيب أو الصيدلاني.</p>
        </div>
      )}
    </div>
  )
}
