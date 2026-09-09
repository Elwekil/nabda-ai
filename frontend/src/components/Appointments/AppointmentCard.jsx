import { Calendar, Clock, MapPin, User, Stethoscope, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Card from '../common/Card'

export default function AppointmentCard({ appointment, onUpdateStatus, onDelete }) {
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'upcoming': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">قادم</span>
      case 'completed': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">مكتمل</span>
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">ملغي</span>
      default: return null
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{appointment.doctor_name}</h3>
            {getStatusBadge()}
          </div>
          {appointment.doctor_specialty && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Stethoscope className="w-4 h-4" />
              <span>{appointment.doctor_specialty}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{appointment.appointment_date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{appointment.appointment_time}</span>
            </div>
            {appointment.clinic_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{appointment.clinic_name}</span>
              </div>
            )}
            {appointment.clinic_address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{appointment.clinic_address}</span>
              </div>
            )}
          </div>
          {appointment.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium">ملاحظات:</span> {appointment.notes}
            </div>
          )}
        </div>
        <div className="flex gap-2 mr-4">
          {appointment.status === 'upcoming' && (
            <>
              <button onClick={() => onUpdateStatus?.('completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="تحديد كمكتمل">
                <CheckCircle className="w-5 h-5" />
              </button>
              <button onClick={() => onUpdateStatus?.('cancelled')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="إلغاء">
                <XCircle className="w-5 h-5" />
              </button>
            </>
          )}
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  )
}