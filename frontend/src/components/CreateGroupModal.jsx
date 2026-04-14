import { useState, useEffect } from 'react'
import CalendarSlotPicker from './CalendarSlotPicker'
import { apiCall } from '../utils/api'

const ARENA_CAPACITY = 10

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function parseDateTR(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return `${WEEKDAYS_TR[d.getDay()]}, ${d.getDate()} ${MONTHS_TR[d.getMonth()]}`
}

export default function CreateGroupModal({ onClose, onCreated }) {
  const [groupName, setGroupName] = useState('')
  const [partySize, setPartySize] = useState(4)
  const [visibility, setVisibility] = useState('open')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [slots, setSlots] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  // Fetch availability slots
  useEffect(() => {
    const fetchSlots = async () => {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + 13)
      const fmt = d => d.toISOString().split('T')[0]
      try {
        const res = await fetch(
          `http://localhost:5000/api/slots/availability?start_date=${fmt(start)}&end_date=${fmt(end)}`
        )
        const data = await res.json()
        const mapped = []
        Object.entries(data.availability || {}).forEach(([date, daySlots]) => {
          daySlots.forEach(slot => {
            mapped.push({
              date,
              time: slot.start_time.slice(0, 5),
              status: slot.is_available ? 'available' : 'booked',
            })
          })
        })
        setSlots(mapped)
      } catch {
        setSlots([])
      }
    }
    fetchSlots()
  }, [])

  // missing = how many more people need to join after leader
  const missing = partySize - 1

  const validate = () => {
    const errs = {}
    if (!groupName.trim()) errs.name = 'Grup adı zorunludur'
    else if (groupName.trim().length < 2) errs.name = 'En az 2 karakter olmalı'
    if (!selectedDate || !selectedTime) errs.slot = 'Lütfen tarih ve saat seçin'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError('')
    try {
      const data = await apiCall('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          partySize,
          date: selectedDate,
          startTime: selectedTime,
          status: visibility,
        }),
      })
      onCreated(data.group ?? data)
    } catch (err) {
      setApiError(err.message || 'Grup oluşturulamadı')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  const pct = Math.min((partySize / ARENA_CAPACITY) * 100, 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Yeni Grup Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Grup Adı</label>
            <input
              type="text"
              value={groupName}
              onChange={e => { setGroupName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })) }}
              placeholder="örn. Yıldız Takımı, Cuma Macerası..."
              className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Party Size */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Hedef Oyuncu Sayısı
              <span className="text-gray-500 font-normal ml-2">(2 – {ARENA_CAPACITY})</span>
            </label>

            {/* Stepper */}
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => setPartySize(p => Math.max(2, p - 1))}
                disabled={partySize <= 2}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >−</button>
              <span className="w-12 text-center text-2xl font-bold text-white">{partySize}</span>
              <button
                type="button"
                onClick={() => setPartySize(p => Math.min(ARENA_CAPACITY, p + 1))}
                disabled={partySize >= ARENA_CAPACITY}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >+</button>
              <span className="text-gray-500 text-sm ml-1">oyuncu</span>
            </div>

            {/* Capacity info card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Toplam Kapasite</p>
                  <p className="text-white font-bold text-xl">{ARENA_CAPACITY}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Sizin Grubunuz</p>
                  <p className="text-purple-400 font-bold text-xl">{partySize}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Eksik</p>
                  <p className="text-green-400 font-bold text-xl">{missing}</p>
                </div>
              </div>

              {/* Mini progress */}
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {missing > 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-800/50 rounded-lg">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-green-300 text-sm font-medium">+{missing} kişi daha aranıyor</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-300 text-sm font-medium">Grup kapasitesi dolu</span>
                </div>
              )}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Grup Görünürlüğü</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('open')}
                className={`relative p-4 rounded-xl border-2 text-left transition ${
                  visibility === 'open'
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    visibility === 'open' ? 'border-green-500' : 'border-gray-500'
                  }`}>
                    {visibility === 'open' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <span className={`font-semibold text-sm ${visibility === 'open' ? 'text-green-300' : 'text-gray-300'}`}>
                    Açık
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed pl-6">
                  Başkaları görebilir ve katılım isteği gönderebilir
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('closed')}
                className={`relative p-4 rounded-xl border-2 text-left transition ${
                  visibility === 'closed'
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    visibility === 'closed' ? 'border-blue-500' : 'border-gray-500'
                  }`}>
                    {visibility === 'closed' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className={`font-semibold text-sm ${visibility === 'closed' ? 'text-blue-300' : 'text-gray-300'}`}>
                    Kapalı
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed pl-6">
                  Sadece lider görebilir, dışarıdan istek gelmez
                </p>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tarih & Saat</label>
            {errors.slot && <p className="mb-2 text-sm text-red-400">{errors.slot}</p>}
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <CalendarSlotPicker
                onSlotSelect={(date, time) => {
                  setSelectedDate(date)
                  setSelectedTime(time)
                  setErrors(p => ({ ...p, slot: '' }))
                }}
                mockSlots={slots}
                daysAhead={14}
              />
            </div>
          </div>

          {/* Preview card (shown after slot selected) */}
          {selectedDate && selectedTime && (
            <div className="bg-gray-800/60 border border-purple-700/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Önizleme</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{groupName || 'Grup Adı'}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {parseDateTR(selectedDate)} · {selectedTime}
                    {' · '}
                    <span className={visibility === 'open' ? 'text-green-400' : 'text-blue-400'}>
                      {visibility === 'open' ? 'Açık Grup' : 'Kapalı Grup'}
                    </span>
                  </p>
                  {missing > 0 && visibility === 'open' && (
                    <p className="text-green-400 text-xs mt-1.5 font-semibold">
                      +{missing} kişi daha aranıyor
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
              {apiError}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Oluşturuluyor...' : 'Grubu Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
