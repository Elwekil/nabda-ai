export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' }
  const spinner = <div className="flex items-center justify-center"><div className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} /></div>
  if (fullScreen) return <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">{spinner}</div>
  return spinner
}