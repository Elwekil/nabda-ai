import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { User, Heart, Phone, Settings as SettingsIcon, Camera, Loader2 } from 'lucide-react'
import ProfileInfo from '../components/Profile/ProfileInfo'
import MedicalInfo from '../components/Profile/MedicalInfo'
import EmergencyContacts from '../components/Profile/EmergencyContacts'
import Settings from '../components/Profile/Settings'
import api from '../services/api'
import { getApiOrigin } from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  const tabs = [
    { id: 'profile',   label: t('profile.profile'),            icon: User },
    { id: 'medical',   label: t('profile.medical_info'),       icon: Heart },
    { id: 'emergency', label: t('profile.emergency_contacts'), icon: Phone },
    { id: 'settings',  label: t('profile.settings'),           icon: SettingsIcon },
  ]

  const handleImageClick = () => fileInputRef.current?.click()

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewImage(ev.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        const newImagePath = res.data.data.profile_image
        // Update user in context directly with new image
        const updatedUser = { ...user, profile_image: newImagePath }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        // Also refresh from server to get latest data
        await updateProfile({})
        toast.success('تم تحديث صورة الملف الشخصي')
      }
    } catch (err) {
      toast.error('فشل في رفع الصورة')
      setPreviewImage(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const avatarSrc = previewImage || (user?.profile_image ? `${getApiOrigin()}${user.profile_image}` : null)

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card text-center">
        {/* Avatar with upload */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div
            onClick={handleImageClick}
            className="w-24 h-24 rounded-full overflow-hidden cursor-pointer group relative"
            style={{ border: '3px solid var(--border)' }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              {uploadingImage
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />
              }
            </div>
          </div>
          {/* Camera badge */}
          <button
            onClick={handleImageClick}
            className="absolute bottom-0 left-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">{user?.full_name || ''}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{user?.city || ''}</p>
        <p style={{ color: 'var(--text-faint)' }} className="text-sm">{user?.age ? `${user.age} سنة` : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-primary-600 text-white' : 'hover:opacity-70'
              }`}
              style={activeTab === tab.id ? {} : { backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile'   && <ProfileInfo user={user} onUpdate={updateProfile} />}
      {activeTab === 'medical'   && <MedicalInfo user={user} />}
      {activeTab === 'emergency' && <EmergencyContacts />}
      {activeTab === 'settings'  && <Settings />}
    </div>
  )
}
