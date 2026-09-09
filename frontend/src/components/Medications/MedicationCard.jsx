import { Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import Card from '../common/Card'

export default function MedicationCard({ medication, onUpdateStatus, onDelete }) {
  const getStatusBadge = () => {
    switch (medication.status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">نشط</span>
      case 'completed': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">مكتمل</span>
      case 'paused': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">متوقف</span>
      default: return null
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600 text-sm">{medication.dosage} • {medication.frequency}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>الجرعة القادمة: {medication.time}</span>
          </div>
          {medication.notes && (
            <p className="text-xs text-gray-400 mt-2">{medication.notes}</p>
          )}
        </div>
        <div className="flex gap-2">
          {medication.status === 'active' && (
            <>
              <button onClick={() => onUpdateStatus?.('completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="تم التناول">
                <CheckCircle className="w-5 h-5" />
              </button>
              <button onClick={() => onUpdateStatus?.('paused')} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="إيقاف مؤقت">
                <AlertCircle className="w-5 h-5" />
              </button>
            </>
          )}
          {(medication.status === 'paused' || medication.status === 'completed') && (
            <button onClick={() => onUpdateStatus?.('active')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="إعادة تفعيل">
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  )
}