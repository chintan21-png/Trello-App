import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [project, setProject] = useState({
    name: '',
    description: '',
    columns: [
      { name: 'To Do', color: '#CBD5E0', order: 0 },
      { name: 'In Progress', color: '#4299E1', order: 1 },
      { name: 'Done', color: '#48BB78', order: 2 }
    ]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!project.name.trim()) {
      toast.error('Project name is required')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/projects', project)
      toast.success('Project created successfully')
      onProjectCreated(response.data.project)
      resetForm()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProject({
      name: '',
      description: '',
      columns: [
        { name: 'To Do', color: '#CBD5E0', order: 0 },
        { name: 'In Progress', color: '#4299E1', order: 1 },
        { name: 'Done', color: '#48BB78', order: 2 }
      ]
    })
  }

  const addColumn = () => {
    const newColumn = {
      name: `Column ${project.columns.length + 1}`,
      color: '#CBD5E0',
      order: project.columns.length
    }
    setProject({
      ...project,
      columns: [...project.columns, newColumn]
    })
  }

  const updateColumn = (index, field, value) => {
    const newColumns = [...project.columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setProject({ ...project, columns: newColumns })
  }

  const removeColumn = (index) => {
    if (project.columns.length <= 1) {
      toast.error('At least one column is required')
      return
    }
    const newColumns = project.columns.filter((_, i) => i !== index)
    setProject({ ...project, columns: newColumns })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Project Name *</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                    className="input"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                    className="input h-24"
                    placeholder="Enter project description"
                    rows="3"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="label">Columns</label>
                    <button
                      type="button"
                      onClick={addColumn}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Column
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {project.columns.map((column, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={column.color}
                          onChange={(e) => updateColumn(index, 'color', e.target.value)}
                          className="w-10 h-10 cursor-pointer"
                          title="Column color"
                        />
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value)}
                          className="flex-1 input"
                          placeholder="Column name"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                          disabled={project.columns.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateProjectModal