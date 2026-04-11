import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

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
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function ProfileModal({ onClose }) {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const storageKey = `lz_avatar_${user?.id}`
  const [avatar, setAvatar] = useState(() => localStorage.getItem(storageKey) || null)
  const [dragOver, setDragOver] = useState(false)

  const avatarColor = getAvatarColor(user?.username)
  const initial = user?.username?.[0]?.toUpperCase() ?? '?'

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setAvatar(dataUrl)
      localStorage.setItem(storageKey, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => processFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleRemove = () => {
    setAvatar(null)
    localStorage.removeItem(storageKey)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`relative w-24 h-24 rounded-full flex-shrink-0 cursor-pointer group
                ${dragOver ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              title="Click or drag to change photo"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-4xl shadow-lg`}>
                  {initial}
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current.click()}
                className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Upload Photo
              </button>
              {avatar && (
                <button
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">Click avatar or drag & drop an image</p>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Username</p>
              <p className="text-white font-semibold">{user?.username ?? '—'}</p>
            </div>
            <div className="bg-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
              <p className="text-white font-semibold capitalize">{user?.role ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
