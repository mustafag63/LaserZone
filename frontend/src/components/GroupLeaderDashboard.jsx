import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('tr-TR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [hour, minute] = timeStr.split(':')
  const h = parseInt(hour)
  return `${String(h).padStart(2, '0')}:${minute}`
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    open: 'bg-green-900/40 text-green-400 border-green-700',
    closed: 'bg-blue-900/40 text-blue-400 border-blue-700',
    cancelled: 'bg-red-900/40 text-red-400 border-red-700',
  }
  const labels = { open: 'Açık', closed: 'Kapalı', cancelled: 'İptal' }
  const cls = map[status] ?? 'bg-gray-700 text-gray-400 border-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const cls = type === 'success'
    ? 'bg-green-900/90 border-green-700 text-green-200'
    : 'bg-red-900/90 border-red-700 text-red-200'

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${cls} animate-fade-in`}>
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function PartyProgress({ current, total }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0
  const isFull = current >= total
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>{current}/{total} kişi</span>
        <span className={isFull ? 'text-blue-400 font-semibold' : 'text-gray-400'}>
          {isFull ? 'Grup dolu' : `+${total - current} kişi daha gerekiyor`}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? 'bg-blue-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ req, groupId, onAction }) {
  const [loading, setLoading] = useState(null) // 'approve' | 'reject'

  const handleAction = async (action) => {
    setLoading(action)
    try {
      await apiCall(`/api/groups/${groupId}/requests/${req.id}/${action}`, { method: 'POST' })
      onAction(req.id, action)
    } catch (err) {
      console.log(`[GroupLeaderDashboard] ${action} failed:`, err)
      onAction(req.id, action, err.message || `${action} işlemi başarısız`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-700/50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {req.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{req.username ?? 'Bilinmiyor'}</p>
          <p className="text-gray-400 text-xs">
            {req.playerCount ?? req.player_count ?? 1} oyuncu · {formatDateTime(req.createdAt ?? req.created_at)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => handleAction('approve')}
          disabled={!!loading}
          className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-700 text-green-400 text-xs font-semibold rounded-lg transition disabled:opacity-40 flex items-center gap-1"
        >
          {loading === 'approve' ? (
            <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Onayla
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={!!loading}
          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-700 text-red-400 text-xs font-semibold rounded-lg transition disabled:opacity-40 flex items-center gap-1"
        >
          {loading === 'reject' ? (
            <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Reddet
        </button>
      </div>
    </div>
  )
}

// ─── Requests Section ─────────────────────────────────────────────────────────

function PendingRequests({ group, onToast }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const isFull = group.currentCount >= group.partySize

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiCall(`/api/groups/${group.id}/requests`)
      const pending = (data.requests ?? data ?? []).filter(r => r.status === 'pending' || !r.status)
      setRequests(pending)
    } catch (err) {
      console.log('[GroupLeaderDashboard] fetchRequests failed:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [group.id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = (reqId, action, errorMsg) => {
    if (errorMsg) {
      onToast(errorMsg, 'error')
    } else {
      setRequests(prev => prev.filter(r => r.id !== reqId))
      onToast(action === 'approve' ? 'İstek onaylandı.' : 'İstek reddedildi.', 'success')
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-700/60">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="text-sm font-semibold text-gray-300">Bekleyen İstekler</span>
        {!loading && requests.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-600 rounded-full text-xs text-white font-bold">
            {requests.length}
          </span>
        )}
      </div>

      {isFull && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-800/50 rounded-lg mb-3 text-blue-300 text-xs">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Bu grup dolu — yeni istek kabul edilemiyor.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 text-xs text-center py-3">Bekleyen istek yok.</p>
      ) : (
        <div>
          {requests.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              groupId={group.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, onToast }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-700/60 transition-colors">
      {/* Card Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-base truncate">{group.name}</h3>
              <StatusBadge status={group.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(group.date ?? group.scheduledDate)}
              </span>
              {(group.startTime || group.endTime) && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(group.startTime)}
                  {group.endTime ? ` – ${formatTime(group.endTime)}` : ''}
                </span>
              )}
              {group.gameMode && (
                <span className="capitalize text-purple-400 font-medium">{group.gameMode}</span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition flex-shrink-0"
            title={expanded ? 'Kapat' : 'İstekleri Göster'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <PartyProgress current={group.currentCount ?? group.current_count ?? 0} total={group.partySize ?? group.party_size ?? 0} />
      </div>

      {/* Pending requests (expandable) */}
      {expanded && (
        <div className="px-5 pb-4">
          <PendingRequests group={{
            ...group,
            currentCount: group.currentCount ?? group.current_count ?? 0,
            partySize: group.partySize ?? group.party_size ?? 0,
          }} onToast={onToast} />
        </div>
      )}
    </div>
  )
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GROUPS = [
  {
    id: 1,
    name: 'Yıldız Takımı',
    date: '2026-04-20',
    startTime: '14:00',
    endTime: '15:30',
    status: 'open',
    partySize: 10,
    currentCount: 6,
    gameMode: 'Competitive',
  },
  {
    id: 2,
    name: 'Lazer Şöleni',
    date: '2026-04-22',
    startTime: '16:00',
    endTime: '17:00',
    status: 'open',
    partySize: 8,
    currentCount: 8,
    gameMode: 'Casual',
  },
  {
    id: 3,
    name: 'Arkadaş Maçı',
    date: '2026-04-18',
    startTime: '11:00',
    endTime: '12:00',
    status: 'closed',
    partySize: 6,
    currentCount: 6,
    gameMode: 'Casual',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroupLeaderDashboard() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiCall('/api/groups/my-groups')
      setGroups(data.groups ?? data ?? [])
    } catch (err) {
      console.log('[GroupLeaderDashboard] fetchGroups failed, using mock data:', err)
      setGroups(MOCK_GROUPS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">Gruplarım</h2>
            <p className="text-gray-400 text-sm mt-1">Oluşturduğun grup rezervasyonlarını yönet</p>
          </div>
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Gruplar yükleniyor…</p>
          </div>

        ) : groups.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-300 font-semibold text-lg">Henüz grup rezervasyonunuz yok</p>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">
              Yeni bir grup oluşturarak arkadaşlarınla lazer tagda buluşabilirsin.
            </p>
          </div>

        ) : (
          /* Group Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} onToast={showToast} />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  )
}
