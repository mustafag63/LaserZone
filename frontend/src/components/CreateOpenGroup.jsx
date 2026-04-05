import { useState } from 'react'
import { CalendarAndTimePicker } from './CalendarAndTimePicker'

export function CreateOpenGroup() {
  const [formData, setFormData] = useState({
    groupName: '',
    targetPartySize: 2,
    gameMode: 'Casual',
    selectedDate: null,
    selectedTime: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'targetPartySize' ? parseInt(value) : value,
    }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      selectedDate: date,
    }))
  }

  const handleTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.groupName.trim()) {
      setError('Group name is required')
      return
    }
    if (formData.targetPartySize < 2 || formData.targetPartySize > 20) {
      setError('Party size must be between 2 and 20')
      return
    }
    if (!formData.selectedDate) {
      setError('Please select a date')
      return
    }
    if (!formData.selectedTime) {
      setError('Please select a time slot')
      return
    }

    setIsSubmitting(true)

    try {
      // Format the date and time for API
      const dateStr = formData.selectedDate.toISOString().split('T')[0]
      const dateTimeStr = `${dateStr}T${formData.selectedTime}:00`

      // Placeholder API call
      const response = await fetch('/api/groups/create-open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: formData.groupName,
          targetPartySize: formData.targetPartySize,
          gameMode: formData.gameMode,
          scheduledDateTime: dateTimeStr,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create open group')
      }

      const data = await response.json()
      console.log('Group created:', data)

      // Route to dashboard (placeholder for now)
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Error creating group:', err)
      setError(err.message || 'Failed to create open group. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Open Group</h1>
          <p className="text-lg text-gray-600">
            Start a laser tag session and invite other players to join
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Form Section 1: Group Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Group Details</h2>

              <div className="space-y-5">
                {/* Group Name */}
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                    Group / Lobby Name
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleInputChange}
                    placeholder="e.g., Weekend Warriors"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.groupName.length}/50 characters</p>
                </div>

                {/* Target Party Size */}
                <div>
                  <label htmlFor="targetPartySize" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Party Size (Total Players Needed)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      id="targetPartySize"
                      name="targetPartySize"
                      value={formData.targetPartySize}
                      onChange={handleInputChange}
                      min={2}
                      max={20}
                      className="w-20 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
                    />
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(formData.targetPartySize, 8) }).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                          {i + 1}
                        </div>
                      ))}
                      {formData.targetPartySize > 8 && (
                        <span className="text-gray-600 font-medium">+{formData.targetPartySize - 8}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Must be between 2 and 20 players</p>
                </div>

                {/* Game Mode */}
                <div>
                  <label htmlFor="gameMode" className="block text-sm font-medium text-gray-700 mb-2">
                    Game Mode Preference
                  </label>
                  <select
                    id="gameMode"
                    name="gameMode"
                    value={formData.gameMode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    <option value="Casual">
                      🎮 Casual - Fun and relaxed gameplay
                    </option>
                    <option value="Competitive">
                      🏆 Competitive - Fast-paced and intense
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Form Section 2: Date & Time */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Schedule Session</h2>
              <CalendarAndTimePicker
                onDateChange={handleDateChange}
                onTimeChange={handleTimeChange}
                selectedDate={formData.selectedDate}
                selectedTime={formData.selectedTime}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? 'Publishing...' : '🚀 Publish Open Group'}
              </button>
              <button
                type="button"
                className="py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>

            {/* Summary Card */}
            {formData.groupName && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Preview:</span> "{formData.groupName}" • {formData.targetPartySize} players ({formData.gameMode}) • {formData.selectedDate?.toDateString() || 'Date TBD'} @ {formData.selectedTime || 'Time TBD'}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
