import { Bell, Calendar, Pill, X, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useState, useRef, useEffect } from 'react'

export default function NotificationPanel() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) markAllRead()
  }

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={handleOpen} className="p-2 rounded-lg hover:opacity-70 relative">
        <Bell style={{ color: 'var(--text-muted)' }} className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          className="absolute left-0 mt-2 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
        >
          <div style={{ borderBottom: '1px solid var(--border)' }} className="flex items-center justify-between px-4 py-3">
            <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">الإشعارات</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} style={{ color: 'var(--text-faint)' }} className="p-1 hover:opacity-70"><CheckCheck className="w-4 h-4" /></button>
                  <button onClick={clearAll} style={{ color: 'var(--text-faint)' }} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => setOpen(false)} style={{ color: 'var(--text-faint)' }} className="p-1 hover:opacity-70"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell style={{ color: 'var(--text-faint)' }} className="w-10 h-10 mx-auto mb-2" />
                <p style={{ color: 'var(--text-faint)' }} className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  style={{ borderBottom: '1px solid var(--border)', backgroundColor: !n.read ? 'rgba(59,130,246,0.05)' : 'transparent' }}
                  className="flex gap-3 px-4 py-3 hover:opacity-80 transition-opacity"
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${n.category === 'appointment' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {n.category === 'appointment'
                      ? <Calendar className="w-4 h-4 text-blue-600" />
                      : <Pill className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm leading-snug">{n.message}</p>
                    <p style={{ color: 'var(--text-faint)' }} className="text-xs mt-1">{formatTime(n.receivedAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
