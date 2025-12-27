import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      // Notification events
      newSocket.on('notification', (data) => {
        toast(data.message, {
          icon: '🔔',
          duration: 4000,
        })
      })

      // Task events
      newSocket.on('taskCreated', (task) => {
        toast.success(`New task: ${task.title}`)
      })

      newSocket.on('taskUpdated', (task) => {
        toast(`Task updated: ${task.title}`, {
          icon: '✏️',
        })
      })

      newSocket.on('taskDeleted', () => {
        toast.error('Task deleted')
      })

      newSocket.on('taskMoved', () => {
        // Silent update, no toast needed
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user])

  const joinProject = (projectId) => {
    if (socket) {
      socket.emit('joinProject', projectId)
    }
  }

  const leaveProject = (projectId) => {
    if (socket) {
      socket.emit('leaveProject', projectId)
    }
  }

  const emitTaskMoved = (data) => {
    if (socket) {
      socket.emit('taskMoved', data)
    }
  }

  const emitTaskUpdated = (data) => {
    if (socket) {
      socket.emit('taskUpdated', data)
    }
  }

  const value = {
    socket,
    isConnected,
    joinProject,
    leaveProject,
    emitTaskMoved,
    emitTaskUpdated
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}