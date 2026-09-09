import { FileText, Pill, Calendar, ChevronLeft } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function RecentActivity({ activities }) {
  const { t } = useLanguage()

  const defaultActivities = [
    { type: 'document',    title: t('nav.documents'),    time: '' },
    { type: 'medication',  title: t('nav.medications'),  time: '' },
    { type: 'appointment', title: t('nav.appointments'), time: '' },
  ]

  const items = activities || defaultActivities

  const getIcon = (type) => {
    if (type === 'document')   return FileText
    if (type === 'medication') return Pill
    return Calendar
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('dashboard.recent_activity')}</h2>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const Icon = getIcon(item.type)
          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                {item.time && <p className="text-xs text-gray-500">{item.time}</p>}
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
