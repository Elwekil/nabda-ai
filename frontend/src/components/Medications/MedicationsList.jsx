import { useState } from 'react'
import { Pill, Clock, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import Card from '../common/Card'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useLanguage } from '../../context/LanguageContext'

export default function MedicationsList({ medications, onUpdateStatus, onDelete }) {
  const { t } = useLanguage()
  const [deleteId, setDeleteId] = useState(null)

  const getStatusBadge = (status) => {
    const map = {
      active:    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{t('medications.active')}</span>,
      completed: <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{t('medications.completed')}</span>,
      paused:    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">{t('medications.paused')}</span>,
    }
    return map[status] || <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  if (!medications || medications.length === 0) {
    return (
      <div className="text-center py-12">
        <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('medications.no_medications')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('medications.no_medications_hint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {medications.map((med) => (
        <Card key={med.id}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{med.name}</h3>
                {getStatusBadge(med.status)}
              </div>
              <p className="text-gray-600 text-sm">{med.dosage} • {med.frequency}</p>
              {med.time_of_day && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{t('medications.next_dose')}: {t(`medications.${med.time_of_day}`) || med.time_of_day}</span>
                </div>
              )}
              {med.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">{t('common.notes')}:</span> {med.notes}
                </div>
              )}
            </div>
            <div className="flex gap-2 mr-4">
              {med.status === 'active' && (
                <>
                  <button onClick={() => onUpdateStatus?.(med.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title={t('medications.take_now')}>
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => onUpdateStatus?.(med.id, 'paused')} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title={t('medications.pause')}>
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {(med.status === 'paused' || med.status === 'completed') && (
                <button onClick={() => onUpdateStatus?.(med.id, 'active')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('medications.reactivate')}>
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setDeleteId(med.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t('common.delete')}>
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
