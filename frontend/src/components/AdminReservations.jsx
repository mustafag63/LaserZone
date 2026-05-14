import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'
import { useLanguage } from '../context/languageCore'

const STATUS_STYLE = {
  active: 'bg-green-900/30 text-green-400 border-green-700',
  cancelled: 'bg-red-900/30 text-red-400 border-red-700',
  completed: 'bg-gray-700/60 text-gray-300 border-gray-600',
}

function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
}

function format12Hour(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const mins = m && m !== '00' ? `:${m}` : ''
  return `${hour % 12 || 12}${mins} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function AdminReservations() {
  const { t, locale } = useLanguage()
  const [reservations, setReservations] = useState([])
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (date) params.set('date', date)
    const value = params.toString()
    return value ? `?${value}` : ''
  }, [status, date])

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiCall(`/api/admin/reservations${query}`)
      setReservations(data.reservations || [])
    } catch (err) {
      setError(err.message || t('failedLoadReservations'))
    } finally {
      setLoading(false)
    }
  }, [query, t])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const runAction = async (id, action) => {
    if (!window.confirm(t(action === 'approve' ? 'approveConfirm' : 'cancelAdminConfirm'))) return

    setNotice('')
    setError('')
    setActionLoading(prev => ({ ...prev, [id]: action }))
    try {
      const data = await apiCall(`/api/admin/reservations/${id}/${action}`, { method: 'PUT' })
      const nextStatus = data.reservation?.status || (action === 'approve' ? 'active' : 'cancelled')
      setReservations(prev => prev.map(r => (r.id === id ? { ...r, status: nextStatus } : r)))
      setNotice(data.message || t(action === 'approve' ? 'reservationApproved' : 'reservationCancelled'))
    } catch (err) {
      setError(err.message || t('actionFailed'))
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('adminReservations')}</h2>
            <p className="text-gray-400 text-sm mt-1">{t('reviewAdminReservations')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="text-left">
              <span className="block text-xs font-medium text-gray-400 mb-1">{t('status')}</span>
              <select
                value={status}
                onChange={event => setStatus(event.target.value)}
                className="w-full sm:w-40 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="">{t('all')}</option>
                <option value="active">{t('active')}</option>
                <option value="cancelled">{t('cancelled')}</option>
                <option value="completed">{t('completed')}</option>
              </select>
            </label>

            <label className="text-left">
              <span className="block text-xs font-medium text-gray-400 mb-1">{t('date')}</span>
              <input
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
                className="w-full sm:w-44 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </label>

            {(status || date) && (
              <button
                onClick={() => { setStatus(''); setDate('') }}
                className="self-end px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition"
              >
                {t('clear')}
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-300">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">{t('noReservationsFound')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] gap-4 border-b border-gray-800 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500 lg:grid">
              <span>{t('reservation')}</span>
              <span>{t('date')}</span>
              <span>{t('time')}</span>
              <span>{t('players')}</span>
              <span className="text-right">{t('actions')}</span>
            </div>

            <div className="divide-y divide-gray-800">
              {reservations.map(reservation => {
                const action = actionLoading[reservation.id]
                const canApprove = reservation.status !== 'active' && reservation.status !== 'completed'
                const canCancel = reservation.status !== 'cancelled' && reservation.status !== 'completed'

                return (
                  <div
                    key={reservation.id}
                    className="grid gap-4 px-5 py-4 text-left lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{reservation.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[reservation.status] || STATUS_STYLE.active}`}>
                          {t(reservation.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">@{reservation.username}</p>
                    </div>

                    <p className="text-sm text-gray-300">{formatDate(reservation.date, locale)}</p>
                    <p className="text-sm text-gray-300">
                      {format12Hour(reservation.startTime)} - {format12Hour(reservation.endTime)}
                    </p>
                    <p className="text-sm text-gray-300">{reservation.players}</p>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <button
                        onClick={() => runAction(reservation.id, 'approve')}
                        disabled={!canApprove || !!action}
                        className="px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {action === 'approve' ? t('approving') : t('approve')}
                      </button>
                      <button
                        onClick={() => runAction(reservation.id, 'cancel')}
                        disabled={!canCancel || !!action}
                        className="px-3 py-1.5 text-xs font-medium bg-red-900/50 hover:bg-red-800 text-red-300 border border-red-800 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {action === 'cancel' ? t('cancelling') : t('cancel')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
