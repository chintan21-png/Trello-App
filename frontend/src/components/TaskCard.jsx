import { useDrag, useDrop } from 'react-dnd'
import { 
  CalendarIcon, 
  UserIcon,
  TagIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import TaskModal from './TaskModal'

const TaskCard = ({ task, index, moveTask, columnId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task._id, index, columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'TASK',
    hover: (draggedItem) => {
      if (draggedItem.id !== task._id || draggedItem.columnId !== columnId) {
        moveTask(draggedItem.id, columnId, index)
        draggedItem.index = index
        draggedItem.columnId = columnId
      }
    },
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <ExclamationCircleIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (date) => {
    if (!date) return null
    const taskDate = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (taskDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (taskDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <>
      <div
        ref={(node) => drag(drop(node))}
        className={`bg-white p-4 rounded-lg shadow mb-3 cursor-move hover:shadow-md transition-all duration-200 border-l-4 ${
          isDragging ? 'dragging' : ''
        } ${
          isOverdue ? 'border-l-red-500' : 
          task.priority === 'high' ? 'border-l-orange-500' :
          task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-gray-300'
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h3>
          {task.priority && task.priority !== 'low' && (
            <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
            </span>
          )}
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 3).map((assignee, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium"
                    title={assignee.username}
                  >
                    {assignee.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
            
            {task.dueDate && (
              <div className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                <CalendarIcon className="w-3 h-3 mr-1" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>
          
          {task.labels && task.labels.length > 0 && (
            <div className="flex space-x-1">
              {task.labels.slice(0, 2).map((label, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 flex items-center"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {label.name}
                </span>
              ))}
              {task.labels.length > 2 && (
                <span className="text-xs text-gray-500">+{task.labels.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TaskModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

export default TaskCard