import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLanguage } from '../../context/LanguageContext'

export default function AdherenceChart({ medications }) {
  const { t } = useLanguage()

  const activeCount    = medications.filter(m => m.status === 'active').length
  const completedCount = medications.filter(m => m.status === 'completed').length
  const pausedCount    = medications.filter(m => m.status === 'paused').length

  const data = [
    { name: t('medications.active'),    value: activeCount,    color: '#10b981' },
    { name: t('medications.completed'), value: completedCount, color: '#3b82f6' },
    { name: t('medications.paused'),    value: pausedCount,    color: '#f59e0b' },
  ]

  if (medications.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('medications.adherence_rate')}</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">{t('medications.no_medications')}</p>
        </div>
      </div>
    )
  }

  const adherence = Math.round((completedCount / medications.length) * 100)

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('medications.adherence_rate')}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {t('medications.total_medications')}: <strong className="text-gray-900">{medications.length}</strong>
        </p>
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: `${adherence}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('medications.adherence_rate')}: {adherence}%</p>
      </div>
    </div>
  )
}
