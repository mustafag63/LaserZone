import { useState } from 'react'

export function CalendarAndTimePicker({ onDateChange, onTimeChange, selectedDate, selectedTime }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null)

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const selectedDateString = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : ''

  const isDateSelected = (day) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    )
  }

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onDateChange(newDate)
  }

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30'
  ]

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h3>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
          >
            ← Prev
          </button>
          <span className="text-lg font-semibold text-gray-800">{monthName}</span>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}
          {days.map((day) => (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded py-2 text-sm font-medium transition ${
                isDateSelected(day)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {selectedDate && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Selected: <span className="font-semibold">{selectedDate.toDateString()}</span>
          </p>
        )}
      </div>

      {/* Time Slot Picker */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Time Slot</h3>

        <div className="grid grid-cols-4 gap-3">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => onTimeChange(time)}
              className={`py-2 px-3 rounded text-sm font-medium transition ${
                selectedTime === time
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        {selectedTime && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Selected Time: <span className="font-semibold">{selectedTime}</span>
          </p>
        )}
      </div>
    </div>
  )
}
