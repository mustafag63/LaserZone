import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'

function formatDateTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function GroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiCall(`/api/groups/${id}`)
      .then(setGroup)
      .catch((err) => setError(err.message || 'Group not found.'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="py-24 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-sm text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && group && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      group.isPublic
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {group.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{group.groupName}</h1>
                  {group.description && (
                    <p className="text-gray-400 mt-2 text-sm">{group.description}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/groups/create')}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-400 border border-gray-700 rounded-lg hover:border-gray-500 hover:text-white transition"
                >
                  New Group
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Scheduled</p>
                <p className="text-white font-medium text-sm">{formatDateTime(group.scheduledDateTime)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Players</p>
                <p className="text-white font-medium text-sm">
                  {group.members?.length ?? 1} / {group.maxPartySize}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-white font-medium text-sm capitalize">{group.status ?? 'open'}</p>
              </div>
            </div>

            {/* Members */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Members</h2>
              {group.members && group.members.length > 0 ? (
                <ul className="space-y-2">
                  {group.members.map((m, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(m.username ?? m)[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-300">{m.username ?? m}</span>
                      {i === 0 && (
                        <span className="ml-auto text-xs text-purple-400 font-medium">Leader</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No members yet. Share the group link to invite players.</p>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
