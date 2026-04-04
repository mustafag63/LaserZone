# Calendar Slot Picker - Advanced Integration Guide

## API Integration Patterns

### Pattern 1: Fetch Slots from Backend
```jsx
import { useEffect, useState } from 'react'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

export default function ReservationPage() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch available slots from backend
    fetch('/api/slots/available')
      .then(res => res.json())
      .then(data => {
        setSlots(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading slots...</div>
  if (error) return <div>Error: {error}</div>

  const handleSlotSelect = (date, time) => {
    // Create booking
    fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    })
  }

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={slots}
    />
  )
}
```

### Pattern 2: With Authentication
```jsx
import { useAuth } from '../context/AuthContext'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

export default function AuthenticatedBooking() {
  const { user, token } = useAuth()

  const handleSlotSelect = async (date, time) => {
    if (!token) {
      // Redirect to login
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          time,
          userId: user.id,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        alert('Booking successful!')
      }
    } catch (error) {
      console.error('Booking error:', error)
    }
  }

  return (
    <div>
      <h1>Book a Session</h1>
      <p>Welcome, {user?.name}</p>
      <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
    </div>
  )
}
```

### Pattern 3: With Loading and Error States
```jsx
import { useState } from 'react'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

export default function RobustBooking() {
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [bookedSlot, setBookedSlot] = useState(null)

  const handleSlotSelect = async (date, time) => {
    setIsBooking(true)
    setBookingError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const result = await response.json()
      setBookedSlot({ date, time })

      // Success notification
      showSuccessNotification('Booking confirmed!')
    } catch (error) {
      setBookingError(error.message)
      console.error('Booking failed:', error)
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div>
      <CalendarSlotPicker
        onSlotSelect={handleSlotSelect}
      />

      {isBooking && <div className="p-4 bg-blue-100">Booking...</div>}
      {bookingError && <div className="p-4 bg-red-100">{bookingError}</div>}
      {bookedSlot && (
        <div className="p-4 bg-green-100">
          Booked: {bookedSlot.date} at {bookedSlot.time}
        </div>
      )}
    </div>
  )
}
```

## Custom Slot Data Examples

### Example 1: Backend API Response
```javascript
// GET /api/slots/available
const slotsFromAPI = [
  {
    date: "2026-04-03",
    time: "10:00",
    status: "available",
    capacity: 8,
    current: 3,
  },
  {
    date: "2026-04-03",
    time: "11:00",
    status: "booked",
    capacity: 8,
    current: 8,
  },
  // ... more slots
]

// Convert to component format
const formattedSlots = slotsFromAPI.map(slot => ({
  date: slot.date,
  time: slot.time,
  status: slot.current >= slot.capacity ? 'booked' : 'available',
}))

<CalendarSlotPicker mockSlots={formattedSlots} />
```

### Example 2: Database Query Result
```javascript
// SQL Query Result
const dbSlots = [
  {
    slot_id: 1,
    booking_date: '2026-04-03',
    start_time: '10:00:00',
    is_booked: false,
  },
  // ...
]

// Convert to component format
const converted = dbSlots.map(slot => ({
  date: slot.booking_date,
  time: slot.start_time.substring(0, 5),
  status: slot.is_booked ? 'booked' : 'available',
}))
```

## Real-Time Updates

### WebSocket Integration
```jsx
import { useEffect, useState } from 'react'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

export default function RealtimeBooking() {
  const [slots, setSlots] = useState([])

  useEffect(() => {
    // Initial load
    loadSlots()

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:5000/slots')

    ws.onmessage = (event) => {
      const updatedSlots = JSON.parse(event.data)
      setSlots(updatedSlots)
    }

    return () => ws.close()
  }, [])

  const loadSlots = async () => {
    const response = await fetch('/api/slots')
    const data = await response.json()
    setSlots(data)
  }

  const handleSlotSelect = (date, time) => {
    // Handle selection
  }

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={slots}
    />
  )
}
```

## Multi-Slot Selection

### Extend Component for Range Selection
```jsx
import { useState } from 'react'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

export default function MultiSlotBooking() {
  const [selectedSlots, setSelectedSlots] = useState([])

  const handleSlotSelect = (date, time) => {
    // Add to array if not already selected
    const slotId = `${date}-${time}`
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId)
      }
      return [...prev, slotId]
    })
  }

  const confirmMultiSlotBooking = async () => {
    // Convert slot IDs back to date/time objects
    const bookings = selectedSlots.map(slotId => {
      const [date, time] = slotId.split('-')
      return { date, time }
    })

    await fetch('/api/bookings/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookings }),
    })
  }

  return (
    <div>
      <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
      <p>Selected slots: {selectedSlots.length}</p>
      <button onClick={confirmMultiSlotBooking}>
        Book {selectedSlots.length} slots
      </button>
    </div>
  )
}
```

## State Management with Redux (Optional)

```jsx
// slotSlice.js
import { createSlice } from '@reduxjs/toolkit'

const slotSlice = createSlice({
  name: 'slots',
  initialState: {
    slots: [],
    selected: null,
    loading: false,
  },
  reducers: {
    setSlots: (state, action) => {
      state.slots = action.payload
    },
    selectSlot: (state, action) => {
      state.selected = action.payload
    },
  },
})

// In component
import { useDispatch, useSelector } from 'react-redux'

function BookingPage() {
  const dispatch = useDispatch()
  const slots = useSelector(state => state.slots.slots)

  const handleSlotSelect = (date, time) => {
    dispatch(selectSlot({ date, time }))
  }

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={slots}
    />
  )
}
```

## Styling Customization

### Extend with Custom CSS
```jsx
// CustomCalendar.jsx
import CalendarSlotPicker from '../components/CalendarSlotPicker'
import './CustomCalendar.css'

export default function CustomCalendar(props) {
  return (
    <div className="custom-calendar-wrapper">
      <CalendarSlotPicker {...props} />
    </div>
  )
}
```

```css
/* CustomCalendar.css */
.custom-calendar-wrapper .bg-gradient-to-r {
  /* Override default gradient */
  background: linear-gradient(90deg, #custom1, #custom2) !important;
}

.custom-calendar-wrapper button {
  /* Custom button styles */
  border-radius: 12px !important;
  font-size: 14px !important;
}
```

## Validation Before Booking

```jsx
function ValidatedBooking() {
  const handleSlotSelect = async (date, time) => {
    // Validate business logic
    if (!isValidDate(date)) {
      alert('Invalid date')
      return
    }

    if (!isBusinessHours(time)) {
      alert('Outside business hours')
      return
    }

    // Proceed with booking
    submitBooking(date, time)
  }

  const isValidDate = (date) => {
    const slotDate = new Date(date)
    const today = new Date()
    return slotDate > today
  }

  const isBusinessHours = (time) => {
    const [hour] = time.split(':')
    return hour >= 10 && hour < 21
  }

  return <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
}
```

## Error Recovery

```jsx
function ResilientBooking() {
  const [retry, setRetry] = useState(0)

  const handleSlotSelect = async (date, time) => {
    try {
      await submitBooking(date, time)
    } catch (error) {
      if (retry < 3) {
        console.log(`Retry ${retry + 1}...`)
        await new Promise(r => setTimeout(r, 1000))
        setRetry(retry + 1)
        handleSlotSelect(date, time) // Retry
      } else {
        showErrorNotification('Booking failed after 3 attempts')
      }
    }
  }

  return <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
}
```

## Testing Patterns

### Unit Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarSlotPicker from '../CalendarSlotPicker'

describe('CalendarSlotPicker', () => {
  test('calls onSlotSelect with correct date and time', () => {
    const mockHandler = jest.fn()
    render(<CalendarSlotPicker onSlotSelect={mockHandler} />)

    const timeSlot = screen.getByText('10:00 AM')
    fireEvent.click(timeSlot)

    expect(mockHandler).toHaveBeenCalledWith(
      expect.any(String),
      '10:00'
    )
  })

  test('disables booked slots', () => {
    const slots = [
      { date: '2026-04-03', time: '10:00', status: 'booked' },
    ]
    render(
      <CalendarSlotPicker
        onSlotSelect={() => {}}
        mockSlots={slots}
      />
    )

    const bookedSlot = screen.getByTitle('This slot is booked')
    expect(bookedSlot).toBeDisabled()
  })
})
```

## Performance Optimization

### Memoization
```jsx
import { useMemo } from 'react'
import CalendarSlotPicker from '../components/CalendarSlotPicker'

function OptimizedBooking({ slots, userId }) {
  const memoizedSlots = useMemo(() => {
    return slots.filter(slot => slot.capacity > 0)
  }, [slots])

  const handleSlotSelect = useMemo(() => {
    return (date, time) => {
      console.log(`User ${userId} selected ${date} ${time}`)
    }
  }, [userId])

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={memoizedSlots}
    />
  )
}
```

## Advanced Features

### Time Zone Support
```jsx
function TimezoneBooking() {
  const [timezone, setTimezone] = useState('UTC')

  const convertTime = (time, fromTz, toTz) => {
    // Convert time between timezones
  }

  const handleSlotSelect = (date, time) => {
    const convertedTime = convertTime(time, 'UTC', timezone)
    submitBooking(date, convertedTime)
  }

  return (
    <div>
      <select value={timezone} onChange={e => setTimezone(e.target.value)}>
        <option>UTC</option>
        <option>EST</option>
        <option>PST</option>
      </select>
      <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
    </div>
  )
}
```

These patterns provide a solid foundation for integrating the Calendar Slot Picker into complex booking systems.
