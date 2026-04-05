import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import CalendarSlotPicker from './CalendarSlotPicker'
import { apiCall } from '../utils/api'

export default function CreateOpenGroup() {
  const navigate = useNavigate()

  const [groupName, setGroupName] = useState('')
  const [maxPartySize, setMaxPartySize] = useState(4)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSlotSelect = (date, time) => {
    setSelectedDate(date)
    setSelectedTime(time)
  }

  const isFormValid =
    groupName.trim().length > 0 &&
    selectedDate !== null &&
    selectedTime !== null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setLoading(true)
    setError(null)

    try {
      const scheduledDateTime = `${selectedDate}T${selectedTime}:00`
      const data = await apiCall('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          groupName: groupName.trim(),
          maxPartySize,
          description: description.trim() || undefined,
          isPublic,
          scheduledDateTime,
        }),
      })

      const groupId = data.group?.id ?? data.id
      navigate(`/groups/${groupId}`)
    } catch (err) {
      setError(err.message || 'Failed to create group. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Create Open Group</h1>
          <p className="text-gray-400 text-sm mt-1">
            Set up a session and let others join your laser tag game.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Group Details */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Group Details
            </h2>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Group Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value.slice(0, 40))}
                  placeholder="e.g. Friday Night Squad"
                  maxLength={40}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500">
                  {groupName.length}/40
                </span>
              </div>
            </div>

            {/* Max Party Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Max Party Size
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={maxPartySize}
                  onChange={(e) => setMaxPartySize(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1.5 text-white font-semibold text-sm">
                  {maxPartySize}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1 px-0.5">
                <span>2</span>
                <span>players</span>
                <span>10</span>
              </div>
              {/* Player dots */}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      i < maxPartySize
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${i < maxPartySize ? 'text-purple-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description{' '}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Tell others what to expect — playstyle, skill level, etc."
                rows={3}
                maxLength={200}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
              />
              <p className="text-xs text-gray-500 text-right mt-1">{description.length}/200</p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-300">Public Group</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isPublic
                    ? 'Anyone can find and join this group'
                    : 'Only people with the link can join'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isPublic ? 'bg-purple-600' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={isPublic}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Slot Picker */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
              Schedule <span className="text-red-400">*</span>
            </h2>
            <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
          </section>

          {/* Summary + Error */}
          {(isFormValid || error) && (
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              {isFormValid && (
                <>
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Summary
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Group Name</dt>
                      <dd className="text-white font-medium">{groupName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Max Players</dt>
                      <dd className="text-white font-medium">{maxPartySize}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Date</dt>
                      <dd className="text-white font-medium">{selectedDate}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Time</dt>
                      <dd className="text-white font-medium">{selectedTime}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Visibility</dt>
                      <dd className="text-white font-medium">{isPublic ? 'Public' : 'Private'}</dd>
                    </div>
                    {description && (
                      <div className="col-span-2">
                        <dt className="text-gray-500">Description</dt>
                        <dd className="text-white font-medium">{description}</dd>
                      </div>
                    )}
                  </dl>
                </>
              )}

              {error && (
                <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </section>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 sm:flex-none sm:min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition shadow-lg text-sm"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                'Create Group'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
