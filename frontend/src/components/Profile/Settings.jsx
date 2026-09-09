import { useState } from 'react'
import { Bell, Moon, Globe, LogOut, Trash2, Lock, Smartphone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import Card from '../common/Card'
import toast from 'react-hot-toast'

export default function Settings() {
  const { logout } = useAuth()
  const { language, changeLanguage, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()

  const [notifications, setNotifications] = useState(true)
  const [biometric, setBiometric] = useState(false)

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] })
  }

  const handleLanguageChange = (lang) => {
    changeLanguage(lang)
    toast.success(lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English')
  }

  const handleDeleteAccount = () => {
    if (confirm(t('settings.deleteAccountConfirm'))) {
      toast.error(t('settings.deletingAccount'))
    }
  }

  const SettingRow = ({ icon: Icon, title, description, control }) => (
    <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {control}
    </div>
  )

  const ToggleButton = ({ enabled, onClick }) => (
    <button onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('settings.title') || t('profile.settings')}</h2>
        <div className="space-y-2">
          <SettingRow icon={Bell} title={t('settings.notifications')} description={t('settings.notifications_desc')}
            control={<ToggleButton enabled={notifications} onClick={() => { setNotifications(p => !p); toast.success(notifications ? t('settings.notifications_disabled') : t('settings.notifications_enabled')) }} />} />
          <SettingRow icon={Moon} title={t('settings.dark_mode')} description={t('settings.dark_mode_desc')}
            control={<ToggleButton enabled={isDark} onClick={() => { toggleTheme(); toast.success(isDark ? t('settings.dark_mode_disabled') : t('settings.dark_mode_enabled')) }} />} />
          <SettingRow icon={Smartphone} title={t('settings.biometric')} description={t('settings.biometric_desc')}
            control={<ToggleButton enabled={biometric} onClick={() => { setBiometric(p => !p); toast.success(biometric ? t('settings.biometric_disabled') : t('settings.biometric_enabled')) }} />} />
          <SettingRow icon={Globe} title={t('settings.language')} description={t('settings.language_desc')}
            control={
              <div className="flex gap-2">
                <button onClick={() => changeLanguage('ar')}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${language === 'ar' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  العربية
                </button>
                <button onClick={() => changeLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${language === 'en' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  English
                </button>
              </div>
            } />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('settings.security')}</h2>
        <div className="space-y-2">
          <button className="flex items-center gap-3 w-full py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Lock className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.change_password')}</span>
          </button>
          <button onClick={logout}
            className="flex items-center gap-3 w-full py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600">
            <LogOut className="w-5 h-5" />
            <span>{t('settings.logout')}</span>
          </button>
          <button onClick={() => { if (confirm(t('settings.delete_account_confirm'))) toast.error(t('settings.deleting_account')) }}
            className="flex items-center gap-3 w-full py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 border-t dark:border-gray-700 pt-3">
            <Trash2 className="w-5 h-5" />
            <span>{t('settings.delete_account')}</span>
          </button>
        </div>
      </Card>
    </div>
  )
}