import { useState, useEffect } from 'react'
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        params: { limit: 20 }
      })
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await axios.patch('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await axios.delete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id, { stopPropagation: () => {} })
    
    // Navigate based on notification type
    if (notification.relatedModel === 'Task' && notification.relatedItem) {
      // Could open task modal or navigate to task
      // For now, just close the dropdown
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '👤'
      case 'task_moved':
        return '↔️'
      case 'project_invite':
        return '📋'
      case 'due_date':
        return '⏰'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        title="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {loading ? 'Marking...' : 'Mark all as read'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <span className="text-lg mr-2">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-2 block">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => markAsRead(notification._id, e)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification._id, e)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell