import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import MakeReservationModal from './MakeReservationModal'

const STORAGE_KEY = 'lz_reservations'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function format12Hour(time24) {
  const [hour] = time24.split(':')
  const h = parseInt(hour)
  return `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`
}

export default function Dashboard() {
  const [reservations, setReservations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  // Load from API, fall back to localStorage
  useEffect(() => {
    const load = async () => {
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
      } catch { /* backend not running — fall through */ }

      // Fallback: localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setReservations(JSON.parse(stored))
      } catch {
        setReservations([])
      }
    }
    load()
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return
    setCancellingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5001/api/reservations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (res.ok) {
        const updated = reservations.filter(r => r.id !== id)
        setReservations(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    } catch { /* ignore */ } finally {
      setCancellingId(null)
    }
  }

  const saveReservation = (newReservation) => {
    const updated = [newReservation, ...reservations]
    setReservations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setShowModal(false)
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">My Reservations</h2>
            <p className="text-gray-400 text-sm mt-1">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
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

        {/* Reservations List */}
        {reservations.length === 0 ? (
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
            {reservations.map(r => (
              <div
                key={r.id}
                className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 flex items-center justify-between hover:border-purple-600 transition"
              >
                <div className="flex items-center gap-5">
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />

                  {/* Info */}
                  <div>
                    <p className="text-white font-semibold">{r.name}</p>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {formatDate(r.date)} · {format12Hour(r.startTime || r.time)} · {r.players} players
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancellingId === r.id}
                  className="px-3 py-1.5 text-xs font-medium bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Make Reservation Modal */}
      {showModal && (
        <MakeReservationModal
          onClose={() => setShowModal(false)}
          onSave={saveReservation}
          existingReservations={reservations}
        />
      )}
    </DashboardLayout>
  )
}
