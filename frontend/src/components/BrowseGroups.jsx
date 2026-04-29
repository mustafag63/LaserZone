import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'
import { useAuth } from '../context/AuthContext'

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

export default function BrowseGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)

  // groupId → { status, playerCount }
  const [myRequests, setMyRequests] = useState({})

  const [joinModal, setJoinModal] = useState(null)
  const [playerCount, setPlayerCount] = useState(1)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinMessage, setJoinMessage] = useState(null)

  const fetchMyRequests = async () => {
    try {
      const data = await apiCall('/api/groups/my-requests')
      const map = {}
      data.requests.forEach(r => { map[r.groupId] = r })
      setMyRequests(map)
    } catch { /* non-critical */ }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (dateFilter) params.set('date', dateFilter)
      if (availableOnly) params.set('availableOnly', 'true')
      const qs = params.toString()
      const data = await apiCall(`/api/groups${qs ? `?${qs}` : ''}`)
      setGroups(data.groups)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMyRequests() }, [])
  useEffect(() => { fetchGroups() }, [dateFilter, availableOnly])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchGroups()
  }

  const handleJoinSubmit = async () => {
    if (!joinModal) return
    try {
      setJoinLoading(true)
      setJoinMessage(null)
      await apiCall(`/api/groups/${joinModal.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ playerCount }),
      })
      setJoinMessage({ type: 'success', text: 'Request sent! Waiting for leader approval.' })
      setMyRequests(prev => ({ ...prev, [joinModal.id]: { groupId: joinModal.id, status: 'pending', playerCount } }))
      setTimeout(() => {
        setJoinModal(null)
        setJoinMessage(null)
        setPlayerCount(1)
        fetchGroups()
      }, 1800)
    } catch (err) {
      setJoinMessage({ type: 'error', text: err.message || 'Failed to send join request' })
    } finally {
      setJoinLoading(false)
    }
  }

  const requestBadge = (status) => {
    if (status === 'approved') return 'bg-green-900/40 text-green-400 border border-green-700'
    if (status === 'rejected') return 'bg-red-900/40 text-red-400 border border-red-700'
    return 'bg-yellow-900/40 text-yellow-400 border border-yellow-700'
  }

  const requestLabel = (status) => {
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    return 'Pending'
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Browse Open Groups</h2>
          <p className="text-gray-400 text-sm mt-1">Find a group and send a join request to the leader</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Search by name</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Group name..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="accent-purple-500"
              />
              Available only
            </label>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition"
            >
              Search
            </button>
            {(searchQuery || dateFilter || availableOnly) && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setDateFilter(''); setAvailableOnly(false); setTimeout(fetchGroups, 0) }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg text-sm transition"
              >
                Clear
              </button>
            )}
          </form>
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
            <p className="text-gray-400 font-medium">No open groups found</p>
            <p className="text-gray-600 text-sm mt-1">Try changing your filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => {
              const spotsLeft = g.partySize - g.currentCount
              const isOwn = g.leaderUsername === user?.username
              const myReq = myRequests[g.id]

              const isFull = g.status === 'closed' || spotsLeft === 0

              return (
                <div
                  key={g.id}
                  className={`bg-gray-800 border rounded-xl px-6 py-5 transition ${isFull ? 'border-gray-700 opacity-75' : 'border-gray-700 hover:border-purple-600'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFull ? 'bg-red-500' : 'bg-green-400'}`} />
                        <p className="text-white font-semibold truncate">{g.name}</p>
                        {isFull && (
                          <span className="px-2 py-0.5 bg-red-900/50 border border-red-700 rounded-full text-xs font-semibold text-red-400">
                            Full
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {formatDate(g.date)} · {format12Hour(g.startTime)} – {format12Hour(g.endTime)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Leader: {g.leaderUsername} · {isFull ? 'No spots left' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                      </p>
                      <CapacityBar current={g.currentCount} total={g.partySize} className="mt-3" />
                    </div>

                    <div className="flex-shrink-0 pt-1">
                      {isOwn ? (
                        <span className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs font-medium text-gray-400">
                          Your Group
                        </span>
                      ) : myReq ? (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${requestBadge(myReq.status)}`}>
                          {requestLabel(myReq.status)}
                        </span>
                      ) : isFull ? (
                        <span className="px-3 py-1.5 bg-red-900/30 border border-red-800 rounded-lg text-xs font-semibold text-red-500">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => { setJoinModal(g); setPlayerCount(1); setJoinMessage(null) }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg text-sm transition shadow whitespace-nowrap"
                        >
                          I Want to Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Join Request Modal */}
      {joinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Join "{joinModal.name}"</h3>
            <p className="text-gray-400 text-sm mb-0.5">
              {formatDate(joinModal.date)} · {format12Hour(joinModal.startTime)} – {format12Hour(joinModal.endTime)}
            </p>
            <p className="text-gray-500 text-xs mb-5">
              Your request will be sent to the group leader for approval.
            </p>

            <CapacityBar current={joinModal.currentCount} total={joinModal.partySize} className="mb-5" />

            <label className="block text-gray-300 text-sm font-medium mb-2">
              How many players are you bringing?
            </label>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setPlayerCount(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg transition flex items-center justify-center"
              >−</button>
              <span className="w-8 text-center text-white font-semibold text-lg">{playerCount}</span>
              <button
                onClick={() => setPlayerCount(p => Math.min(joinModal.partySize - joinModal.currentCount, p + 1))}
                className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg transition flex items-center justify-center"
              >+</button>
              <span className="text-gray-500 text-xs ml-1">max {joinModal.partySize - joinModal.currentCount}</span>
            </div>

            {joinMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                joinMessage.type === 'success'
                  ? 'bg-green-900/30 border border-green-700 text-green-300'
                  : 'bg-red-900/30 border border-red-700 text-red-300'
              }`}>
                {joinMessage.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setJoinModal(null); setJoinMessage(null) }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinSubmit}
                disabled={joinLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg text-sm transition shadow disabled:opacity-50"
              >
                {joinLoading ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
