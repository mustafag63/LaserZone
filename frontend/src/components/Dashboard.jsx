import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import MakeReservationModal from './MakeReservationModal'
import EditReservationModal from './EditReservationModal'
import EditGroupModal from './EditGroupModal'
import { apiCall } from '../utils/api'

const STORAGE_KEY = 'lz_reservations'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function format12Hour(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const mins = m && m !== '00' ? `:${m}` : ''
  return `${hour % 12 || 12}${mins} ${hour >= 12 ? 'PM' : 'AM'}`
}

function CapacityBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{current} / {total} players</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [reservations, setReservations] = useState([])
  const [groups, setGroups] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [cancellingGroupId, setCancellingGroupId] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5001/api/reservations/my', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (res.ok) {
        const data = await res.json()
        setReservations(data.reservations)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.reservations))
        return
      }
    } catch { /* fall through */ }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setReservations(JSON.parse(stored))
    } catch { setReservations([]) }
  }

  const fetchGroups = async () => {
    try {
      const data = await apiCall('/api/groups/my')
      setGroups(data.groups)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchReservations()
    fetchGroups()
  }, [])

  const handleSave = () => {
    setShowModal(false)
    fetchReservations()
    fetchGroups()
  }

  const handleEditSave = () => {
    setEditingReservation(null)
    fetchReservations()
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return
    setCancellingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5001/api/reservations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (res.ok) fetchReservations()
    } catch { /* ignore */ } finally { setCancellingId(null) }
  }

  const handleCancelGroup = async (id) => {
    if (!window.confirm('Cancel this group?')) return
    setCancellingGroupId(id)
    try {
      await apiCall(`/api/groups/${id}`, { method: 'DELETE' })
      fetchGroups()
    } catch { /* ignore */ } finally { setCancellingGroupId(null) }
  }

  const total = reservations.length + groups.length

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">My Reservations</h2>
            <p className="text-gray-400 text-sm mt-1">
              {total} item{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Make Reservation
          </button>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">No reservations yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Make Reservation" to book your first session.</p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* Regular reservations */}
            {reservations.map(r => (
              <div key={`res-${r.id}`} className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 flex items-center justify-between hover:border-purple-600 transition">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">{r.name}</p>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {formatDate(r.date)} · {format12Hour(r.startTime || r.time)} · {r.players} players
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingReservation(r)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition">
                    Edit
                  </button>
                  <button onClick={() => handleCancel(r.id)} disabled={cancellingId === r.id}
                    className="px-3 py-1.5 text-xs font-medium bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}

            {/* Group reservations */}
            {groups.map(g => {
              const isFull = g.status === 'closed'
              return (
                <div key={`grp-${g.id}`} className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 hover:border-purple-600 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFull ? 'bg-red-500' : 'bg-green-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{g.name}</p>
                          <span className="px-1.5 py-0.5 bg-purple-900/50 border border-purple-700 rounded text-xs text-purple-300 font-medium">
                            Group
                          </span>
                          {isFull && (
                            <span className="px-1.5 py-0.5 bg-red-900/50 border border-red-700 rounded text-xs text-red-400 font-medium">
                              Full
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">
                          {formatDate(g.date)} · {format12Hour(g.startTime)}{g.endTime ? ` – ${format12Hour(g.endTime)}` : ''}
                        </p>
                        <CapacityBar current={g.currentCount} total={g.partySize} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {g.status !== 'cancelled' && (
                        <>
                          <button onClick={() => setEditingGroup(g)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition">
                            Edit
                          </button>
                          <button onClick={() => handleCancelGroup(g.id)} disabled={cancellingGroupId === g.id}
                            className="px-3 py-1.5 text-xs font-medium bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {cancellingGroupId === g.id ? '…' : 'Cancel'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

          </div>
        )}
      </div>

      {showModal && (
        <MakeReservationModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {editingReservation && (
        <EditReservationModal reservation={editingReservation} onClose={() => setEditingReservation(null)} onSave={handleEditSave} />
      )}
      {editingGroup && (
        <EditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} onSave={() => { setEditingGroup(null); fetchGroups() }} />
      )}
    </DashboardLayout>
  )
}
