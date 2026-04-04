import { useState } from 'react'
import CalendarSlotPicker from './CalendarSlotPicker'
import SuccessModal from './SuccessModal'

export default function ReservationForm() {
  // Slot selection state
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  // Form state
  const [playerCount, setPlayerCount] = useState(2)
  const [specialRequests, setSpecialRequests] = useState('')

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Form validation
  const [validationErrors, setValidationErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!selectedDate) {
      newErrors.date = 'Please select a date'
    }
    if (!selectedTime) {
      newErrors.time = 'Please select a time'
    }
    if (!playerCount || playerCount < 1 || playerCount > 20) {
      newErrors.playerCount = 'Number of players must be between 1 and 20'
    }

    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSlotSelect = (date, time) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setError(null)
    setValidationErrors({})
  }

  const handlePlayerCountChange = (e) => {
    const value = parseInt(e.target.value) || ''
    setPlayerCount(value)
    if (validationErrors.playerCount) {
      setValidationErrors(prev => ({
        ...prev,
        playerCount: '',
      }))
    }
  }

  const handleSpecialRequestsChange = (e) => {
    setSpecialRequests(e.target.value)
  }

  const handleConfirmReservation = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const response = await fetch('http://localhost:5001/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          playerCount,
          specialRequests,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to create reservation. Please try again.')
        return
      }

      // Success - show modal
      setShowSuccessModal(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
        setSelectedDate(null)
        setSelectedTime(null)
        setPlayerCount(2)
        setSpecialRequests('')
      }, 3000)
    } catch (err) {
      console.error('Reservation error:', err)
      setError('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const format12HourTime = (time24) => {
    const [hour] = time24.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum % 12 || 12
    return `${hour12}:00 ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Book Your LaserZone Experience
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select a date and time, then provide your reservation details
          </p>
        </div>

        {/* Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Calendar Picker */}
          <div className="lg:col-span-2">
            <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
          </div>

          {/* Right: Form Section */}
          <div className="space-y-6">
            {/* Slot Selected Indicator */}
            {selectedDate && selectedTime && (
              <div className="p-4 bg-green-50 dark:bg-green-900 border-2 border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  ✓ <span className="font-semibold">Slot Selected</span>
                </p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                  {formatDate(selectedDate)} at {format12HourTime(selectedTime)}
                </p>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Reservation Details
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleConfirmReservation} className="space-y-5">
                {/* Number of Players */}
                <div>
                  <label
                    htmlFor="playerCount"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Number of Players
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      id="playerCount"
                      name="playerCount"
                      min="1"
                      max="20"
                      value={playerCount}
                      onChange={handlePlayerCountChange}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white transition ${
                        validationErrors.playerCount
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      / 20
                    </span>
                  </div>
                  {validationErrors.playerCount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.playerCount}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    👥 Select between 1 and 20 players
                  </p>
                </div>

                {/* Special Requests */}
                <div>
                  <label
                    htmlFor="specialRequests"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Special Requests or Notes
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={specialRequests}
                    onChange={handleSpecialRequestsChange}
                    placeholder="Any special requests? Let us know..."
                    rows="4"
                    maxLength="500"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none transition"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {specialRequests.length}/500 characters
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Confirming...
                    </span>
                  ) : (
                    'Confirm Reservation'
                  )}
                </button>

                {/* Info Note */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    💳 <span className="font-semibold">Payment on-site:</span> All payments are collected at the venue. No payment information needed here.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Summary Section - Full Width Below */}
        {selectedDate && selectedTime && playerCount && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg p-8 border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                📋 Reservation Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Date */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    📅 Date
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatDate(selectedDate)}
                  </p>
                </div>

                {/* Time */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    🕐 Time
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {format12HourTime(selectedTime)}
                  </p>
                </div>

                {/* Players */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    👥 Players
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {playerCount} {playerCount === 1 ? 'Player' : 'Players'}
                  </p>
                </div>

                {/* Notes Indicator */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    📝 Notes
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {specialRequests ? '✓ Added' : 'None'}
                  </p>
                </div>
              </div>

              {/* Preview of Special Requests */}
              {specialRequests && (
                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2">
                    Your Special Requests
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {specialRequests}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        date={selectedDate}
        time={selectedTime}
        playerCount={playerCount}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  )
}
