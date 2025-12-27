import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'
import Column from '../components/Column'
import Loader from '../components/Loader'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const ProjectBoard = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { joinProject, leaveProject } = useSocket()
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProject()
    
    // Join project room for real-time updates
    if (projectId) {
      joinProject(projectId)
    }
    
    return () => {
      if (projectId) {
        leaveProject(projectId)
      }
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}`),
        axios.get(`/api/projects/${projectId}/tasks`)
      ])
      
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setError(null)
    } catch (error) {
      console.error('Failed to fetch project:', error)
      if (error.response?.status === 403) {
        setError('You do not have access to this project')
      } else if (error.response?.status === 404) {
        setError('Project not found')
      } else {
        setError('Failed to load project')
      }
    } finally {
      setLoading(false)
    }
  }

  const moveTask = (taskId, newColumn, newIndex) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t._id === taskId)
      if (taskIndex === -1) return prevTasks
      
      const updatedTask = { ...prevTasks[taskIndex], column: newColumn, order: newIndex }
      const newTasks = prevTasks.filter(t => t._id !== taskId)
      newTasks.splice(newIndex, 0, updatedTask)
      
      return newTasks.map((task, idx) => ({
        ...task,
        order: idx
      }))
    })
  }

  const handleTaskAdded = (newTask) => {
    setTasks(prevTasks => [...prevTasks, newTask])
  }

  const addMember = async () => {
    const email = prompt('Enter member email:')
    if (!email) return
    
    try {
      // First get user by email
      const usersRes = await axios.get('/api/auth/users', {
        params: { search: email }
      })
      
      const user = usersRes.data.users.find(u => u.email === email)
      if (!user) {
        toast.error('User not found')
        return
      }
      
      await axios.post(`/api/projects/${projectId}/members`, {
        userId: user._id,
        role: 'member'
      })
      
      toast.success('Member added successfully')
      fetchProject() // Refresh project data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member')
    }
  }

  if (loading) {
    return <Loader text="Loading project board..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{error}</h3>
          <p className="mt-2 text-sm text-gray-600">
            You may not have permission to view this project or it may have been deleted.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const columns = project?.columns?.length > 0 
    ? project.columns 
    : [
        { name: 'To Do', color: '#CBD5E0', order: 0 },
        { name: 'In Progress', color: '#4299E1', order: 1 },
        { name: 'Done', color: '#48BB78', order: 2 }
      ]

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        {/* Project Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <button
                  onClick={() => navigate('/')}
                  className="mr-3 text-gray-600 hover:text-gray-900"
                  title="Back to dashboard"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
                  <p className="text-gray-600 text-sm">{project?.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {project?.members?.slice(0, 5).map((member, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-sm font-medium"
                      title={`${member.user?.username} (${member.role})`}
                    >
                      {member.user?.username?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project?.members?.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                      +{project.members.length - 5}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={addMember}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Add member"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => toast.info('Settings coming soon')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Project settings"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Board */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {columns.map((column) => (
              <Column
                key={`${column.name}-${column.order}`}
                column={column}
                tasks={tasks.filter(task => task.column === column.name)}
                moveTask={moveTask}
                projectId={projectId}
                onTaskAdded={handleTaskAdded}
              />
            ))}
          </div>
        </main>
      </div>
    </DndProvider>
  )
}

export default ProjectBoard