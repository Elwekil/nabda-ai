import { useLanguage } from '../../context/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage()

  return (
    <button
      onClick={() => changeLanguage(language === 'ar' ? 'en' : 'ar')}
      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-70 transition-opacity"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-semibold">
        {language === 'ar' ? 'EN' : 'عر'}
      </span>
    </button>
  )
}
