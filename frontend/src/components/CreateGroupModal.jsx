import { useState } from 'react'
import { apiCall } from '../utils/api'

const OPEN_HOUR = 10
const CLOSE_HOUR = 22
const MAX_CAPACITY = 20

function generateTimeSlots() {
  const slots = []
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export default function CreateGroupModal({ onClose, onCreated }) {
  const today = new Date().toISOString().split('T')[0]

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [myTeam, setMyTeam] = useState(3)       // leaderPlayerCount
  const [openSpots, setOpenSpots] = useState(0)  // spots open for outsiders
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const total = myTeam + openSpots  // partySize sent to backend

  const handleMyTeamChange = (val) => {
    const v = Math.max(1, Math.min(MAX_CAPACITY - 1, val))
    setMyTeam(v)
    // keep total ≤ 20
    if (v + openSpots > MAX_CAPACITY) setOpenSpots(MAX_CAPACITY - v)
  }

  const handleOpenSpotsChange = (val) => {
    const v = Math.max(0, Math.min(MAX_CAPACITY - myTeam, val))
    setOpenSpots(v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!name.trim() || name.trim().length < 2) {
      setApiError('Grup adı en az 2 karakter olmalıdır.')
      return
    }
    if (!date) {
      setApiError('Lütfen bir tarih seçin.')
      return
    }

    setSubmitting(true)
    try {
      const data = await apiCall('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          date,
          time,
          partySize: total,
          leaderPlayerCount: myTeam,
        }),
      })
      onCreated(data.group)
    } catch (err) {
      setApiError(err.message || 'Grup oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const myPct = Math.round((myTeam / total) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 overflow-y-auto py-8"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Grup Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Grup Adı</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="örn. Cuma Akşamı, Doğum Günü Takımı..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tarih</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Saat</label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* My Team */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Takım Arkadaşlarım
            </label>
            <p className="text-gray-500 text-xs mb-3">
              Senin getirdiğin kişi sayısı
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleMyTeamChange(myTeam - 1)}
                disabled={myTeam <= 1}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >−</button>
              <span className="w-12 text-center text-2xl font-bold text-purple-400">{myTeam}</span>
              <button
                type="button"
                onClick={() => handleMyTeamChange(myTeam + 1)}
                disabled={myTeam >= MAX_CAPACITY - 1}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >+</button>
              <span className="text-gray-500 text-sm ml-2">kişi</span>
            </div>
          </div>

          {/* Open Spots */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dışarıdan Katılıma Açık Yer
            </label>
            <p className="text-gray-500 text-xs mb-3">
              Browse Groups'tan başkalarının doldurabileceği boş koltuk sayısı
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenSpotsChange(openSpots - 1)}
                disabled={openSpots <= 1}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >−</button>
              <span className="w-12 text-center text-2xl font-bold text-green-400">{openSpots}</span>
              <button
                type="button"
                onClick={() => handleOpenSpotsChange(openSpots + 1)}
                disabled={total >= MAX_CAPACITY}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >+</button>
              <span className="text-gray-500 text-sm ml-2">koltuk</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wide">Grup Önizleme</p>

            <div className="flex justify-between items-center text-sm mb-1.5">
              <span className="text-gray-400">Takım arkadaşlarım</span>
              <span className="text-purple-400 font-bold">{myTeam} kişi</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-400">Dışarıdan açık koltuk</span>
              <span className="text-green-400 font-bold">{openSpots} koltuk</span>
            </div>

            {/* Stacked bar */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                style={{ width: `${myPct}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${100 - myPct}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  Ben
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Açık
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                Toplam: <span className="text-white">{total}</span>
                <span className="text-gray-500 font-normal"> / {MAX_CAPACITY} max</span>
              </p>
            </div>
          </div>

          {apiError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
              {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
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
              {submitting ? 'Oluşturuluyor…' : 'Grubu Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
