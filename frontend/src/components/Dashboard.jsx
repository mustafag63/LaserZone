import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from './DashboardLayout'
import MakeReservationModal from './MakeReservationModal'
import { apiCall } from '../utils/api'

// ─── Mock data (API yokken fallback) ───────────────────────────────────────
const MOCK_RESERVATIONS = [
  {
    id: 1,
    arenaName: 'Arena A - Ana Saha',
    date: '2026-04-20',
    startTime: '14:00',
    endTime: '15:00',
    players: 8,
    totalPrice: 400,
    status: 'confirmed',
  },
  {
    id: 2,
    arenaName: 'Arena B - VIP Zone',
    date: '2026-04-25',
    startTime: '16:00',
    endTime: '17:00',
    players: 5,
    totalPrice: 300,
    status: 'pending',
  },
  {
    id: 3,
    arenaName: 'Arena A - Ana Saha',
    date: '2026-04-10',
    startTime: '10:00',
    endTime: '11:00',
    players: 10,
    totalPrice: 500,
    status: 'completed',
  },
  {
    id: 4,
    arenaName: 'Arena C - Battle Zone',
    date: '2026-04-05',
    startTime: '18:00',
    endTime: '19:00',
    players: 6,
    totalPrice: 360,
    status: 'cancelled',
  },
]

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Bekleyen',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  confirmed: {
    label: 'Onaylı',
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
  cancelled: {
    label: 'İptal',
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    dot: 'bg-gray-500',
  },
  completed: {
    label: 'Tamamlandı',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'confirmed', label: 'Onaylı' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'completed', label: 'Tamamlandı' },
]

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('tr-TR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function format12Hour(time24) {
  if (!time24) return '—'
  const [hour, minute = '00'] = time24.split(':')
  const h = parseInt(hour)
  return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
}

// ─── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${
        type === 'success'
          ? 'bg-green-950 border-green-700 text-green-200'
          : 'bg-red-950 border-red-700 text-red-200'
      }`}
    >
      {type === 'success' ? (
        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Cancel Confirmation Modal ───────────────────────────────────────────────
function CancelModal({ reservation, onConfirm, onClose, loading }) {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Rezervasyonu İptal Et</h3>
              <p className="text-gray-400 text-sm mt-0.5">Bu işlem geri alınamaz.</p>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4">
            Bu rezervasyonu iptal etmek istediğinize emin misiniz?
          </p>

          {/* Reservation summary */}
          {reservation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-6">
              <p className="text-white font-semibold text-sm">{reservation.arenaName || reservation.name}</p>
              <p className="text-gray-400 text-xs mt-1">
                {formatDate(reservation.date)} · {format12Hour(reservation.startTime || reservation.time)} · {reservation.players} oyuncu
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'İptal ediliyor...' : 'Evet, İptal Et'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Reservation Modal ──────────────────────────────────────────────────
function EditModal({ reservation, onSave, onClose, loading, externalError }) {
  const [date, setDate] = useState(reservation?.date || '')
  const [startTime, setStartTime] = useState(reservation?.startTime || reservation?.time || '')
  const [players, setPlayers] = useState(reservation?.players || 3)
  const [localError, setLocalError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  const handleSave = () => {
    if (!date) { setLocalError('Lütfen bir tarih seçin.'); return }
    if (!startTime) { setLocalError('Lütfen bir saat seçin.'); return }
    if (date < today) { setLocalError('Geçmiş bir tarih seçemezsiniz.'); return }
    setLocalError('')
    onSave({ date, startTime, players })
  }

  const error = localError || externalError

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-lg">Rezervasyonu Düzenle</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Arena (read-only) */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Arena</p>
            <p className="text-white font-medium">{reservation?.arenaName || reservation?.name}</p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tarih</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => { setDate(e.target.value); setLocalError('') }}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Saat</label>
            <select
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setLocalError('') }}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition appearance-none"
            >
              <option value="">Saat seçin</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {format12Hour(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Players */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Oyuncu Sayısı
              <span className="text-gray-500 font-normal ml-2">(3–20)</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPlayers((p) => Math.max(3, p - 1))}
                disabled={players <= 3}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                −
              </button>
              <span className="w-12 text-center text-2xl font-bold text-white">{players}</span>
              <button
                type="button"
                onClick={() => setPlayers((p) => Math.min(20, p + 1))}
                disabled={players >= 20}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                +
              </button>
              <span className="text-gray-500 text-sm ml-1">oyuncu</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition font-medium disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showMakeModal, setShowMakeModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editError, setEditError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // ── Load ──
  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiCall('/api/reservations/my')
      setReservations(sortByDateDesc(data.reservations || []))
    } catch {
      // API unavailable — use mock data
      setReservations(sortByDateDesc(MOCK_RESERVATIONS))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReservations() }, [loadReservations])

  // ── Toast helper ──
  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Cancel ──
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await apiCall(`/api/reservations/${cancelTarget.id}/cancel`, { method: 'PUT' })
    } catch (err) {
      // If it's not a network-level fail, surface the message; otherwise proceed optimistically
      if (err?.status && err.status !== 0) {
        showToast(err.message || 'İptal işlemi başarısız.', 'error')
        setActionLoading(false)
        setCancelTarget(null)
        return
      }
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === cancelTarget.id ? { ...r, status: 'cancelled' } : r))
    )
    showToast('Rezervasyon başarıyla iptal edildi.')
    setActionLoading(false)
    setCancelTarget(null)
  }

  // ── Edit ──
  const handleEditSave = async ({ date, startTime, players }) => {
    if (!editTarget) return
    setActionLoading(true)
    setEditError('')
    try {
      await apiCall(`/api/reservations/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ date, startTime, players }),
      })
    } catch (err) {
      if (err?.status === 409) {
        setEditError(err.message || 'Bu tarih/saat dolu. Lütfen farklı bir slot seçin.')
        setActionLoading(false)
        return
      }
      // Network fail — optimistic update
    }
    setReservations((prev) =>
      sortByDateDesc(
        prev.map((r) => (r.id === editTarget.id ? { ...r, date, startTime, players } : r))
      )
    )
    showToast('Rezervasyon başarıyla güncellendi.')
    setActionLoading(false)
    setEditTarget(null)
  }

  // ── New reservation from Make modal ──
  const handleNewReservation = (newRes) => {
    setReservations((prev) =>
      sortByDateDesc([
        {
          ...newRes,
          arenaName: newRes.name,
          startTime: newRes.time,
          status: 'pending',
          totalPrice: null,
        },
        ...prev,
      ])
    )
    setShowMakeModal(false)
    showToast('Rezervasyon başarıyla oluşturuldu!')
  }

  // ── Filter ──
  const counts = FILTER_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = opt.value === 'all'
      ? reservations.length
      : reservations.filter((r) => r.status === opt.value).length
    return acc
  }, {})

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter)

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Rezervasyonlarım</h2>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Yükleniyor...' : `${reservations.length} rezervasyon`}
            </p>
          </div>
          <button
            onClick={() => setShowMakeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Rezervasyon Yap
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === opt.value
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
              }`}
            >
              {opt.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === opt.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {counts[opt.value]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Rezervasyonlar yükleniyor...</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-800/40 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 font-medium mb-1">Bir hata oluştu</p>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button
              onClick={loadReservations}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {filter === 'all' ? (
              <>
                <p className="text-gray-400 font-medium">Henüz rezervasyon yok</p>
                <p className="text-gray-600 text-sm mt-1 mb-5">
                  İlk seansınızı rezerve etmek için "Rezervasyon Yap"a tıklayın.
                </p>
                <button
                  onClick={() => setShowMakeModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition shadow-lg"
                >
                  Rezervasyon Yap
                </button>
              </>
            ) : (
              <p className="text-gray-400 font-medium">
                Bu durumda rezervasyon bulunamadı.
              </p>
            )}
          </div>
        )}

        {/* ── Reservation List ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={() => setCancelTarget(r)}
                onEdit={() => { setEditError(''); setEditTarget(r) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showMakeModal && (
        <MakeReservationModal
          onClose={() => setShowMakeModal(false)}
          onSave={handleNewReservation}
          existingReservations={reservations}
        />
      )}

      {cancelTarget && (
        <CancelModal
          reservation={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          loading={actionLoading}
        />
      )}

      {editTarget && (
        <EditModal
          reservation={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
          loading={actionLoading}
          externalError={editError}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  )
}

// ─── Reservation Card (extracted for readability) ────────────────────────────
function ReservationCard({ reservation: r, onCancel, onEdit }) {
  const canEdit = r.status === 'pending'
  const canCancel = r.status === 'pending' || r.status === 'confirmed'

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 hover:border-gray-600 transition group">
      <div className="flex items-start justify-between gap-4">
        {/* ── Left: Icon + Info ── */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{r.arenaName || r.name}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
              {/* Date */}
              <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(r.date)}
              </span>

              {/* Time */}
              <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {format12Hour(r.startTime || r.time)}
                {r.endTime ? ` – ${format12Hour(r.endTime)}` : ''}
              </span>

              {/* Players */}
              <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {r.players} oyuncu
              </span>

              {/* Price */}
              {r.totalPrice != null && (
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {r.totalPrice} ₺
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Badge + Actions ── */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <StatusBadge status={r.status} />

          {canEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Düzenle
            </button>
          )}

          {canCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition border border-red-800/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
