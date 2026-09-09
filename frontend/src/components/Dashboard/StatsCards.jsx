import { Calendar, Pill, FileText, Droplet } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function StatsCards({ stats }) {
  const { t } = useLanguage()

  const cards = [
    { icon: Calendar, label: t('stats.next_appointment'),   value: stats?.upcomingAppointments ?? 0 },
    { icon: Pill,     label: t('stats.active_medications'), value: stats?.activeMedications ?? 0 },
    { icon: Droplet,  label: t('stats.blood_type'),         value: stats?.bloodType || 'A+' },
    { icon: FileText, label: t('stats.documents'),          value: stats?.recentDocuments ?? 0 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="stat-card">
          <card.icon className="w-6 h-6 text-primary-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          <p className="text-sm text-gray-600">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
