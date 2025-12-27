import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error)
      throw new Error('Network error. Please check your connection.')
    }

    const { status } = error.response
    
    // Handle specific status codes
    if (status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (status === 403) {
      console.error('Access forbidden:', error)
    } else if (status === 404) {
      console.error('Resource not found:', error)
    } else if (status >= 500) {
      console.error('Server error:', error)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  getUsers: (params) => api.get('/api/auth/users', { params }),
  checkUsername: (username) => api.get('/api/auth/check-username', { params: { username } }),
  checkEmail: (email) => api.get('/api/auth/check-email', { params: { email } }),
  logout: () => api.post('/api/auth/logout'),
}

// Project API
export const projectAPI = {
  create: (data) => api.post('/api/projects', data),
  getAll: (params) => api.get('/api/projects', { params }),
  getById: (id) => api.get(`/api/projects/${id}`),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  addMember: (id, data) => api.post(`/api/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/api/projects/${id}/members/${userId}`),
  getStats: () => api.get('/api/projects/stats'),
}

// Task API
export const taskAPI = {
  create: (projectId, data) => api.post(`/api/projects/${projectId}/tasks`, data),
  getByProject: (projectId, params) => api.get(`/api/projects/${projectId}/tasks`, { params }),
  getById: (id) => api.get(`/api/tasks/${id}`),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  updatePosition: (taskId, data) => api.patch(`/api/tasks/${taskId}/position`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
}

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
  delete: (id) => api.delete(`/api/notifications/${id}`),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
}

// Health check
export const healthCheck = () => api.get('/api/health')

export default api