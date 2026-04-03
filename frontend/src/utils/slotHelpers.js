// Mock data for available time slots
// Format: { date: "YYYY-MM-DD", time: "HH:00", status: "available" | "booked" }

export const generateMockSlots = (startDate = new Date(), daysAhead = 7) => {
  const slots = []
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]

    hours.forEach(hour => {
      // Randomly mark some as booked for demonstration
      const isBooked = Math.random() > 0.7
      slots.push({
        date: dateStr,
        time: `${String(hour).padStart(2, '0')}:00`,
        status: isBooked ? 'booked' : 'available',
      })
    })
  }

  return slots
}

// Helper function to format date
export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Helper function to format time to 12-hour format
export const format12HourTime = (time24) => {
  const [hour] = time24.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const hour12 = hourNum % 12 || 12
  return `${hour12}:00 ${ampm}`
}

// Helper function to get day of week
export const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}
