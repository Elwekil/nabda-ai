import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        className={`rounded-2xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div
          style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
          className="sticky top-0 p-4 flex justify-between items-center"
        >
          <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            className="p-1 hover:opacity-70 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
