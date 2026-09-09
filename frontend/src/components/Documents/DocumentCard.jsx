import { FileText, FileImage, File, Eye, Trash2, Calendar, Download } from 'lucide-react'
import Card from '../common/Card'

export default function DocumentCard({ document, onDelete, onViewAnalysis, onDownload }) {
  const getFileIcon = () => {
    if (document.file_type?.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />
    if (document.file_type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const getDocumentTypeText = (type) => {
    switch (type) {
      case 'lab_report': return 'تقرير مخبري'
      case 'prescription': return 'روشتة'
      case 'xray': return 'أشعة'
      case 'medical_report': return 'تقرير طبي'
      default: return 'مستند طبي'
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{getFileIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{document.file_name}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {getDocumentTypeText(document.document_type)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{document.upload_date}</span>
            <span>{document.file_type?.split('/').pop()?.toUpperCase() || 'ملف'}</span>
          </div>
          {document.ai_analysis && (
            <div className="mt-2 p-2 bg-primary-50 rounded-lg text-sm">
              <span className="text-primary-700 font-medium">تحليل الذكاء الاصطناعي:</span>
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{document.ai_analysis.substring(0, 100)}...</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onViewAnalysis?.(document)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="تحليل AI">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={onDownload} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="تحميل">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}