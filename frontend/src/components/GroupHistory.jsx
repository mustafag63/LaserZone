import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'
import { useLanguage } from '../context/languageCore'

function formatDate(dateStr, locale) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
}

function format12Hour(time24) {
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const mins = m && m !== '00' ? `:${m}` : ''
  return `${hour % 12 || 12}${mins} ${hour >= 12 ? 'PM' : 'AM'}`
}

function CapacityBar({ current, total, className = '' }) {
  const { t } = useLanguage()
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{current} / {total} {t('players').toLowerCase()}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gray-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function GroupHistory() {
  const { t, locale } = useLanguage()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiCall('/api/groups/history')
      .then(data => setGroups(data.groups))
      .catch(err => setError(err.message || t('actionFailed')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">{t('groupHistory')}</h2>
          <p className="text-gray-400 text-sm mt-1">{t('groupHistorySubtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">{t('noGroupHistory')}</p>
            <p className="text-gray-600 text-sm mt-1">{t('noGroupHistoryHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => {
              const isCancelled = g.status === 'cancelled'
              return (
                <div key={g.id} className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="text-white font-semibold">{g.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          isCancelled
                            ? 'text-gray-400 bg-gray-700/50 border-gray-600'
                            : 'text-blue-400 bg-blue-900/30 border-blue-700'
                        }`}>
                          {isCancelled ? t('cancelled') : t('completed')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border text-purple-300 bg-purple-900/30 border-purple-700">
                          {g.role === 'leader' ? t('roleLeader') : t('roleMember')}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {formatDate(g.date, locale)} · {format12Hour(g.startTime)} – {format12Hour(g.endTime)}
                      </p>
                      <CapacityBar current={g.currentCount} total={g.partySize} className="mt-3" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
