import { useState } from 'react'
import { Brain } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import MedicationAIAnalysis from './MedicationAIAnalysis'
import { useLanguage } from '../../context/LanguageContext'

export default function AddMedication({ isOpen, onClose, onSave }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '', dosage: '', frequency: 'daily', time_of_day: 'morning',
    start_date: '', end_date: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const frequencies = [
    { value: 'daily',        label: t('medications.daily') },
    { value: 'twice_daily',  label: t('medications.twice_daily') },
    { value: 'weekly',       label: t('medications.weekly') },
    { value: 'as_needed',    label: t('medications.as_needed') },
  ]

  const times = [
    { value: 'morning', label: t('medications.morning') },
    { value: 'afternoon',    label: t('medications.afternoon') },
    { value: 'evening', label: t('medications.evening') },
    { value: 'night',   label: t('medications.night') },
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (['name', 'dosage'].includes(e.target.name)) setShowAI(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      setFormData({ name: '', dosage: '', frequency: 'daily', time_of_day: 'morning', start_date: '', end_date: '', notes: '' })
      setShowAI(false)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('medications.add_medication')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('medications.medication_name')} name="name" value={formData.name} onChange={handleChange} required />
          <Input label={t('medications.dosage')} name="dosage" value={formData.dosage} onChange={handleChange} required />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('medications.frequency')}</label>
            <select name="frequency" value={formData.frequency} onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500">
              {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('medications.time_of_day')}</label>
            <select name="time_of_day" value={formData.time_of_day} onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500">
              {times.map(ti => <option key={ti.value} value={ti.value}>{ti.label}</option>)}
            </select>
          </div>

          <Input label={t('medications.start_date')} type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
          <Input label={t('medications.end_date')} type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('medications.notes')}</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500" />
        </div>

        {/* AI Analysis - hidden until AI is configured */}
        {false && formData.name && (
          <button type="button" onClick={() => setShowAI(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors text-sm font-medium">
            <Brain className="w-4 h-4" />
            {t('ai_analysis.title')}
          </button>
        )}

        {showAI && <MedicationAIAnalysis medicationData={formData} />}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>{t('common.save')}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </form>
    </Modal>
  )
}
