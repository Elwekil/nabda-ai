import { Bell, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Button from '../common/Button'

export default function WelcomeBanner({ user }) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleAIDiagnosis = () => {
    navigate('/ai-chatbot')
  }

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {t('dashboard.welcome')}, {user?.full_name?.split(' ')[0] || ''}
          </h1>
          <p className="text-primary-100 mb-4">{t('dashboard.welcome_message')}</p>
          <Button 
            onClick={handleAIDiagnosis}
            className="bg-white text-primary-600 hover:bg-primary-50 flex items-center gap-2"
          >
            <Bot className="w-5 h-5" />
            {t('nav.ai_chatbot')}
          </Button>
        </div>
        <div className="bg-white/20 rounded-full p-3"><Bell className="w-6 h-6" /></div>
      </div>
    </div>
  )
}
