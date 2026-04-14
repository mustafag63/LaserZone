import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

function parseDateTR(dateStr) {
  if (!dateStr) return { weekday: '—', short: '—', full: '—' }
  const d = new Date(dateStr + 'T00:00:00')
  const weekday = WEEKDAYS_TR[d.getDay()]
  const day = d.getDate()
  const month = MONTHS_TR[d.getMonth()]
  const year = d.getFullYear()
  return { weekday, short: `${day} ${month}`, full: `${weekday}, ${day} ${month} ${year}` }
}

function fmtTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

// ─── Capacity Progress Bar ────────────────────────────────────────────────────

function CapacityInfo({ current, total }) {
  const remaining = total - current
  const isFull = remaining <= 0
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  const barColor = isFull
    ? 'bg-blue-500'
    : pct >= 75
    ? 'bg-yellow-500'
    : 'bg-green-500'

  return (
    <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
      {isFull ? (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-blue-300">Bu grup dolu</span>
          <span className="text-gray-500 text-xs">· {total} kişilik</span>
        </div>
      ) : (
        <p className="text-sm mb-2">
          <span className="font-semibold text-white">{total} kişilik grup</span>
          <span className="text-gray-500"> — </span>
          <span className="text-yellow-400">{current} dolu</span>
          <span className="text-gray-500"> — </span>
          <span className="text-green-400 font-semibold">{remaining} kişi daha gerekiyor</span>
        </p>
      )}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>0</span>
        <span>{total} kişi</span>
      </div>
    </div>
  )
}

// ─── Filters ──────────────────────────────────────────────────────────────────

const TIME_OPTIONS = [
  { value: '', label: 'Tüm saatler' },
  { value: '08', label: '08:00 – 10:00' },
  { value: '10', label: '10:00 – 12:00' },
  { value: '12', label: '12:00 – 14:00' },
  { value: '14', label: '14:00 – 16:00' },
  { value: '16', label: '16:00 – 18:00' },
  { value: '18', label: '18:00 – 20:00' },
  { value: '20', label: '20:00 – 22:00' },
]

const CAPACITY_OPTIONS = [
  { value: 'all', label: 'Tüm gruplar' },
  { value: 'available', label: 'Yer olanlar' },
  { value: '1+', label: '1+ yer boş' },
  { value: '3+', label: '3+ yer boş' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrowseGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')
  const [capacityFilter, setCapacityFilter] = useState('all')

  // Join modal
  const [joinModal, setJoinModal] = useState(null)
  const [playerCount, setPlayerCount] = useState(1)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinMessage, setJoinMessage] = useState(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (dateFilter) params.set('date', dateFilter)
      const qs = params.toString()
      const data = await apiCall(`/api/groups${qs ? `?${qs}` : ''}`)
      setGroups(data.groups || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Gruplar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGroups() }, [dateFilter])

  // Client-side filtering: only open groups + time/capacity filters
  const filteredGroups = groups.filter(g => {
    if (g.status && g.status !== 'open') return false
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false
    if (timeFilter && g.startTime && !g.startTime.startsWith(timeFilter)) return false
    const remaining = (g.partySize ?? 0) - (g.currentCount ?? 0)
    if (capacityFilter === 'available' && remaining <= 0) return false
    if (capacityFilter === '1+' && remaining < 1) return false
    if (capacityFilter === '3+' && remaining < 3) return false
    return true
  })

  const hasActiveFilters = searchQuery || dateFilter || timeFilter || capacityFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setTimeFilter('')
    setCapacityFilter('all')
    setTimeout(fetchGroups, 0)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchGroups()
  }

  const handleJoinSubmit = async () => {
    if (!joinModal) return
    try {
      setJoinLoading(true)
      setJoinMessage(null)
      await apiCall(`/api/groups/${joinModal.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ playerCount }),
      })
      setJoinMessage({ type: 'success', text: 'Katılım isteği başarıyla gönderildi!' })
      setTimeout(() => {
        setJoinModal(null)
        setJoinMessage(null)
        setPlayerCount(1)
        fetchGroups()
      }, 1500)
    } catch (err) {
      setJoinMessage({ type: 'error', text: err.message || 'İstek gönderilemedi' })
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Açık Gruplar</h2>
          <p className="text-gray-400 text-sm mt-1">Bir gruba katılım isteği gönder</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Grup Adı</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ara..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Tarih</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Time slot */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Saat Aralığı</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition"
                >
                  {TIME_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Kontenjan</label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition"
                >
                  {CAPACITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition"
              >
                Ara
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg text-sm transition"
                >
                  Temizle
                </button>
              )}
              {!loading && (
                <span className="text-gray-500 text-xs ml-auto">
                  {filteredGroups.length} grup listeleniyor
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>

        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">Açık grup bulunamadı</p>
            <p className="text-gray-600 text-sm mt-1">Filtrelerinizi değiştirin veya daha sonra tekrar deneyin.</p>
          </div>

        ) : (
          <div className="space-y-4">
            {filteredGroups.map(g => {
              const remaining = (g.partySize ?? 0) - (g.currentCount ?? 0)
              const isFull = remaining <= 0
              const isOwn = g.leaderUsername === user?.username
              const dateInfo = parseDateTR(g.date ?? g.scheduledDate)

              return (
                <div
                  key={g.id}
                  className={`bg-gray-800 border rounded-xl p-5 transition ${
                    isFull
                      ? 'border-gray-700/60 opacity-75'
                      : 'border-gray-700 hover:border-purple-600'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFull ? 'bg-gray-500' : 'bg-green-400'}`} />
                        <h3 className="text-white font-semibold text-base leading-tight">{g.name}</h3>
                        {g.gameMode && (
                          <span className="px-2 py-0.5 bg-purple-900/40 border border-purple-700/50 rounded-full text-xs text-purple-300 font-medium">
                            {g.gameMode}
                          </span>
                        )}
                      </div>

                      {/* Slot info */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                        {/* Day + Date */}
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-purple-300 font-semibold">{dateInfo.weekday}</span>
                          <span>{dateInfo.short}</span>
                        </span>

                        {/* Time */}
                        {(g.startTime || g.endTime) && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-white">{fmtTime(g.startTime)}</span>
                            {g.endTime && <span>– {fmtTime(g.endTime)}</span>}
                          </span>
                        )}

                        {/* Leader */}
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {g.leaderUsername}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 pt-0.5">
                      {isOwn ? (
                        <span className="px-3 py-1.5 bg-gray-700 rounded-full text-xs font-medium text-gray-400">
                          Sizin Grubunuz
                        </span>
                      ) : isFull ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-700 text-gray-500 font-medium rounded-lg text-sm cursor-not-allowed"
                        >
                          Dolu
                        </button>
                      ) : (
                        <button
                          onClick={() => { setJoinModal(g); setPlayerCount(1); setJoinMessage(null) }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg text-sm transition shadow"
                        >
                          Katıl
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <CapacityInfo current={g.currentCount ?? 0} total={g.partySize ?? 0} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Join Request Modal */}
      {joinModal && (() => {
        const dateInfo = parseDateTR(joinModal.date ?? joinModal.scheduledDate)
        const spotsLeft = (joinModal.partySize ?? 0) - (joinModal.currentCount ?? 0)
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-white mb-1">"{joinModal.name}" grubuna katıl</h3>
              <p className="text-gray-400 text-sm mb-5">
                <span className="text-purple-300 font-medium">{dateInfo.weekday}</span>
                {', '}{dateInfo.short}
                {' · '}{fmtTime(joinModal.startTime)}{joinModal.endTime ? ` – ${fmtTime(joinModal.endTime)}` : ''}
                {' · '}<span className="text-green-400">{spotsLeft} yer boş</span>
              </p>

              <label className="block text-gray-300 text-sm font-medium mb-2">
                Kaç kişiyle katılıyorsunuz?
              </label>
              <input
                type="number"
                min={1}
                max={spotsLeft}
                value={playerCount}
                onChange={(e) => setPlayerCount(Math.max(1, Math.min(spotsLeft, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 mb-4"
              />

              {joinMessage && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  joinMessage.type === 'success'
                    ? 'bg-green-900/30 border border-green-700 text-green-300'
                    : 'bg-red-900/30 border border-red-700 text-red-300'
                }`}>
                  {joinMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setJoinModal(null); setJoinMessage(null) }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg text-sm transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleJoinSubmit}
                  disabled={joinLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg text-sm transition shadow disabled:opacity-50"
                >
                  {joinLoading ? 'Gönderiliyor...' : 'İstek Gönder'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </DashboardLayout>
  )
}
