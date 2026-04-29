import { useState } from 'react'

const OPEN_HOUR = 10
const CLOSE_HOUR = 22
const MAX_CAPACITY = 20

function generateTimeSlots() {
  const slots = []
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export default function EditReservationModal({ reservation, onClose, onSave }) {
  const [date, setDate] = useState(reservation.date)
  const [time, setTime] = useState(reservation.startTime?.slice(0, 5) || reservation.time)
  const [myPlayers, setMyPlayers] = useState(reservation.players)
  const [external, setExternal] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const total = myPlayers + external

  const handleMyPlayersChange = (val) => {
    const v = Math.max(3, Math.min(MAX_CAPACITY, val))
    setMyPlayers(v)
    if (v + external > MAX_CAPACITY) setExternal(MAX_CAPACITY - v)
  }

  const handleExternalChange = (val) => {
    const v = Math.max(0, Math.min(MAX_CAPACITY - myPlayers, val))
    setExternal(v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5001/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ date, time, players: total }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.message || 'Update failed.')
        return
      }
      onSave()
    } catch {
      setApiError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Edit Reservation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Reservation</p>
            <p className="text-white font-semibold">{reservation.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <select
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              {TIME_SLOTS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Two counters side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* My Players */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 mb-3">Players</p>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleMyPlayersChange(myPlayers - 1)}
                  disabled={myPlayers <= 3}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
                >−</button>
                <span className="text-2xl font-bold text-white">{myPlayers}</span>
                <button
                  type="button"
                  onClick={() => handleMyPlayersChange(myPlayers + 1)}
                  disabled={total >= MAX_CAPACITY}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
                >+</button>
              </div>
            </div>

            {/* External */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 mb-3">External Join</p>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleExternalChange(external - 1)}
                  disabled={external <= 0}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
                >−</button>
                <span className="text-2xl font-bold text-green-400">{external}</span>
                <button
                  type="button"
                  onClick={() => handleExternalChange(external + 1)}
                  disabled={total >= MAX_CAPACITY}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
                >+</button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Total: <span className="text-white font-bold">{total}</span>
            <span className="text-gray-600"> / {MAX_CAPACITY} max</span>
          </p>

          {apiError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
              {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
