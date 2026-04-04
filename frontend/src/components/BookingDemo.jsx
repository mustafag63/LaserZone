import { useState } from 'react'
import CalendarSlotPicker from './CalendarSlotPicker'

export default function BookingDemo() {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingHistory, setBookingHistory] = useState([])

  const handleSlotSelect = (date, time) => {
    setSelectedSlot({ date, time })
    console.log('Slot selected:', { date, time })
  }

  const handleConfirmBooking = () => {
    if (selectedSlot) {
      setBookingHistory([...bookingHistory, selectedSlot])
      setSelectedSlot(null)
      alert(`Booking confirmed for ${selectedSlot.date} at ${selectedSlot.time}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            LaserZone Booking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reserve your preferred time slot
          </p>
        </div>

        {/* Calendar Picker */}
        <div className="flex justify-center">
          <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
        </div>

        {/* Booking Actions */}
        {selectedSlot && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleConfirmBooking}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Confirm Booking
            </button>
            <button
              onClick={() => setSelectedSlot(null)}
              className="px-8 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Booking History */}
        {bookingHistory.length > 0 && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Booking History
            </h2>
            <div className="space-y-2">
              {bookingHistory.map((booking, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-900 dark:text-blue-100"
                >
                  ✓ Booking {index + 1}: {booking.date} at {booking.time}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
