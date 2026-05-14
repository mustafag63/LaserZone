// T-30 | Begüm Rana Türkoğlu | Sprint 3
// Occupancy reports & chart dashboard

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { apiCall } from '../utils/api'
import { useLanguage } from '../context/languageCore'

function shortDay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
}

function StatCard({ label, value, sub, color = 'purple' }) {
  const ring = {
    purple: 'border-purple-700 bg-purple-900/20',
    green:  'border-green-700  bg-green-900/20',
    red:    'border-red-700    bg-red-900/20',
    blue:   'border-blue-700   bg-blue-900/20',
  }[color] ?? 'border-gray-700 bg-gray-800/40'
  const text = {
    purple: 'text-purple-300',
    green:  'text-green-300',
    red:    'text-red-300',
    blue:   'text-blue-300',
  }[color] ?? 'text-gray-300'
  return (
    <div className={`rounded-xl border ${ring} px-5 py-4`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, color = '#a855f7', height = 120 }) {
  if (!data || data.length === 0) return <p className="text-center text-gray-500 text-sm py-6">No data</p>
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1)
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max((Number(d[valueKey]) / max) * 100, 2)
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1 h-full justify-end group">
            <div className="relative w-full flex justify-center">
              <span className="absolute -top-6 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {d[valueKey]} players
              </span>
            </div>
            <div className="w-full rounded-t transition-all duration-300" style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.85 }} />
            <span className="text-[10px] text-gray-500 truncate w-full text-center leading-tight">{d[labelKey]}</span>
          </div>
        )
      })}
    </div>
  )
}

function HourBar({ hour, players, max }) {
  const pct = Math.max((players / Math.max(max, 1)) * 100, 2)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-12 flex-shrink-0">{hour}</span>
      <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
        <div className="h-full rounded bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{players}</span>
    </div>
  )
}

export default function OccupancyDashboard() {
  const { t } = useLanguage()
  const [report, setReport]   = useState(null)
  const [range, setRange]     = useState('week')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiCall(`/api/admin/reports/occupancy?range=${range}`)
      setReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load report.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchReport() }, [fetchReport])

  const totalRes = report ? report.statusSummary.active + report.statusSummary.cancelled + report.statusSummary.completed : 0
  const maxHourPlayers = report ? Math.max(...report.busiestHours.map(h => Number(h.players)), 1) : 1

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Occupancy Reports</h2>
            <p className="text-gray-400 text-sm mt-1">Reservation statistics and arena usage overview</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${range === r ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                Last {r === 'week' ? '7 days' : '30 days'}
              </button>
            ))}
            <button onClick={fetchReport} disabled={loading}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-40" title="Refresh">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
              </svg>
            </button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">{error}</div>}

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />)}
            </div>
            <div className="h-48 rounded-xl bg-gray-800 animate-pulse" />
          </div>
        )}

        {!loading && report && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Reservations" value={totalRes} sub={`last ${range === 'week' ? '7' : '30'} days`} color="purple" />
              <StatCard label="Active" value={report.statusSummary.active} sub="confirmed bookings" color="green" />
              <StatCard label="Cancelled" value={report.statusSummary.cancelled} sub="cancellation rate" color="red" />
              <StatCard label="Total Players" value={report.totalPlayers} sub="from active bookings" color="blue" />
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Daily Player Count</h3>
              {report.dailyOccupancy.length === 0
                ? <p className="text-center text-gray-500 text-sm py-8">No reservations in this period.</p>
                : <BarChart data={report.dailyOccupancy.map(d => ({ ...d, label: shortDay(d.day) }))} valueKey="players" labelKey="label" height={140} />
              }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Top 5 Busiest Hours</h3>
                {report.busiestHours.length === 0
                  ? <p className="text-center text-gray-500 text-sm py-8">No data available.</p>
                  : <div className="space-y-2.5">{report.busiestHours.map((h, i) => <HourBar key={i} hour={h.hour} players={Number(h.players)} max={maxHourPlayers} />)}</div>
                }
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Group Reservations</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-sm text-gray-400">Total Groups</span>
                    <span className="text-lg font-bold text-white">{report.groupSummary.totalGroups}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-sm text-gray-400">Group Players</span>
                    <span className="text-lg font-bold text-white">{report.groupSummary.totalGroupPlayers}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-400">Avg. Fill Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${report.groupSummary.avgFillRate >= 80 ? 'bg-green-500' : report.groupSummary.avgFillRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(report.groupSummary.avgFillRate, 100)}%` }} />
                      </div>
                      <span className="text-lg font-bold text-white">{report.groupSummary.avgFillRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
