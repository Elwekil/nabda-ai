import { io } from 'socket.io-client'

let socket = null

export const initializeSocket = (userId) => {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
    })
    socket.on('connect', () => {
      console.log('Socket connected')
      if (userId) socket.emit('register', userId)
    })
  }
  return socket
}

export const getSocket = () => socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}