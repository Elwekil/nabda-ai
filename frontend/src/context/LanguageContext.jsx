import { createContext, useContext, useState, useEffect } from 'react'
import ar from '../i18n/ar.json'
import en from '../i18n/en.json'

const translations = { ar, en }

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'ar'
  })

  const [tData, setTData] = useState(() => translations[language])

  useEffect(() => {
    localStorage.setItem('language', language)
    setTData(translations[language])
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  // t('nav.dashboard') => يدعم nested keys
  const t = (key) => {
    const keys = key.split('.')
    let value = tData
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // fallback to key if not found
      }
    }
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}