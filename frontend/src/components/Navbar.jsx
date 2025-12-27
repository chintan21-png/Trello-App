import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { 
  HomeIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Squares2X2Icon 
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Squares2X2Icon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Trello Lite</span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center"
              >
                <HomeIcon className="h-5 w-5 mr-1" />
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <div className="flex items-center space-x-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user?.username}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </span>
              </div>
              
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900">
                  <UserCircleIcon className="h-8 w-8" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar