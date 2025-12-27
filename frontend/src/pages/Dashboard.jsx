import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ArrowTrendingUpIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import CreateProjectModal from '../components/CreateProjectModal'
import Loader from '../components/Loader'

const Dashboard = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    overdueTasks: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/projects/stats')
      ])
      
      setProjects(projectsRes.data.projects)
      setStats(statsRes.data || {
        totalProjects: projectsRes.data.projects.length,
        activeProjects: projectsRes.data.projects.length,
        totalTasks: 0,
        overdueTasks: 0
      })
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this project?')) return
    
    try {
      await axios.delete(`/api/projects/${projectId}`)
      setProjects(projects.filter(p => p._id !== projectId))
      toast.success('Project deleted successfully')
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects])
  }

  if (loading) {
    return <Loader text="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Section */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-blue-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-green-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-purple-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <div className="flex items-center">
                <div className="bg-red-500 p-3 rounded-lg">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-red-600">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueTasks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
            <p className="text-gray-600">Manage your projects and tasks</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/project/${project._id}`}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleDeleteProject(project._id, e)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete project"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex -space-x-2">
                      {project.members?.slice(0, 5).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-sm font-medium"
                          title={member.user?.username}
                        >
                          {member.user?.username?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.members?.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                          +{project.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

export default Dashboard