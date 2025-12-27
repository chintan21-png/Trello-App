import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

const TaskModal = ({ task, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({ ...task })
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const response = await axios.put(`/api/tasks/tasks/${task._id}`, editedTask)
      toast.success('Task updated successfully')
      setIsEditing(false)
      onClose()
    } catch (error) {
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    
    setLoading(true)
    try {
      await axios.delete(`/api/tasks/tasks/${task._id}`)
      toast.success('Task deleted successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-lg font-medium text-gray-900 border-b focus:outline-none focus:border-blue-500 w-full"
                  autoFocus
                />
              ) : (
                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-400 hover:text-blue-600"
                  title={isEditing ? 'Cancel' : 'Edit'}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="mb-4">
                <label className="label">Description</label>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="input h-32"
                    placeholder="Add description..."
                  />
                ) : (
                  <p className="text-gray-600">
                    {task.description || 'No description'}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Priority</label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="label">Due Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                      onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="label">Assignees</label>
                {isEditing ? (
                  <select
                    multiple
                    value={editedTask.assignees?.map(a => a._id || a)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setEditedTask({ ...editedTask, assignees: selected })
                    }}
                    className="input h-32"
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.assignees?.map(assignee => (
                      <div
                        key={assignee._id}
                        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <UserIcon className="w-4 h-4 mr-1" />
                        {assignee.username}
                      </div>
                    ))}
                    {(!task.assignees || task.assignees.length === 0) && (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="label">Column</label>
                <div className="text-gray-600">
                  {task.column}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary mr-3"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default TaskModal