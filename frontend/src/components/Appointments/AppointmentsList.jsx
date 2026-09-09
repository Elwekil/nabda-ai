import { useState } from 'react'
import { Calendar, Clock, MapPin, Stethoscope, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Card from '../common/Card'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useLanguage } from '../../context/LanguageContext'

export default function AppointmentsList({ appointments, onUpdateStatus, onDelete }) {
  const { t } = useLanguage()
  const [deleteId, setDeleteId] = useState(null)

  const getStatusBadge = (status) => {
    const map = {
      upcoming:  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{t('appointments.upcoming')}</span>,
      completed: <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{t('appointments.completed')}</span>,
      cancelled: <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{t('appointments.cancelled')}</span>,
    }
    return map[status] || <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('appointments.no_appointments')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('appointments.no_appointments_hint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{apt.doctor_name}</h3>
                {getStatusBadge(apt.status)}
              </div>
              {apt.doctor_specialty && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>{apt.doctor_specialty}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" /><span>{apt.appointment_date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" /><span>{apt.appointment_time}</span>
                </div>
                {apt.clinic_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" /><span>{apt.clinic_name}</span>
                  </div>
                )}
              </div>
              {apt.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">{t('common.notes')}:</span> {apt.notes}
                </div>
              )}
            </div>
            <div className="flex gap-2 mr-4">
              {apt.status === 'upcoming' && (
                <>
                  <button onClick={() => onUpdateStatus?.(apt.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title={t('appointments.mark_completed')}>
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => onUpdateStatus?.(apt.id, 'cancelled')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t('appointments.cancel')}>
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={() => setDeleteId(apt.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t('common.delete')}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title={t('common.confirm')}>
        <p className="text-gray-600 mb-6">{t('common.confirm_delete')}</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => { onDelete?.(deleteId); setDeleteId(null); }}>{t('common.delete')}</Button>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
        </div>
      </Modal>
    </div>
  )
}
