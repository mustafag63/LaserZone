# Quick Start Guide - Calendar Slot Picker

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Server runs at: `http://localhost:5173`

### 3. Access the Booking Demo
Navigate to: **http://localhost:5173/booking**

## Pages Available

| URL | Purpose |
|-----|---------|
| `/login` | Login page with form validation |
| `/register` | Registration page with form validation |
| `/booking` | Calendar slot picker demo |
| `/` | Redirects to login |

## Testing the Calendar Component

### Test Scenario 1: Date Selection
1. Visit `/booking`
2. Click on different dates in the horizontal scroller
3. Watch time slots update for selected date
4. Notice visual feedback on selected date

### Test Scenario 2: Slot Interaction
1. Select a date
2. Click on an available time slot (blue)
3. Notice it becomes highlighted in green
4. Try clicking a booked slot (gray) - should be disabled

### Test Scenario 3: Booking Confirmation
1. Select a date and time
2. Click "Confirm Booking"
3. See booking added to history
4. Check browser console for logged selection

## Component Integration

### In Your Pages
```jsx
import CalendarSlotPicker from '../components/CalendarSlotPicker'

function YourPage() {
  const handleSlotSelect = (date, time) => {
    console.log('Selected:', date, time)
  }

  return (
    <CalendarSlotPicker onSlotSelect={handleSlotSelect} />
  )
}
```

## Environment Setup

### Create `.env` file (optional)
```bash
VITE_API_URL=http://localhost:5000
```

The component works with or without this configuration.

## Build for Production
```bash
npm run build
npm run preview
```

Optimized build is in `dist/` folder.

## Troubleshooting

### Build fails with Tailwind warning
- Update `tailwind.config.js` content paths
- Should already be configured

### Component not rendering
- Check browser console for errors
- Ensure all imports are correct
- Verify node_modules are installed

### Styles not showing
- Clear browser cache
- Rebuild with `npm run build`
- Check Tailwind CSS classes in HTML

## File Locations

Key files for the calendar component:
- **Component:** `src/components/CalendarSlotPicker.jsx`
- **Helpers:** `src/utils/slotHelpers.js`
- **Demo:** `src/components/BookingDemo.jsx`
- **Docs:** `CALENDAR_SLOT_PICKER_SUMMARY.md`

## Next Steps

1. **Connect to Backend:**
   - Replace `generateMockSlots()` with API call
   - Fetch real slot data from `/api/slots`

2. **Customize Styling:**
   - Modify Tailwind color classes
   - Adjust grid columns in responsive breakpoints

3. **Add Features:**
   - Time range selection
   - Real-time updates
   - Timezone support
   - Recurring bookings

4. **Testing:**
   - Test on different devices
   - Test dark mode toggle
   - Verify accessibility

## Performance Tips

- Component auto-generates ~75-150 mock slots
- Filters efficiently with useEffect
- Smooth animations with CSS
- Responsive grid without heavy computation

## Support

For issues or questions:
1. Check `CALENDAR_SLOT_DOCS.md` for detailed documentation
2. Review `BookingDemo.jsx` for usage examples
3. Check browser console for error messages

Happy booking! 🎉
