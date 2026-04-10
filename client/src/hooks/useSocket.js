import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    }
    socketRef.current = socketInstance
  }, [])

  return socketRef.current
}