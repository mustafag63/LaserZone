# Calendar Slot Picker Component

## Overview
A reusable React component for selecting booking dates and time slots. Features a horizontal 7-day date scroller and responsive time slot grid with availability management.

## Location
- Component: `src/components/CalendarSlotPicker.jsx`
- Helpers: `src/utils/slotHelpers.js`
- Demo: `src/components/BookingDemo.jsx` (optional usage example)

## Features
✅ Horizontal 7-day date scroller
✅ Time slot grid with 1-hour intervals (10 AM - 8 PM)
✅ Three slot states: Available, Booked, Selected
✅ Dark mode support
✅ Responsive grid (2-5 columns based on screen size)
✅ Smooth animations and transitions
✅ Mock data generation for testing
✅ Callback notifications to parent component
✅ Comprehensive legend and status displays

## Props

### `onSlotSelect` (Function) - **Required**
Callback function triggered when user selects a time slot.

**Signature:**
```javascript
onSlotSelect(date, time) => void
// date: string (YYYY-MM-DD format)
// time: string (HH:00 format in 24-hour)
```

**Example:**
```jsx
const handleSlotSelect = (date, time) => {
  console.log(`Selected: ${date} at ${time}`)
  // Send to API or update state
}

<CalendarSlotPicker onSlotSelect={handleSlotSelect} />
```

### `startDate` (Date) - Optional
Starting date for the date scroller. Defaults to today.

```jsx
<CalendarSlotPicker
  onSlotSelect={handleSlotSelect}
  startDate={new Date('2026-04-10')}
/>
```

### `daysAhead` (Number) - Optional
Number of days to display in the scroller. Defaults to 7.

```jsx
<CalendarSlotPicker
  onSlotSelect={handleSlotSelect}
  daysAhead={14}
/>
```

### `mockSlots` (Array) - Optional
Custom mock data array. If not provided, auto-generates realistic slots.

**Format:**
```javascript
[
  {
    date: "2026-04-03",
    time: "10:00",  // 24-hour format
    status: "available" | "booked"
  },
  // ... more slots
]
```

**Example:**
```jsx
const customSlots = [
  { date: "2026-04-03", time: "10:00", status: "available" },
  { date: "2026-04-03", time: "11:00", status: "booked" },
  { date: "2026-04-03", time: "12:00", status: "available" },
]

<CalendarSlotPicker
  onSlotSelect={handleSlotSelect}
  mockSlots={customSlots}
/>
```

## Helper Functions

### `generateMockSlots(startDate, daysAhead)`
Generates mock slot data with random availability.

```javascript
import { generateMockSlots } from '../utils/slotHelpers'

const slots = generateMockSlots(new Date(), 14)
// Returns array of 14 × 11 hours = 154 slots
```

### `formatDate(dateStr)`
Formats date string (YYYY-MM-DD) to readable format.

```javascript
formatDate("2026-04-03") // "Apr, 3"
```

### `format12HourTime(time24)`
Converts 24-hour format to 12-hour AM/PM format.

```javascript
format12HourTime("14:00") // "2:00 PM"
format12HourTime("10:00") // "10:00 AM"
```

### `getDayOfWeek(dateStr)`
Returns full day name.

```javascript
getDayOfWeek("2026-04-03") // "Friday"
```

## Slot States

### Available (Clickable)
- **Background:** Blue gradient (light on light mode, dark on dark mode)
- **Border:** Blue accent
- **Cursor:** Pointer
- **Interaction:** Click to select

### Booked (Disabled)
- **Background:** Gray (lighter gray on light mode, darker gray on dark mode)
- **Text:** Gray (muted)
- **Cursor:** Not-allowed
- **Interaction:** Cannot click

### Selected (Highlighted)
- **Background:** Green gradient
- **Ring:** Green focus ring
- **Shadow:** Subtle shadow
- **Text:** White
- **Interaction:** Confirmed state

## Usage Examples

### Basic Usage
```jsx
import CalendarSlotPicker from './components/CalendarSlotPicker'

function ReservationPage() {
  const handleSlotSelect = (date, time) => {
    console.log(`Booking for ${date} at ${time}`)
  }

  return <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
}
```

### With Custom Data
```jsx
import CalendarSlotPicker from './components/CalendarSlotPicker'

function ReservationPage() {
  const mySlots = [
    { date: "2026-04-03", time: "10:00", status: "available" },
    { date: "2026-04-03", time: "11:00", status: "booked" },
    // ...
  ]

  const handleSlotSelect = (date, time) => {
    // Handle selection
  }

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={mySlots}
    />
  )
}
```

### With Date Range
```jsx
const startDate = new Date('2026-04-10')

<CalendarSlotPicker
  onSlotSelect={handleSlotSelect}
  startDate={startDate}
  daysAhead={30}
/>
```

### Full Integration Example
```jsx
import { useState } from 'react'
import CalendarSlotPicker from './components/CalendarSlotPicker'

export default function BookingPage() {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSlotSelect = (date, time) => {
    setSelectedSlot({ date, time })
  }

  const confirmBooking = async () => {
    if (!selectedSlot) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSlot),
      })

      if (response.ok) {
        alert('Booking confirmed!')
        setSelectedSlot(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <CalendarSlotPicker onSlotSelect={handleSlotSelect} />

      {selectedSlot && (
        <button
          onClick={confirmBooking}
          disabled={isLoading}
        >
          {isLoading ? 'Booking...' : 'Confirm Booking'}
        </button>
      )}
    </div>
  )
}
```

## API Integration

### Fetching Real Slot Data
```jsx
import { useEffect, useState } from 'react'
import CalendarSlotPicker from './components/CalendarSlotPicker'

function ReservationPage() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch from your backend
    fetch('/api/slots/available')
      .then(res => res.json())
      .then(data => {
        setSlots(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <CalendarSlotPicker
      onSlotSelect={handleSlotSelect}
      mockSlots={slots}
    />
  )
}
```

### Sending Booking to API
```jsx
const handleSlotSelect = (date, time) => {
  // Immediately submit to API or save temporarily
  fetch('/api/bookings/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date,
      time,
      userId: currentUser.id
    }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Show success message
    }
  })
}
```

## Styling & Customization

### Dark Mode
The component automatically supports dark mode with TailwindCSS. All colors are defined to work in both light and dark contexts.

### Color Scheme
- **Primary (Selected):** Green (#10b981 - emerald-500)
- **Secondary (Available):** Blue (#0ea5e9 - cyan-500)
- **Disabled (Booked):** Gray (#d1d5db - gray-300)
- **Accent (Button):** Purple to Pink gradient

### Responsive Breakpoints
| Screen | Columns | Gap |
|--------|---------|-----|
| Mobile (< 640px) | 2 | 0.75rem |
| Tablet (640px - 1024px) | 3 | 0.75rem |
| Small Desktop (1024px) | 4 | 0.75rem |
| Large Desktop (1280px+) | 5 | 0.75rem |

## Performance Notes
- The component efficiently re-renders only when props or selected state changes
- Time slot filtering is done in a useEffect hook
- Date scroller is scrollable but not virtualized (suitable for 7-30 day ranges)
- Mock data generation is memoized when using generateMockSlots

## Browser Support
- Chrome/Edge: Latest versions
- Firefox: Latest versions
- Safari: Latest versions (12+)
- Mobile browsers: All modern versions

## Testing
Use `BookingDemo.jsx` to test the component functionality:
- Date selection
- Time slot availability
- Booking confirmation
- History tracking

## Accessibility
- Buttons are properly labeled and focusable
- Selected state is visually distinct
- Color is not the only indicator (icons and text also indicate state)
- Keyboard navigation works on all interactive elements

## Future Enhancements
- [ ] Add time range selection (e.g., 1-2 hour blocks)
- [ ] Real-time slot availability updates (WebSocket)
- [ ] Custom time ranges per day
- [ ] Recurring bookings
- [ ] Calendar month view alternative
- [ ] Timezone support
