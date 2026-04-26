import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function format12Hour(time24) {
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const mins = m && m !== '00' ? `:${m}` : ''
  return `${hour % 12 || 12}${mins} ${hour >= 12 ? 'PM' : 'AM'}`
}

function CapacityBar({ current, total, className = '' }) {
  const pct = Math.round((current / total) * 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{current} / {total} players</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const STATUS_STYLE = {
  open:      'text-green-400 bg-green-900/30 border-green-700',
  closed:    'text-gray-400 bg-gray-700/50 border-gray-600',
  cancelled: 'text-red-400 bg-red-900/30 border-red-700',
}

export default function MyGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [expanded, setExpanded] = useState({})
  const [requests, setRequests] = useState({})
  const [requestsLoading, setRequestsLoading] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  const fetchGroups = async () => {
    try {
      const data = await apiCall('/api/groups/my')
      setGroups(data.groups)
    } catch (err) {
      setError(err.message || 'Failed to load your groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGroups() }, [])

  const toggleExpand = async (groupId) => {
    const opening = !expanded[groupId]
    setExpanded(prev => ({ ...prev, [groupId]: opening }))
    if (opening && !requests[groupId]) {
      setRequestsLoading(prev => ({ ...prev, [groupId]: true }))
      try {
        const data = await apiCall(`/api/groups/${groupId}/requests`)
        setRequests(prev => ({ ...prev, [groupId]: data.requests }))
      } catch {
        setRequests(prev => ({ ...prev, [groupId]: [] }))
      } finally {
        setRequestsLoading(prev => ({ ...prev, [groupId]: false }))
      }
    }
  }

  const handleAction = async (groupId, requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }))
    try {
      await apiCall(`/api/groups/${groupId}/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      })
      setRequests(prev => ({
        ...prev,
        [groupId]: prev[groupId].map(r =>
          r.id === requestId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        ),
      }))
      if (action === 'approve') {
        const data = await apiCall('/api/groups/my')
        setGroups(data.groups)
      }
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }))
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">My Groups</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your group reservations and approve join requests</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">You haven't created any groups</p>
            <p className="text-gray-600 text-sm mt-1">Create a group from the Browse Groups page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => {
              const isExpanded = expanded[g.id]
              const groupRequests = requests[g.id] || []
              const pendingCount = isExpanded
                ? groupRequests.filter(r => r.status === 'pending').length
                : 0

              return (
                <div key={g.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition">
                  {/* Group header */}
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <p className="text-white font-semibold">{g.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[g.status] || STATUS_STYLE.open}`}>
                            {g.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {formatDate(g.date)} · {format12Hour(g.startTime)} – {format12Hour(g.endTime)}
                        </p>
                        <CapacityBar current={g.currentCount} total={g.partySize} className="mt-3" />
                      </div>

                      <button
                        onClick={() => toggleExpand(g.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition flex-shrink-0"
                      >
                        <span>Requests</span>
                        {!isExpanded && pendingCount > 0 && (
                          <span className="w-5 h-5 bg-yellow-500 text-black rounded-full text-xs font-bold flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Requests panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 bg-gray-900/50 px-6 py-4">
                      {requestsLoading[g.id] ? (
                        <div className="flex justify-center py-6">
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : groupRequests.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No join requests yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupRequests.map(r => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 gap-3"
                            >
                              <div>
                                <span className="text-white text-sm font-medium">@{r.username}</span>
                                <span className="text-gray-400 text-xs ml-2">
                                  {r.playerCount} player{r.playerCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {r.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleAction(g.id, r.id, 'approve')}
                                      disabled={!!actionLoading[r.id]}
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                      {actionLoading[r.id] ? '…' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleAction(g.id, r.id, 'reject')}
                                      disabled={!!actionLoading[r.id]}
                                      className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300 border border-red-700 text-xs font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                      {actionLoading[r.id] ? '…' : 'Reject'}
                                    </button>
                                  </>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                                    r.status === 'approved'
                                      ? 'bg-green-900/40 text-green-400'
                                      : 'bg-red-900/40 text-red-400'
                                  }`}>
                                    {r.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
