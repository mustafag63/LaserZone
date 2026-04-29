import { useState } from 'react'
import { apiCall } from '../utils/api'

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

export default function MakeReservationModal({ onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0]

  const [isOpenGroup, setIsOpenGroup] = useState(false)

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [myPlayers, setMyPlayers] = useState(3)
  const [external, setExternal] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

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
    if (!name.trim() || name.trim().length < 2) {
      setApiError('Ad en az 2 karakter olmalıdır.')
      return
    }
    if (!date) {
      setApiError('Lütfen bir tarih seçin.')
      return
    }
    setSubmitting(true)
    try {
      if (isOpenGroup) {
        await apiCall('/api/groups', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            date,
            time,
            partySize: total,
            leaderPlayerCount: myPlayers,
          }),
        })
      } else {
        await apiCall('/api/reservations', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), date, time, players: total }),
        })
      }
      onSave()
    } catch (err) {
      setApiError(err.message || 'İşlem başarısız.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">
            {isOpenGroup ? 'Create Open Group' : 'New Reservation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Open Group Toggle */}
          <button
            type="button"
            onClick={() => setIsOpenGroup(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
              isOpenGroup
                ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium">Mark as Open Group</p>
                {isOpenGroup && (
                  <p className="text-xs text-purple-400 mt-0.5">Open for external members</p>
                )}
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isOpenGroup ? 'bg-purple-600' : 'bg-gray-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOpenGroup ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {isOpenGroup ? 'Group Name' : 'Reservation Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isOpenGroup ? 'e.g. Friday Night Crew...' : 'e.g. Birthday Party, Friday Night...'}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 mb-3">
                {isOpenGroup ? 'My Team' : 'Players'}
              </p>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => handleMyPlayersChange(myPlayers - 1)} disabled={myPlayers <= 3}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition">−</button>
                <span className="text-2xl font-bold text-white">{myPlayers}</span>
                <button type="button" onClick={() => handleMyPlayersChange(myPlayers + 1)} disabled={total >= MAX_CAPACITY}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition">+</button>
              </div>
            </div>

            <div className={`border rounded-xl p-4 transition ${isOpenGroup ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/40 border-gray-800 opacity-40 pointer-events-none select-none'}`}>
              <p className="text-xs font-medium text-gray-400 mb-3">External Join</p>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => handleExternalChange(external - 1)} disabled={!isOpenGroup || external <= 0}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition">−</button>
                <span className={`text-2xl font-bold ${isOpenGroup ? 'text-green-400' : 'text-gray-600'}`}>{external}</span>
                <button type="button" onClick={() => handleExternalChange(external + 1)} disabled={!isOpenGroup || total >= MAX_CAPACITY}
                  className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition">+</button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Total: <span className="text-white font-bold">{total}</span>
            <span className="text-gray-600"> / {MAX_CAPACITY} max</span>
          </p>

          {apiError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">{apiError}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creating…' : (isOpenGroup ? 'Create Group' : 'Make Reservation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
