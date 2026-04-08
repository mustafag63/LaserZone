import { useState } from 'react'
import CalendarSlotPicker from './CalendarSlotPicker'
import SuccessModal from './SuccessModal'
import { useAuth } from '../context/AuthContext'
import { formatDate, format12HourTime } from '../utils/slotHelpers'

const PRICE_PER_PLAYER = 15 // placeholder pricing in USD
const MIN_PLAYERS = 3
const MAX_PLAYERS = 20

export default function ReservationForm() {
  const { token } = useAuth()

  // Slot selection state
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  // Form state
  const [reservationName, setReservationName] = useState('')
  const [playerCount, setPlayerCount] = useState(3)
  const [specialRequests, setSpecialRequests] = useState('')

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({})

  const validate = () => {
    const errors = {}
    if (!reservationName.trim() || reservationName.trim().length < 2) {
      errors.reservationName = 'Reservation name must be at least 2 characters'
    }
    if (!selectedDate) errors.slot = 'Please select a date'
    else if (!selectedTime) errors.slot = 'Please select a time slot'
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      errors.playerCount = `Players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSlotSelect = (date, time) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setError(null)
    setValidationErrors(prev => ({ ...prev, slot: undefined }))
  }

  const adjustPlayerCount = (delta) => {
    setPlayerCount(prev => {
      const next = prev + delta
      if (next < MIN_PLAYERS || next > MAX_PLAYERS) return prev
      return next
    })
    setValidationErrors(prev => ({ ...prev, playerCount: undefined }))
  }

  const handlePlayerInput = (e) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) setPlayerCount(val)
    setValidationErrors(prev => ({ ...prev, playerCount: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: reservationName.trim(),
            date: selectedDate,
            time: selectedTime,
            players: playerCount,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to create reservation. Please try again.')
        return
      }

      setShowSuccessModal(true)
    } catch (err) {
      console.error('Reservation error:', err)
      setError('A network error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    setSelectedDate(null)
    setSelectedTime(null)
    setReservationName('')
    setPlayerCount(3)
    setSpecialRequests('')
    setValidationErrors({})
  }

  const slotSelected = selectedDate && selectedTime
  const totalPrice = playerCount * PRICE_PER_PLAYER

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page Header */}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Book Your LaserZone Experience
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pick a slot, fill in your details, and confirm your reservation
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Calendar — spans 2 cols on large screens */}
          <section aria-label="Date and time selection" className="lg:col-span-2">
            <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
            {validationErrors.slot && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {validationErrors.slot}
              </p>
            )}
          </section>

          {/* Form panel */}
          <aside className="space-y-5">

            {/* Slot summary card — shown once a slot is chosen */}
            {slotSelected && (
              <div
                role="status"
                aria-label="Selected slot summary"
                className="rounded-xl border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40 p-5 space-y-3"
              >
                <h2 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Slot Summary
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                      Date
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {formatDate(selectedDate)}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                      Time
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {format12HourTime(selectedTime)}
                    </p>
                  </div>

                  {/* Players */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                      Players
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {playerCount}
                    </p>
                  </div>

                  {/* Price placeholder */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                      Est. Price
                    </p>
                    <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                      ${totalPrice}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                        (${PRICE_PER_PLAYER}/player)
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  * Price is an estimate. Final amount collected on-site.
                </p>
              </div>
            )}

            {/* Reservation Details Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                Reservation Details
              </h2>

              {/* Global error */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 p-4 bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg text-sm"
                >
                  <span className="font-semibold">Error: </span>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Reservation Name */}
                <div>
                  <label
                    htmlFor="reservationName"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Reservation Name
                  </label>
                  <input
                    id="reservationName"
                    type="text"
                    value={reservationName}
                    onChange={e => {
                      setReservationName(e.target.value)
                      setValidationErrors(prev => ({ ...prev, reservationName: undefined }))
                    }}
                    placeholder="e.g. Birthday Party, Team Night"
                    maxLength={100}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white transition ${
                      validationErrors.reservationName
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {validationErrors.reservationName && (
                    <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.reservationName}
                    </p>
                  )}
                </div>

                {/* Player Count */}
                <fieldset>
                  <legend className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Number of Players
                    <span aria-hidden="true" className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                      (1–10)
                    </span>
                  </legend>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Decrease player count"
                      onClick={() => adjustPlayerCount(-1)}
                      disabled={playerCount <= MIN_PLAYERS}
                      className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      −
                    </button>

                    <input
                      id="playerCount"
                      type="number"
                      name="playerCount"
                      min={MIN_PLAYERS}
                      max={MAX_PLAYERS}
                      value={playerCount}
                      onChange={handlePlayerInput}
                      aria-describedby={validationErrors.playerCount ? 'playerCount-error' : undefined}
                      aria-invalid={!!validationErrors.playerCount}
                      className={`w-16 text-center px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white transition ${
                        validationErrors.playerCount
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />

                    <button
                      type="button"
                      aria-label="Increase player count"
                      onClick={() => adjustPlayerCount(1)}
                      disabled={playerCount >= MAX_PLAYERS}
                      className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      +
                    </button>

                    {/* Dot indicators */}
                    <div aria-hidden="true" className="flex gap-1 flex-wrap max-w-[80px]">
                      {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i < playerCount
                              ? 'bg-purple-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {validationErrors.playerCount && (
                    <p id="playerCount-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.playerCount}
                    </p>
                  )}
                </fieldset>

                {/* Special Requests */}
                <div>
                  <label
                    htmlFor="specialRequests"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Special Requests
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests? Birthdays, accessibility needs, etc."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none transition"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">
                    {specialRequests.length}/500
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !slotSelected}
                  aria-disabled={isSubmitting || !slotSelected}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                      />
                      Confirming…
                    </span>
                  ) : (
                    'Confirm Reservation'
                  )}
                </button>

                {!slotSelected && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                    Select a date and time slot above to continue
                  </p>
                )}

                {/* Payment note */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">Payment on-site.</span> No payment info required here. Please arrive 10 minutes early.
                  </p>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        date={selectedDate}
        time={selectedTime}
        playerCount={playerCount}
        onClose={handleSuccessClose}
      />
    </div>
  )
}
