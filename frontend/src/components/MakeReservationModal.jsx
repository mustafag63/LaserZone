import { useState, useEffect, useMemo } from 'react'
import CalendarSlotPicker from './CalendarSlotPicker'

// Maximum number of players the arena can accommodate in one session
const ARENA_CAPACITY = 20

export default function MakeReservationModal({ onClose, onSave, existingReservations = [] }) {
  const [reservationName, setReservationName] = useState('')
  const [players, setPlayers] = useState(3)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [errors, setErrors] = useState({})
  const [slots, setSlots] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  // Group visibility: 'open' allows join requests, 'closed' is private
  const [groupType, setGroupType] = useState('open')

  // Fetch real availability from API
  useEffect(() => {
    const fetchSlots = async () => {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 6)

      const fmt = d => d.toISOString().split('T')[0]

      try {
        const res = await fetch(
          `http://localhost:5000/api/slots/availability?start_date=${fmt(startDate)}&end_date=${fmt(endDate)}`
        )
        const data = await res.json()

        const mapped = []
        Object.entries(data.availability || {}).forEach(([date, daySlots]) => {
          daySlots.forEach(slot => {
            const time = slot.start_time.slice(0, 5) // "HH:MM"
            const isReserved = existingReservations.some(
              r => r.date === date && r.time === time
            )
            mapped.push({
              date,
              time,
              status: isReserved || !slot.is_available ? 'booked' : 'available',
            })
          })
        })

        setSlots(mapped)
      } catch {
        setSlots([])
      }
    }

    fetchSlots()
  }, [existingReservations])

  const handleSlotSelect = (date, time) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setErrors(prev => ({ ...prev, slot: '' }))
  }

  const decrement = () => setPlayers(p => Math.max(3, p - 1))
  const increment = () => setPlayers(p => Math.min(ARENA_CAPACITY, p + 1))

  // Capacity metrics derived from current player count
  const capacityInfo = useMemo(() => {
    const fillRatio = players / ARENA_CAPACITY          // 0.0 – 1.0
    const remaining = ARENA_CAPACITY - players           // empty slots left

    // Progress bar colour: green → yellow → red as arena fills
    let barColor = 'bg-green-500'
    if (fillRatio > 0.75) barColor = 'bg-red-500'
    else if (fillRatio > 0.5) barColor = 'bg-yellow-400'

    return { fillRatio, remaining, barColor }
  }, [players])

  const validate = () => {
    const newErrors = {}
    if (!reservationName.trim()) {
      newErrors.name = 'Reservation name is required'
    } else if (reservationName.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!selectedDate || !selectedTime) {
      newErrors.slot = 'Please select a date and time'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: reservationName.trim(),
          date: selectedDate,
          time: selectedTime,
          players,
          type: groupType, // 'open' | 'closed' — controls join-request visibility
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setApiError(data.message || 'Failed to create reservation.')
        return
      }

      onSave({
        id: data.reservation.id,
        name: reservationName.trim(),
        date: selectedDate,
        time: selectedTime,
        players,
        type: groupType,
        createdAt: new Date().toISOString(),
      })
    } catch {
      setApiError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">New Reservation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reservation Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reservation Name
            </label>
            <input
              type="text"
              value={reservationName}
              onChange={e => {
                setReservationName(e.target.value)
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder="e.g. Birthday Party, Friday Night..."
              className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Players */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Players
              <span className="text-gray-500 font-normal ml-2">(min 3 – max {ARENA_CAPACITY})</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decrement}
                disabled={players <= 3}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                −
              </button>
              <span className="w-12 text-center text-2xl font-bold text-white">{players}</span>
              <button
                type="button"
                onClick={increment}
                disabled={players >= ARENA_CAPACITY}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                +
              </button>
              <span className="text-gray-500 text-sm ml-2">players</span>
            </div>
          </div>

          {/* ── Open / Closed toggle ── */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Group Visibility
            </label>
            <div className="flex gap-3">
              {/* Open button */}
              <button
                type="button"
                onClick={() => setGroupType('open')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-semibold text-sm transition-all duration-200 ${
                  groupType === 'open'
                    ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_12px_2px_rgba(34,197,94,0.35)]'
                    : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                {/* Unlock icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Open
              </button>

              {/* Closed button */}
              <button
                type="button"
                onClick={() => setGroupType('closed')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-semibold text-sm transition-all duration-200 ${
                  groupType === 'closed'
                    ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_12px_2px_rgba(239,68,68,0.3)]'
                    : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                {/* Lock icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 7a4 4 0 10-8 0v4h8V7z" />
                </svg>
                Closed
              </button>
            </div>
          </div>

          {/* ── Capacity preview panel ── */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">Arena Capacity</span>
              <span className="text-white font-bold">
                {players} / {ARENA_CAPACITY}
              </span>
            </div>

            {/* Progress bar with smooth colour transition */}
            <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${capacityInfo.barColor}`}
                style={{ width: `${capacityInfo.fillRatio * 100}%` }}
              />
            </div>

            {/* Context-sensitive helper message */}
            {groupType === 'open' ? (
              <p className="text-xs text-green-400">
                {capacityInfo.remaining > 0
                  ? `${players} kişiyle açıyorsan +${capacityInfo.remaining} daha katılabilir`
                  : 'Arena tamamen dolu — katılım için yer yok'}
              </p>
            ) : (
              <p className="text-xs text-red-400">
                Özel rezervasyon — dış katılım kapalı
              </p>
            )}
          </div>

          {/* Calendar Slot Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date & Time
            </label>
            {errors.slot && (
              <p className="mb-2 text-sm text-red-400">{errors.slot}</p>
            )}
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <CalendarSlotPicker
                onSlotSelect={handleSlotSelect}
                mockSlots={slots}
              />
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
              {apiError}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
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
              {submitting ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
