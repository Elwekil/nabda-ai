import { useState } from 'react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { useLanguage } from '../../context/LanguageContext'

export default function AddAppointment({ isOpen, onClose, onSave }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    doctor_name: '', doctor_specialty: '', clinic_name: '',
    clinic_address: '', appointment_date: '', appointment_time: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      setFormData({ doctor_name: '', doctor_specialty: '', clinic_name: '', clinic_address: '', appointment_date: '', appointment_time: '', notes: '' })
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('appointments.add_appointment')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('appointments.doctor_name')}      name="doctor_name"      value={formData.doctor_name}      onChange={handleChange} required />
          <Input label={t('appointments.doctor_specialty')} name="doctor_specialty" value={formData.doctor_specialty} onChange={handleChange} />
          <Input label={t('appointments.clinic_name')}      name="clinic_name"      value={formData.clinic_name}      onChange={handleChange} />
          <Input label={t('appointments.clinic_address')}   name="clinic_address"   value={formData.clinic_address}   onChange={handleChange} />
          <Input label={t('appointments.appointment_date')} type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} required />
          <Input label={t('appointments.appointment_time')} type="time" name="appointment_time" value={formData.appointment_time} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={loading}>{t('common.save')}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}
