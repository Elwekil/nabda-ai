import { useState } from 'react'
import { Phone, User, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'
import toast from 'react-hot-toast'

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'نورة محمد', relation: 'جهة اتصال', phone: '0501234567' },
    { id: 2, name: 'خالد علي', relation: 'طبيب العائلة', phone: '0557654321' },
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', relation: '', phone: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAdd = () => {
    if (!formData.name || !formData.relation || !formData.phone) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    setContacts([...contacts, { id: Date.now(), ...formData }])
    setFormData({ name: '', relation: '', phone: '' })
    setIsAdding(false)
    toast.success('تم إضافة جهة الاتصال')
  }

  const handleEdit = (contact) => {
    setEditingId(contact.id)
    setFormData({ name: contact.name, relation: contact.relation, phone: contact.phone })
  }

  const handleUpdate = () => {
    if (!formData.name || !formData.relation || !formData.phone) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    setContacts(contacts.map(c => c.id === editingId ? { ...c, ...formData } : c))
    setEditingId(null)
    setFormData({ name: '', relation: '', phone: '' })
    toast.success('تم تحديث جهة الاتصال')
  }

  const handleDelete = (id) => {
    setContacts(contacts.filter(c => c.id !== id))
    toast.success('تم حذف جهة الاتصال')
  }

  const relations = ['أب', 'أم', 'أخ', 'أخت', 'زوج', 'زوجة', 'صديق', 'طبيب', 'جهة اتصال']

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">جهات الاتصال للطوارئ</h2>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-primary-600">
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            {editingId === contact.id ? (
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="الاسم" className="px-3 py-1.5 border rounded-lg text-sm" />
                <select name="relation" value={formData.relation} onChange={handleChange} className="px-3 py-1.5 border rounded-lg text-sm">
                  <option value="">القرابة</option>
                  {relations.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف" className="px-3 py-1.5 border rounded-lg text-sm" />
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary-600" /></div>
                <div><p className="font-medium text-gray-900">{contact.name}</p><p className="text-xs text-gray-500">{contact.relation} • {contact.phone}</p></div>
              </div>
            )}
            <div className="flex gap-2">
              {editingId === contact.id ? (
                <>
                  <button onClick={handleUpdate} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEdit(contact)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(contact.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="text-center py-8">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">لا توجد جهات اتصال للطوارئ</p>
            <button onClick={() => setIsAdding(true)} className="text-primary-600 text-sm mt-2">أضف جهة اتصال</button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">إضافة جهة اتصال</h3>
              <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="الاسم" className="w-full px-4 py-2.5 border rounded-xl" />
              <select name="relation" value={formData.relation} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-xl">
                <option value="">اختر القرابة</option>
                {relations.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف" className="w-full px-4 py-2.5 border rounded-xl" />
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleAdd}>إضافة</Button>
              <Button variant="secondary" onClick={() => setIsAdding(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}