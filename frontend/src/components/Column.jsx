import { useDrop } from 'react-dnd'
import TaskCard from './TaskCard'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Column = ({ column, tasks, moveTask, projectId, onTaskAdded }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item) => {
      if (item.columnId !== column.name) {
        handleTaskMove(item.id, column.name)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleTaskMove = async (taskId, newColumn) => {
    try {
      await axios.patch(`/api/tasks/tasks/${taskId}/position`, {
        column: newColumn,
        order: tasks.length,
        sourceColumn: tasks.find(t => t._id === taskId)?.column
      })
    } catch (error) {
      toast.error('Failed to move task')
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      const response = await axios.post(`/api/projects/${projectId}/tasks`, {
        title: newTaskTitle,
        column: column.name
      })
      
      onTaskAdded(response.data.task)
      setNewTaskTitle('')
      setIsAddingTask(false)
      toast.success('Task added successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add task')
    }
  }

  return (
    <div
      ref={drop}
      className={`bg-gray-50 rounded-lg p-4 min-h-[500px] flex flex-col border border-gray-200 ${
        isOver ? 'drag-over' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: column.color || '#CBD5E0' }}
          ></div>
          <h3 className="font-semibold text-gray-800">{column.name}</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAddingTask(true)}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1 rounded"
          title="Add task"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {isAddingTask && (
        <form onSubmit={handleAddTask} className="mb-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            autoFocus
          />
          <div className="flex space-x-2 mt-2">
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingTask(false)
                setNewTaskTitle('')
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pb-2">
        {tasks.map((task, index) => (
          <TaskCard
            key={task._id}
            task={task}
            index={index}
            columnId={column.name}
            moveTask={moveTask}
          />
        ))}
        
        {tasks.length === 0 && !isAddingTask && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No tasks yet</p>
            <button
              onClick={() => setIsAddingTask(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Column