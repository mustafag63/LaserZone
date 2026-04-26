import { useState, useEffect, useRef, useCallback } from 'react'
import { apiCall } from '../utils/api'

const POLL_INTERVAL = 30_000

const TYPE_META = {
  join_request:     { color: 'text-blue-400',   bg: 'bg-blue-900/20',   label: 'Join Request' },
  request_approved: { color: 'text-green-400',  bg: 'bg-green-900/20',  label: 'Approved' },
  request_rejected: { color: 'text-red-400',    bg: 'bg-red-900/20',    label: 'Rejected' },
  group_full:       { color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Group Full' },
  group_cancelled:  { color: 'text-gray-400',   bg: 'bg-gray-700/30',   label: 'Cancelled' },
}

function TypeIcon({ type }) {
  const cls = `w-4 h-4 flex-shrink-0 ${TYPE_META[type]?.color ?? 'text-gray-400'}`
  if (type === 'join_request') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
  if (type === 'request_approved') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (type === 'request_rejected') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (type === 'group_full') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
  // group_cancelled
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiCall('/api/notifications')
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch { /* non-critical */ }
  }, [])

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setOpen(prev => !prev)
  }

  const handleMarkAllRead = async () => {
    if (unread === 0) return
    setMarkingAll(true)
    try {
      await apiCall('/api/notifications/read-all', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnread(0)
    } catch { /* ignore */ } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkRead = async (id) => {
    const notif = notifications.find(n => n.id === id)
    if (!notif || notif.isRead) return
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    try {
      await apiCall(`/api/notifications/${id}/read`, { method: 'PUT' })
    } catch {
      // Revert on error
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n))
      setUnread(prev => prev + 1)
    }
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unread === 0 || markingAll}
              className="text-xs text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-default transition"
            >
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_META[n.type] ?? TYPE_META.group_cancelled
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/60 transition ${
                      !n.isRead ? 'bg-gray-800/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type icon */}
                      <div className={`mt-0.5 w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon type={n.type} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${n.isRead ? 'text-gray-300' : 'text-white'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-gray-600">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
