import { useState, useEffect } from 'react'
import { formatDate, format12HourTime, getDayOfWeek, generateMockSlots } from '../utils/slotHelpers'

export default function CalendarSlotPicker({
  onSlotSelect,
  startDate = new Date(),
  daysAhead = 7,
  mockSlots = null,
}) {
  const [selectedDate, setSelectedDate] = useState(
    startDate.toISOString().split('T')[0]
  )
  const [selectedTime, setSelectedTime] = useState(null)
  const [dates, setDates] = useState([])
  const [slots, setSlots] = useState([])
  const [timeSlots, setTimeSlots] = useState([])

  // Generate dates for the horizontal scroller
  useEffect(() => {
    const generatedDates = []
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      generatedDates.push(date.toISOString().split('T')[0])
    }
    setDates(generatedDates)
  }, [startDate, daysAhead])

  // Load mock slots
  useEffect(() => {
    const loadedSlots = mockSlots || generateMockSlots(startDate, daysAhead)
    setSlots(loadedSlots)
  }, [mockSlots, startDate, daysAhead])

  // Update time slots when selected date changes
  useEffect(() => {
    const selectedSlots = slots.filter(slot => slot.date === selectedDate)
    setTimeSlots(selectedSlots)
    setSelectedTime(null) // Reset selected time when date changes
  }, [selectedDate, slots])

  // Notify parent component when slot is selected
  const handleTimeSlotClick = (time, status) => {
    if (status === 'booked') return

    setSelectedTime(time)
    onSlotSelect?.(selectedDate, time)
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Date & Time
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your preferred time slot for your reservation
        </p>
      </div>

      {/* Date Scroller */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
          Choose a Date
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map(date => {
            const isSelected = date === selectedDate
            const dayOfWeek = getDayOfWeek(date)

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-xs text-opacity-90">{dayOfWeek.slice(0, 3)}</div>
                <div className="text-sm">{formatDate(date).split(',')[1].trim()}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <span className="font-semibold">Selected Date:</span> {getDayOfWeek(selectedDate)}, {formatDate(selectedDate)}
        </p>
      </div>

      {/* Time Slots */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
          Available Times
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {timeSlots.length > 0 ? (
            timeSlots.map(slot => {
              const isSelected = slot.time === selectedTime
              const isBooked = slot.status === 'booked'

              return (
                <button
                  key={`${slot.date}-${slot.time}`}
                  onClick={() => handleTimeSlotClick(slot.time, slot.status)}
                  disabled={isBooked}
                  className={`py-3 px-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isBooked
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg ring-2 ring-green-300 dark:ring-green-600'
                      : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-600 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800 dark:hover:to-cyan-800'
                  }`}
                  title={isBooked ? 'This slot is booked' : 'Available'}
                >
                  {format12HourTime(slot.time)}
                </button>
              )
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No time slots available for this date</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {selectedTime && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-sm text-green-900 dark:text-green-100">
            <span className="font-semibold">Your Selection:</span> {getDayOfWeek(selectedDate)}, {formatDate(selectedDate)} at {format12HourTime(selectedTime)}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 border border-blue-200 dark:border-blue-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Selected</span>
          </div>
        </div>
      </div>
    </div>
  )
}
