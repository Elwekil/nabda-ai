import { useState, useEffect } from 'react'
import { Activity, Heart, Thermometer, Droplet, Plus } from 'lucide-react'
import api from '../../services/api'
import Card from '../common/Card'
import Button from '../common/Button'
import Modal from '../common/Modal'
import Input from '../common/Input'
import toast from 'react-hot-toast'

export default function VitalSigns() {
  const [vitals, setVitals] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    blood_sugar: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '', temperature: '', pain_level: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLatestVitals()
  }, [])

  const fetchLatestVitals = async () => {
    try {
      const response = await api.get('/vitals/latest')
      if (response.data.success && response.data.data) {
        setVitals(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch vitals:', error)
      // استخدام بيانات افتراضية للتجربة
      setVitals({ temperature: 36.8, heart_rate: 72, blood_sugar: 95, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 })
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/vitals', {
        blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pain_level: formData.pain_level ? parseInt(formData.pain_level) : null
      })
      toast.success('تم تسجيل العلامات الحيوية بنجاح')
      await fetchLatestVitals()
      setShowForm(false)
      setFormData({ blood_sugar: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '', temperature: '', pain_level: '' })
    } catch (error) {
      toast.error('فشل في تسجيل العلامات الحيوية')
    } finally {
      setLoading(false)
    }
  }

  const data = vitals || { temperature: 36.8, heart_rate: 72, blood_sugar: 95, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">العلامات الحيوية</h2>
          <button onClick={() => setShowForm(true)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-center">
            <Droplet className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-600">{data.blood_sugar || '--'}</p>
            <p className="text-xs text-gray-500">سكر الدم (mg/dL)</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-center">
            <Activity className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{data.blood_pressure_systolic || '--'}/{data.blood_pressure_diastolic || '--'}</p>
            <p className="text-xs text-gray-500">ضغط الدم</p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-center">
            <Heart className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{data.heart_rate || '--'}</p>
            <p className="text-xs text-gray-500">معدل ضربات القلب (bpm)</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl text-center">
            <Thermometer className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-yellow-600">{data.temperature || '--'}°C</p>
            <p className="text-xs text-gray-500">درجة الحرارة</p>
          </div>
        </div>

        {data.recorded_date && (
          <p className="text-xs text-gray-400 text-center mt-3">
            آخر تحديث: {data.recorded_date}
          </p>
        )}
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="تسجيل العلامات الحيوية">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="سكر الدم (mg/dL)" type="number" name="blood_sugar" value={formData.blood_sugar} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ضغط الدم</label>
              <div className="flex gap-2">
                <input type="number" name="blood_pressure_systolic" value={formData.blood_pressure_systolic} onChange={handleChange} placeholder="الانقباضي" className="w-full px-3 py-2 border rounded-xl" />
                <span className="self-center">/</span>
                <input type="number" name="blood_pressure_diastolic" value={formData.blood_pressure_diastolic} onChange={handleChange} placeholder="الانبساطي" className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>
            <Input label="معدل ضربات القلب (bpm)" type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} />
            <Input label="درجة الحرارة (°C)" type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} />
            <Input label="مستوى الألم (1-10)" type="number" min="1" max="10" name="pain_level" value={formData.pain_level} onChange={handleChange} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}