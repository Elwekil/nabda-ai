import { Brain, Sparkles, Loader2, AlertCircle, Zap, Upload, X, FileText, ChevronDown } from 'lucide-react'
import Card from '../common/Card'
import { useState, useEffect, useRef } from 'react'
import documentService from '../../services/documentService'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

const DOCUMENT_TYPES = [
  { value: 'lab_report', labelKey: 'documents.lab_report' },
  { value: 'xray', labelKey: 'documents.xray' },
  { value: 'prescription', labelKey: 'documents.prescription' },
  { value: 'medical_report', labelKey: 'documents.medical_report' },
  { value: 'unknown', labelKey: 'documents.other' },
]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const PRIORITY_COLORS = {
  high: 'text-red-700 bg-red-50 border-red-200',
  medium: 'text-orange-700 bg-orange-50 border-orange-200',
  low: 'text-green-700 bg-green-50 border-green-200',
}

export default function AIAnalysis({ document, onAnalysisComplete }) {
  const { t } = useLanguage()

  // Mode 2: existing document analysis
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  // Mode 1: local image upload
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [documentType, setDocumentType] = useState('unknown')
  const [localResult, setLocalResult] = useState(null)
  const [localAnalyzing, setLocalAnalyzing] = useState(false)
  const [localError, setLocalError] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (document) {
      setAnalysis(document.analysis || null)
      setError(null)
    } else {
      setAnalysis(null)
      setError(null)
    }
  }, [document])

  // ── Mode 2: existing document ──────────────────────────────────────────────

  const handleRunAnalysis = async () => {
    if (!document) return
    setAnalyzing(true)
    setError(null)
    try {
      const data = await documentService.analyze(document.id)
      setAnalysis(data.analysis)
      toast.success(t('ai_analysis.results'))
      onAnalysisComplete?.({ ...document, analysis: data.analysis })
    } catch (err) {
      const msg = err.response?.data?.message || t('ai_analysis.analysis_failed')
      setError(msg)
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Mode 1: local upload ───────────────────────────────────────────────────

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return t('ai_analysis.invalid_file_type')
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('ai_analysis.file_too_large')
    }
    return null
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setFileError(err)
      setSelectedFile(null)
    } else {
      setFileError(null)
      setSelectedFile(file)
      setLocalResult(null)
      setLocalError(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setLocalResult(null)
    setLocalError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLocalAnalyze = async () => {
    if (!selectedFile) return
    setLocalAnalyzing(true)
    setLocalError(null)
    setLocalResult(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)
      const res = await api.post('/documents/analyze-local', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Backend returns { success: true, data: {...} }, so we need res.data.data
      setLocalResult(res.data.data || res.data)
      toast.success(t('ai_analysis.results'))
    } catch (err) {
      const msg = err.response?.data?.message || t('ai_analysis.analysis_failed')
      setLocalError(msg)
      toast.error(msg)
    } finally {
      setLocalAnalyzing(false)
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  // تم حذف شريط مستوى الثقة بناءً على طلب المستخدم
  // const renderConfidenceBar = (confidence) => null

  const renderExtractedValues = (values, extractedText) => {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('ai_analysis.extracted_values')}</h4>
        {values?.length ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('ai_analysis.value_name')}</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('ai_analysis.value_value')}</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('ai_analysis.value_unit')}</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('ai_analysis.value_normal_range')}</th>
                </tr>
              </thead>
              <tbody>
                {values.map((v, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${v.isAbnormal ? 'bg-red-50' : ''}`}
                  >
                    <td className={`px-3 py-2 font-medium ${v.isAbnormal ? 'text-red-700' : 'text-gray-800'}`}>
                      {v.name}
                    {v.isAbnormal && <span className="ml-1 text-red-500">⚠</span>}
                  </td>
                  <td className={`px-3 py-2 ${v.isAbnormal ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                    {v.value}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{v.unit}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {v.normalRange
                      ? `${v.normalRange.min ?? ''}–${v.normalRange.max ?? ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-900 text-xs whitespace-pre-line">
            <strong>النص المستخرج من المستند:</strong>
            <div className="mt-2">{extractedText || 'لم يتم استخراج نص من المستند.'}</div>
          </div>
        )}
      </div>
    )
  }

  const renderTreatmentSuggestions = (suggestions) => {
    if (!suggestions?.length) return null
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('ai_analysis.treatment_suggestions')}</h4>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl border px-3 py-2 text-xs ${PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.low}`}
            >
              <span className="font-semibold capitalize">[{s.priority}]</span> {s.description}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWarnings = (warnings) => {
    if (!warnings?.length) return null
    return (
      <div className="mb-6 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">التحذيرات والملاحظات</h4>
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-3 bg-amber-50 border-r-4 border-amber-400 rounded-lg px-4 py-3 text-sm text-amber-900 shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
            <span className="leading-relaxed">{w}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderLocalResult = (result) => {
    const data = result?.data ?? result
    return (
      <div className="mt-6 space-y-6 bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">نتائج التحليل</h3>
        </div>

        {/* تم حذف شريط مستوى الثقة بناءً على طلب المستخدم */}
        {renderExtractedValues(data.extractedValues, data.extractedText)}
        
        {data.analysis && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">التحليل الطبي</h4>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-blue-100">
              {data.analysis}
            </div>
          </div>
        )}
        
        {renderTreatmentSuggestions(data.treatmentSuggestions)}
        {renderWarnings(data.warnings)}
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <p className="leading-relaxed">
              ⚠️ هذا التحليل مُنشأ بواسطة الذكاء الاصطناعي ويوفر معلومات عامة فقط. 
              لا يُغني عن استشارة طبيب مؤهل.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Upload section (Mode 1) ────────────────────────────────────────────────

  const renderUploadSection = () => (
    <div className="mb-6 border-b border-gray-100 pb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('ai_analysis.upload_for_analysis')}</h3>

      {/* File input */}
      {!selectedFile ? (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
          <Upload className="w-7 h-7 text-gray-400" />
          <span className="text-sm text-gray-500">{t('ai_analysis.choose_file')}</span>
          <span className="text-xs text-gray-400">JPEG, PNG, PDF — max 10MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 bg-primary-50 rounded-xl px-3 py-2">
          <FileText className="w-5 h-5 text-primary-600 shrink-0" />
          <span className="text-sm text-primary-700 truncate flex-1">{selectedFile.name}</span>
          <button onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {fileError && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {fileError}
        </p>
      )}

      {/* Document type selector */}
      <div className="mt-3 relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">{t('documents.document_type')}</label>
        <div className="relative">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {t(dt.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleLocalAnalyze}
        disabled={!selectedFile || localAnalyzing}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {localAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري التحليل...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            تحليل الصورة
          </>
        )}
      </button>

      {localError && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {localError}
        </div>
      )}

      {localResult && renderLocalResult(localResult)}
    </div>
  )

  // ── No document selected (show upload only) ────────────────────────────────

  if (!document) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">{t('ai_analysis.title')}</h2>
        </div>

        {renderUploadSection()}

        <div className="text-center py-4">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{t('ai_analysis.select_document')}</p>
        </div>
      </Card>
    )
  }

  // ── Document selected (Mode 2 + upload section) ────────────────────────────

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-bold text-gray-900">{t('ai_analysis.title')}</h2>
      </div>

      {renderUploadSection()}

      {/* Existing document info */}
      <div className="mb-4 p-3 bg-primary-50 rounded-xl">
        <p className="text-sm font-medium text-primary-700">{document.file_name}</p>
        <p className="text-xs text-gray-500 mt-1">{document.upload_date}</p>
      </div>

      {!analysis && !error && !analyzing && (
        <div className="text-center py-6">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <button onClick={handleRunAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm">
            <Zap className="w-4 h-4" />
            {t('ai_analysis.title')}
          </button>
        </div>
      )}

      {analyzing && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600 text-sm">{t('ai_analysis.analyzing')}</p>
        </div>
      )}

      {error && !analyzing && (
        <div className="text-center py-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button onClick={handleRunAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm">
            <Zap className="w-4 h-4" />{t('ai_analysis.retry')}
          </button>
        </div>
      )}

      {analysis && !analyzing && (
        <>
          <div className="bg-gray-50 rounded-xl p-4 max-h-[450px] overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{analysis}</div>
          </div>
          <button onClick={handleRunAnalysis} className="mt-3 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
            <Zap className="w-3 h-3" />{t('ai_analysis.retry')}
          </button>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">{t('ai_analysis.disclaimer')}</p>
          </div>
        </>
      )}
    </Card>
  )
}
