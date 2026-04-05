import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function MembersBar({ current, max }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{current} / {max} members</span>
        <span>{Math.round(pct)}% full</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-700">
        <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function JoinModal({ group, onClose }) {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await apiCall(`/api/groups/${group.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() || undefined }),
      })
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send join request.')
      setStatus('error')
    }
  }

  const isFull = group.currentMembers >= group.maxMembers

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{group.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{formatDateTime(group.scheduledDateTime)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-4 mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-base">Request Sent!</p>
            <p className="text-gray-400 text-sm mt-1">The group host will review your request.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {isFull && (
              <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V5h2v4H9zm0 4v-2h2v2H9z" clipRule="evenodd" />
                </svg>
                This group is full.
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message to host <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={status === 'loading' || isFull}
                placeholder="Introduce yourself or ask a question…"
                maxLength={300}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
              />
              <p className="text-right text-xs text-gray-600 mt-1">{message.length}/300</p>
            </div>

            {status === 'error' && (
              <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V5h2v4H9zm0 4v-2h2v2H9z" clipRule="evenodd" />
                </svg>
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium rounded-lg transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={status === 'loading' || isFull}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending…
                  </>
                ) : 'Request to Join'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GroupCard({ group, onJoin }) {
  const isFull = group.currentMembers >= group.maxMembers
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-purple-700 transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 mt-0.5" />
          <h3 className="text-white font-semibold text-base truncate">{group.name}</h3>
        </div>
        {group.gameMode && (
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
            group.gameMode === 'Competitive'
              ? 'bg-orange-900/50 text-orange-400 border border-orange-800'
              : 'bg-blue-900/50 text-blue-400 border border-blue-800'
          }`}>
            {group.gameMode}
          </span>
        )}
      </div>

      {/* Date/time */}
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDateTime(group.scheduledDateTime)}
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{group.description}</p>
      )}

      {/* Members bar */}
      <MembersBar current={group.currentMembers ?? 0} max={group.maxMembers ?? group.targetPartySize ?? 0} />

      {/* Join button */}
      <button
        onClick={() => onJoin(group)}
        disabled={isFull}
        className={`mt-1 w-full py-2.5 rounded-lg text-sm font-semibold transition ${
          isFull
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
        }`}
      >
        {isFull ? 'Group Full' : 'Join Group'}
      </button>
    </div>
  )
}

export default function BrowseGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = dateFilter ? `?date=${dateFilter}` : ''
      const data = await apiCall(`/api/groups${params}`)
      setGroups(data.groups ?? data ?? [])
    } catch (err) {
      setError(err.message || 'Failed to load groups.')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const visibleGroups = groups

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Browse Open Groups</h2>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Loading…' : `${visibleGroups.length} group${visibleGroups.length !== 1 ? 's' : ''} available`}
            </p>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-purple-500 transition appearance-none"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  title="Clear filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={fetchGroups}
              className="p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="w-8 h-8 animate-spin text-purple-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-gray-400 text-sm">Loading groups…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold">{error}</p>
            <button
              onClick={fetchGroups}
              className="mt-4 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && visibleGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold">No groups found</p>
            <p className="text-gray-500 text-sm mt-1">
              {dateFilter ? 'Try a different date or clear the filter.' : 'Check back later for new groups.'}
            </p>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="mt-4 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

        {!loading && !error && visibleGroups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleGroups.map(group => (
              <GroupCard key={group.id} group={group} onJoin={setSelectedGroup} />
            ))}
          </div>
        )}
      </div>

      {selectedGroup && (
        <JoinModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </DashboardLayout>
  )
}
