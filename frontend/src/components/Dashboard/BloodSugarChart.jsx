import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronLeft } from 'lucide-react'

export default function BloodSugarChart({ data }) {
  const defaultData = [
    { day: 'السبت', value: 110 }, { day: 'الأحد', value: 125 }, { day: 'الإثنين', value: 118 },
    { day: 'الثلاثاء', value: 135 }, { day: 'الأربعاء', value: 122 }, { day: 'الخميس', value: 115 }, { day: 'الجمعة', value: 108 }
  ]
  const chartData = data || defaultData
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">مستويات سكر الدم</h2>
        <button className="text-primary-600 text-sm flex items-center gap-1">عرض جميع السجلات <ChevronLeft className="w-4 h-4" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-4">تحليل اتجاهات الذكاء الاصطناعي - آخر 7 أيام</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}