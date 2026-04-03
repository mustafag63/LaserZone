import { useState } from 'react'

export default function SuccessModal({ isOpen, date, time, playerCount, onClose }) {
  if (!isOpen) return null

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Reservation Confirmed!
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Your LaserZone experience is booked
        </p>

        {/* Reservation Details */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-6 space-y-3">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold uppercase tracking-wide">
              Date
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatDate(date)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold uppercase tracking-wide">
              Time
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {format12HourTime(time)}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold uppercase tracking-wide">
              Players
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {playerCount} {playerCount === 1 ? 'Player' : 'Players'}
            </p>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            💡 <span className="font-semibold">Reminder:</span> Payment will be collected on-site at the venue. Please arrive 10 minutes early.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition duration-200 shadow-lg hover:shadow-xl"
        >
          Done
        </button>
      </div>
    </div>
  )
}
