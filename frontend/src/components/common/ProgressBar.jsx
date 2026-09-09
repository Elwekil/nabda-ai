export default function ProgressBar({ value, max = 100, showLabel = false, labelPosition = 'right' }) {
  const percentage = (value / max) * 100
  return (
    <div className="w-full">
      {showLabel && labelPosition === 'right' && <div className="flex justify-between items-center mb-1"><span className="text-sm text-gray-600">{Math.round(percentage)}%</span></div>}
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>
    </div>
  )
}