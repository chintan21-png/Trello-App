import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  BellIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    avatar: '',
    notificationsEnabled: true
  })
  
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || '',
        notificationsEnabled: user.notificationsEnabled !== false
      })
    }
  }, [user])

  const validateProfile = () => {
    const newErrors = {}
    
    if (!profile.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (profile.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    return newErrors
  }

  const validatePassword = () => {
    const newErrors = {}
    
    if (!password.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!password.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (password.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (!password.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password.newPassword !== password.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    return newErrors
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateProfile()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})
    
    const result = await updateProfile(profile)
    
    if (result.success) {
      toast.success('Profile updated successfully')
    }
    
    setLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validatePassword()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})
    
    const { confirmPassword, ...passwordData } = password
    const result = await changePassword(passwordData)
    
    if (result.success) {
      toast.success('Password changed successfully')
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
    
    setLoading(false)
  }

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPassword(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>
          
          <div className="sm:flex">
            {/* Sidebar */}
            <div className="sm:w-48 border-r border-gray-200">
              <nav className="sticky top-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  Profile
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <KeyIcon className="h-5 w-5 mr-3" />
                  Security
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center ${
                    activeTab === 'notifications'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BellIcon className="h-5 w-5 mr-3" />
                  Notifications
                </button>
              </nav>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow border border-gray-300"
                        onClick={() => toast.info('Avatar upload coming soon')}
                      >
                        <CameraIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{user.username}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="username"
                        value={profile.username}
                        onChange={handleProfileChange}
                        className={`input pl-10 ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        readOnly
                        className="input pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        id="notificationsEnabled"
                        name="notificationsEnabled"
                        type="checkbox"
                        checked={profile.notificationsEnabled}
                        onChange={handleProfileChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-900">
                        Enable email notifications
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
              
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Password Security</h4>
                      <p className="text-sm text-blue-700">Change your password regularly to keep your account secure</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="currentPassword"
                        value={password.currentPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 ${errors.currentPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="newPassword"
                        value={password.newPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 ${errors.newPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={password.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`input pl-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
              
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <BellIcon className="h-6 w-6 text-yellow-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Notification Settings</h4>
                        <p className="text-sm text-yellow-700">Manage how you receive notifications</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">Email Notifications</h5>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.notificationsEnabled}
                          onChange={(e) => setProfile({ ...profile, notificationsEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">Task Assignments</h5>
                        <p className="text-sm text-gray-600">Get notified when assigned to a task</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked className="sr-only peer" />
                        <div className="w-11 h-6 bg-blue-600 rounded-full peer"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">Due Date Reminders</h5>
                        <p className="text-sm text-gray-600">Get reminded before tasks are due</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked className="sr-only peer" />
                        <div className="w-11 h-6 bg-blue-600 rounded-full peer"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">Project Updates</h5>
                        <p className="text-sm text-gray-600">Notifications about project changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked className="sr-only peer" />
                        <div className="w-11 h-6 bg-blue-600 rounded-full peer"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => toast.success('Notification settings saved')}
                      className="btn-primary"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile