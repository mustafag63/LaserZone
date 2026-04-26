import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileModal from './ProfileModal'

const AVATAR_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-purple-500',
]

function getAvatarColor(username) {
  if (!username) return AVATAR_COLORS[0]
  const index = username.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const avatarColor = getAvatarColor(user?.username)
  const initial = user?.username?.[0]?.toUpperCase() ?? '?'
  const savedAvatar = user?.id ? localStorage.getItem(`lz_avatar_${user.id}`) : null

  return (
    <>
    {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-gray-900 flex flex-col border-r border-gray-800 transition-all duration-300`}
    >
      {/* Logo + Toggle */}
      <div className="px-3 py-5 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-white tracking-wide">
            Laser<span className="text-purple-400">Zone</span>
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? 'mx-auto' : ''} p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* User Info */}
      <button
        onClick={() => setShowProfile(true)}
        className={`px-3 py-5 border-b border-gray-800 flex items-center w-full text-left hover:bg-gray-800 transition-colors ${collapsed ? 'justify-center' : 'gap-3'}`}
        title="View profile"
      >
        {savedAvatar ? (
          <img
            src={savedAvatar}
            alt="avatar"
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 shadow-lg"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}
          >
            {initial}
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm truncate">{user?.username ?? 'User'}</p>
            <p className="text-gray-400 text-xs capitalize">{user?.role ?? 'customer'}</p>
          </div>
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
          title={collapsed ? 'My Reservations' : ''}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {!collapsed && 'My Reservations'}
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
          title={collapsed ? 'Browse Groups' : ''}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && 'Browse Groups'}
        </NavLink>

        <NavLink
          to="/my-groups"
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
          title={collapsed ? 'My Groups' : ''}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {!collapsed && 'My Groups'}
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
    </>
  )
}
