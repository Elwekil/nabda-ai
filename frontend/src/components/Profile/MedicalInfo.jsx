import { useState } from 'react'
import { Heart, Droplet, AlertTriangle, Save, Edit2 } from 'lucide-react'
import api from '../../services/api'
import Card from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import { BLOOD_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function MedicalInfo({ user }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    blood_type: user?.blood_type || '',
    chronic_conditions: user?.chronic_conditions || '',
    allergies: user?.allergies || ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/users/profile', formData)
      toast.success('تم تحديث المعلومات الطبية')
      setIsEditing(false)
    } catch (error) {
      toast.error('فشل في تحديث المعلومات')
    } finally {
      setLoading(false)
    }
  }

  const defaultUser = {
    blood_type: 'A+',
    chronic_conditions: 'ضغط الدم، السكري',
    allergies: 'البنسلين'
  }

  const data = user || defaultUser

  if (!isEditing) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">المعلومات الطبية</h2>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-primary-600">
            <Edit2 className="w-4 h-4" /> تعديل
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
            <Droplet className="w-5 h-5 text-red-500" />
            <div><p className="text-xs text-gray-500">فصيلة الدم</p><p className="text-gray-900 font-medium">{data.blood_type || 'غير محدد'}</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1"><p className="text-xs text-gray-500">الأمراض المزمنة</p><p className="text-gray-900">{data.chronic_conditions || 'لا توجد أمراض مزمنة مسجلة'}</p></div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <Heart className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1"><p className="text-xs text-gray-500">الحساسية</p><p className="text-gray-900">{data.allergies || 'لا توجد حساسية مسجلة'}</p></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6">تعديل المعلومات الطبية</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">فصيلة الدم</label>
          <select name="blood_type" value={formData.blood_type} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-xl">
            <option value="">اختر فصيلة الدم</option>
            {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الأمراض المزمنة</label>
          <textarea name="chronic_conditions" value={formData.chronic_conditions} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 border rounded-xl" placeholder="مثال: السكري، ارتفاع ضغط الدم..." />
          <p className="text-xs text-gray-400 mt-1">افصل بين الأمراض بفاصلة</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الحساسية</label>
          <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 border rounded-xl" placeholder="مثال: البنسلين، الفول السوداني..." />
          <p className="text-xs text-gray-400 mt-1">افصل بين أنواع الحساسية بفاصلة</p>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={loading}><Save className="w-4 h-4 ml-2" />حفظ التغييرات</Button>
          <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>إلغاء</Button>
        </div>
      </form>
    </Card>
  )
}