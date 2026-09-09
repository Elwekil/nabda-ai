import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Save, Edit2 } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'

export default function ProfileInfo({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    age: user?.age || '',
    city: user?.city || ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdate?.(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update:', error)
    } finally {
      setLoading(false)
    }
  }

  const defaultUser = {
    full_name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '05XXXXXXXXX',
    age: '35',
    city: 'الرياض'
  }

  const data = user || defaultUser

  if (!isEditing) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">الملف الشخصي</h2>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <Edit2 className="w-4 h-4" /> تعديل
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">الاسم الكامل</p><p className="text-gray-900">{data.full_name || 'غير محدد'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">البريد الإلكتروني</p><p className="text-gray-900">{data.email || 'غير محدد'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Phone className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">رقم الهاتف</p><p className="text-gray-900">{data.phone || 'غير محدد'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">العمر</p><p className="text-gray-900">{data.age || 'غير محدد'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">المدينة</p><p className="text-gray-900">{data.city || 'غير محدد'}</p></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6">تعديل الملف الشخصي</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="الاسم الكامل" name="full_name" value={formData.full_name} onChange={handleChange} required />
        <Input label="رقم الهاتف" name="phone" value={formData.phone} onChange={handleChange} />
        <Input label="العمر" type="number" name="age" value={formData.age} onChange={handleChange} />
        <Input label="المدينة" name="city" value={formData.city} onChange={handleChange} />
        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={loading}><Save className="w-4 h-4 ml-2" />حفظ التغييرات</Button>
          <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>إلغاء</Button>
        </div>
      </form>
    </Card>
  )
}