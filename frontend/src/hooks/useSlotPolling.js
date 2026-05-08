// T-32 | Eylül Sena Altunsaray | Sprint 3
// Polls /api/slots/availability every 30s and returns live slot data

import { useState, useEffect, useRef, useCallback } from 'react'
import { apiCall } from '../utils/api'

const POLL_INTERVAL = 30_000

export function useSlotPolling(date) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchSlots = useCallback(async (d) => {
    if (!d) return
    try {
      setError(null)
      const data = await apiCall(`/api/slots/availability?date=${d}`)
      const normalized = (data.slots || []).map(s => ({
        date: d,
        time: s.time,
        status: s.available ? 'available' : 'booked',
        booked: s.booked ?? 0,
        capacity: s.capacity ?? 20,
      }))
      setSlots(normalized)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load slots.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!date) return
    setLoading(true)
    fetchSlots(date)

    timerRef.current = setInterval(() => fetchSlots(date), POLL_INTERVAL)

    return () => clearInterval(timerRef.current)
  }, [date, fetchSlots])

  return { slots, loading, error, lastUpdated, refresh: () => fetchSlots(date) }
}
