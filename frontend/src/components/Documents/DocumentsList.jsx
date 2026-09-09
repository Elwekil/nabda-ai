import { useState } from 'react'
import { FileText, FileImage, File, Trash2, Eye, Calendar, X, Brain } from 'lucide-react'
import Card from '../common/Card'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { getApiOrigin } from '../../services/api'

const BASE_URL = getApiOrigin()

export default function DocumentsList({ documents, onDelete, onViewAnalysis }) {
  const [deleteId, setDeleteId] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)

  const isImage = (type) => type?.includes('image')

  const getFileIcon = (type) => {
    if (isImage(type)) return <FileImage className="w-8 h-8 text-blue-500" />
    if (type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const getDocumentTypeText = (type) => {
    const map = {
      lab_report: 'تقرير مخبري', prescription: 'روشتة',
      xray: 'أشعة', medical_report: 'تقرير طبي'
    }
    return map[type] || 'مستند طبي'
  }

  const handleEyeClick = (doc) => {
    if (isImage(doc.file_type)) {
      setPreviewDoc(doc)
    } else {
      onViewAnalysis?.(doc)
    }
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p style={{ color: 'var(--text-muted)' }}>لا توجد مستندات مضافة</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getFileIcon(doc.file_type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">{doc.file_name}</h3>
                <span style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }} className="px-2 py-0.5 rounded-full text-xs">
                  {getDocumentTypeText(doc.document_type)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {doc.upload_date}
                </span>
                <span>{doc.file_type?.split('/').pop()?.toUpperCase() || 'ملف'}</span>
              </div>
              {doc.ai_analysis && (
                <div className="mt-2 p-2 bg-primary-50 rounded-lg">
                  <span className="text-primary-700 text-xs font-medium">تحليل الذكاء الاصطناعي:</span>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{doc.ai_analysis.substring(0, 100)}...</p>
                  <button onClick={() => onViewAnalysis?.(doc)} className="text-primary-600 text-xs mt-1 hover:underline">
                    عرض التحليل الكامل
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEyeClick(doc)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={isImage(doc.file_type) ? 'عرض الصورة' : 'تحليل AI'}
              >
                <Eye className="w-4 h-4" />
              </button>
              {/* AI analysis button for images */}
              {isImage(doc.file_type) && (
                <button
                  onClick={() => onViewAnalysis?.(doc)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="تحليل AI"
                >
                  <Brain className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setDeleteId(doc.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {/* Image Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute -top-10 left-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
            <div style={{ backgroundColor: 'var(--bg-card)' }} className="rounded-2xl overflow-hidden shadow-2xl">
              <div style={{ borderBottom: '1px solid var(--border)' }} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{previewDoc.file_name}</p>
                  <p style={{ color: 'var(--text-faint)' }} className="text-xs">{getDocumentTypeText(previewDoc.document_type)} • {previewDoc.upload_date}</p>
                </div>
                <button
                  onClick={() => { setPreviewDoc(null); onViewAnalysis?.(previewDoc) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 transition-colors"
                >
                  <Brain className="w-3.5 h-3.5" />
                  تحليل AI
                </button>
              </div>
              <div className="p-2 flex items-center justify-center" style={{ maxHeight: '75vh' }}>
                <img
                  src={`${BASE_URL}${previewDoc.file_path}`}
                  alt={previewDoc.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{ maxHeight: '70vh' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div style={{ display: 'none' }} className="flex-col items-center justify-center py-16 text-gray-400">
                  <FileImage className="w-16 h-16 mb-3" />
                  <p className="text-sm">تعذر تحميل الصورة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="تأكيد الحذف">
        <p style={{ color: 'var(--text-secondary)' }} className="mb-6">هل أنت متأكد من حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => { onDelete?.(deleteId); setDeleteId(null); }}>حذف</Button>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>إلغاء</Button>
        </div>
      </Modal>
    </div>
  )
}
