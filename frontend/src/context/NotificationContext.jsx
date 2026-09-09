import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { getApiOrigin } from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [socket, setSocket] = useState(null)

  const addNotification = useCallback((notif) => {
    const entry = { ...notif, id: Date.now(), read: false, receivedAt: new Date() }
    setNotifications(prev => [entry, ...prev].slice(0, 50)) // keep last 50
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const s = io(getApiOrigin(), { transports: ['websocket'] })

    s.on('connect', () => {
      s.emit('register', String(user.id))
    })

    s.on('appointment_reminder', (data) => {
      addNotification({ ...data, category: 'appointment' })
      toast(data.message, {
        icon: '📅',
        duration: 8000,
        style: { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }
      })
    })

    s.on('medication_reminder', (data) => {
      addNotification({ ...data, category: 'medication' })
      toast(data.message, {
        icon: '💊',
        duration: 8000,
        style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }
      })
    })

    setSocket(s)
    return () => s.disconnect()
  }, [isAuthenticated, user, addNotification])

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const clearAll = () => setNotifications([])
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll, socket }}>
      {children}
    </NotificationContext.Provider>
  )
}
