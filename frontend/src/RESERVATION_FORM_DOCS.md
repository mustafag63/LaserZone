# Standard Reservation Form - Documentation

## Overview
A complete reservation booking page that integrates the Calendar and Time Slot Picker component with a detailed reservation form. Users can select dates/times, specify player count, add special requests, and submit reservations with real-time validation and success confirmation.

## Location
- Main Component: `src/components/ReservationForm.jsx`
- Success Modal: `src/components/SuccessModal.jsx`
- Route: `/reservation`

## Features

### 📅 Calendar Integration
✅ Full Calendar and Time Slot Picker component
✅ Visual feedback showing selected slot
✅ Real-time date and time selection
✅ All slot states (available, booked, selected)

### 📝 Reservation Form
✅ **Number of Players** - Input range 1-20 with validation
✅ **Special Requests** - Textarea for notes (up to 500 characters)
✅ **Field-level validation** - Real-time error messages
✅ **Form disabling** - Until slot is selected
✅ **Loading state** - Shows spinner during submission

### 📊 Summary Card
✅ **Sticky position** - Stays visible while scrolling
✅ **Real-time updates** - Shows selected values
✅ **Visual indicators** - Icons for each field
✅ **Character counter** - Tracks special requests
✅ **Special requests preview** - Shows full notes when added

### ✅ Success Workflow
✅ **Success modal** - Displays confirmation with details
✅ **Auto-reset** - Clears form after 3 seconds
✅ **Booking details** - Shows date, time, player count
✅ **On-site payment reminder** - Informs users about venue payment
✅ **Visual success icon** - Green checkmark animation

### 🔐 Security & Validation
✅ **JWT authentication** - Includes token in request
✅ **User ID tracking** - Associates reservation with user
✅ **Client-side validation** - Prevents invalid submissions
✅ **Error handling** - User-friendly error messages
✅ **Network error recovery** - Handles API failures

### 🎨 UI/UX
✅ **Responsive layout** - 2-column on desktop, 1-column on mobile
✅ **Dark mode support** - Full dark theme integration
✅ **Sticky form** - Follows user on scroll (desktop)
✅ **Smooth animations** - Fade-in effects
✅ **Visual hierarchy** - Clear section organization

## Component Structure

```
ReservationForm (Main)
├── CalendarSlotPicker (Left side - Date/Time selection)
├── Form Card (Right side - Details & Player count)
│   ├── Player Count Input
│   ├── Special Requests Textarea
│   └── Submit Button
├── Summary Section (Full width - Below)
│   ├── Date Card
│   ├── Time Card
│   ├── Players Card
│   ├── Notes Indicator
│   └── Special Requests Preview
└── SuccessModal (Overlay)
    ├── Success Icon
    ├── Confirmation Details
    ├── Payment Reminder
    └── Done Button
```

## State Management

### Slot Selection State
```jsx
selectedDate: string (YYYY-MM-DD)
selectedTime: string (HH:00)
```

### Form State
```jsx
playerCount: number (1-20)
specialRequests: string (0-500 chars)
```

### Submission State
```jsx
isSubmitting: boolean
error: string | null
showSuccessModal: boolean
validationErrors: object
```

## API Integration

### Endpoint
```
POST /api/reservations
```

### Request Payload
```json
{
  "date": "2026-04-03",
  "time": "14:00",
  "playerCount": 4,
  "specialRequests": "Birthday party, want team matching",
  "userId": 123
}
```

### Expected Response
```json
{
  "success": true,
  "reservationId": 456,
  "message": "Reservation created successfully",
  "reservation": {
    "id": 456,
    "userId": 123,
    "date": "2026-04-03",
    "time": "14:00",
    "playerCount": 4,
    "specialRequests": "Birthday party, want team matching",
    "status": "confirmed",
    "createdAt": "2026-04-03T10:30:00Z"
  }
}
```

## Form Validation

### Client-Side Validation
| Field | Rules | Error Message |
|-------|-------|---------------|
| Date | Required, selected from picker | "Please select a date" |
| Time | Required, selected from picker | "Please select a time" |
| Player Count | 1-20, numeric | "Must be between 1 and 20" |
| Special Requests | Optional, max 500 chars | Auto-truncated |

### Validation Flow
1. Form submit → Validate all fields
2. Show field-level error messages
3. Prevent submission if invalid
4. Clear errors on input change
5. Auto-validate on retry

## UI States

### Initial State
- Calendar visible
- Form disabled (grayed out)
- Summary hidden
- No errors shown

### After Slot Selection
- Calendar visible
- Form enabled
- "Slot Selected" indicator appears
- Summary visible with selected values
- Player count has default (2 players)

### During Submission
- Submit button disabled
- Loading spinner shown
- All form inputs disabled
- User cannot change selections

### On Success
- Modal displays with confirmation
- Shows all reservation details
- Payment reminder displayed
- Auto-resets form after 3 seconds

### On Error
- Error message displayed at top of form
- User can retry
- Form remains filled (doesn't clear)

## Responsive Layout

### Desktop (1024px+)
```
[Calendar (2/3)] [Form (1/3)]
[Summary - Full Width]
```

### Mobile (< 1024px)
```
[Calendar - Full Width]
[Form - Full Width]
[Summary - Full Width]
```

### Form Sticky Position
- **Desktop:** Sticky to top after scroll
- **Mobile:** Full height on small screens
- **Tablet:** Adapts based on available space

## Component Props

### ReservationForm
No required props. Component is self-contained.

## Helper Functions (Within Component)

### `formatDate(dateStr)`
Converts `YYYY-MM-DD` to readable format:
```
"2026-04-03" → "Apr, 3"
```

### `format12HourTime(time24)`
Converts `14:00` to `2:00 PM`:
```
"14:00" → "2:00 PM"
```

## Accessibility

✅ All form labels have `htmlFor` attributes
✅ Input fields have unique IDs
✅ Error messages linked to fields
✅ Keyboard navigation supported
✅ ARIA labels on modal
✅ Color not only indicator of state (icons used)
✅ Loading spinner has `aria-busy` concept
✅ Modal is focusable

## Loading States

### Button States
```
Default: "Confirm Reservation"
Loading: "Confirming..." + spinner
Disabled: When no slot selected or submitting
```

### Form States
- Default: All inputs enabled
- Submitting: All inputs disabled
- Error: Inputs re-enabled for retry

## Error Handling

### Error Messages
| Scenario | Message | Shown Where |
|----------|---------|------------|
| Network error | "An error occurred..." | Top of form |
| API error | Server message (e.g., slot taken) | Top of form |
| Validation error | Field-specific message | Below field |
| Missing slot | Submit button disabled | Tooltip hint |

### Error Recovery
1. Error displayed to user
2. Form remains filled
3. User can modify and retry
4. Error clears on successful submission

## Success Workflow

### Steps
1. User selects date/time
2. User fills in player count & notes
3. User clicks "Confirm Reservation"
4. Loading state shows
5. API request sent
6. Success modal appears with details
7. Auto-reset after 3 seconds
8. User can make another reservation

### Modal Display
- Shows reservation date, time, player count
- Displays payment reminder
- Has "Done" button to close
- Modal closes automatically (3 sec)

## Dark Mode

All elements support dark mode:
- Dark background: `dark:bg-gray-900`
- Dark text: `dark:text-white`
- Dark borders: `dark:border-gray-600`
- Dark form fields: `dark:bg-gray-800`

## Performance Optimization

### React Hooks
- `useState` - Local state management
- Form fields update independently
- Efficient re-renders

### Input Handling
- Controlled inputs (state-driven)
- Debounce not needed (simple form)
- Real-time character counter

### API Calls
- Single POST request
- Async/await pattern
- Proper error boundaries

## TypeScript Support (Optional)

If using TypeScript:
```typescript
interface ReservationPayload {
  date: string
  time: string
  playerCount: number
  specialRequests: string
  userId: number
}

interface SuccessResponse {
  success: boolean
  reservationId: number
  reservation: Reservation
}
```

## Integration with Auth

### Authentication
- Reads token from localStorage
- Reads user ID from localStorage
- Includes token in Authorization header
- Auto-redirects on 401 (handled by API util)

### Navigation
- Login/Register redirect to `/reservation`
- Users go directly to booking after auth
- No extra navigation needed

## Testing Scenarios

### Test Case 1: Full Booking Flow
1. Select date and time
2. Enter player count (4)
3. Add special requests
4. Click confirm
5. Verify success modal appears

### Test Case 2: Validation
1. Try submit without slot → Error
2. Try player count 0 → Error
3. Try player count 21 → Error
4. Fix errors and retry → Success

### Test Case 3: Error Handling
1. Network offline → Error message
2. Slot taken (API error) → Display message
3. Server error (500) → Generic error
4. Retry works → Success

### Test Case 4: Responsive Design
1. View on mobile → Single column
2. View on tablet → 2 columns
3. View on desktop → 3 columns
4. Verify sticky form works

### Test Case 5: Dark Mode
1. Toggle dark mode
2. Verify all colors readable
3. Verify contrast acceptable
4. Check form styling

## Browser Compatibility

- Chrome/Edge: Latest versions ✓
- Firefox: Latest versions ✓
- Safari: 12+ ✓
- Mobile browsers: All modern ✓
- IE: Not supported

## Future Enhancements

- [ ] Add date/time change after slot selection
- [ ] Implement promo code input
- [ ] Add team size presets (2 vs 4 vs 6+)
- [ ] Store draft reservations in localStorage
- [ ] Real-time slot availability updates
- [ ] Email confirmation integration
- [ ] SMS reminder notifications
- [ ] Loyalty program points display
- [ ] Team matching preferences
- [ ] Age restriction indicators

## File Structure

```
frontend/src/components/
├── ReservationForm.jsx      (Main page)
├── SuccessModal.jsx         (Success confirmation)
├── CalendarSlotPicker.jsx   (Date/time picker)
└── ...other components
```

## Related Files

- **CalendarSlotPicker documentation:** `CALENDAR_SLOT_DOCS.md`
- **API utilities:** `src/utils/api.js`
- **Auth context:** `src/context/AuthContext.jsx`

## Quick Start

### Access the Page
1. Log in at `/login`
2. Redirects to `/reservation`
3. Or navigate directly: `http://localhost:5173/reservation`

### Make a Reservation
1. Select date from calendar
2. Select time slot
3. Enter player count (1-20)
4. Add any special requests (optional)
5. Review summary
6. Click "Confirm Reservation"
7. See success modal

### Environment Setup

No additional setup needed. Component uses:
- Default API URL: `http://localhost:5000`
- Or from `.env`: `VITE_API_URL`

## Troubleshooting

### Issue: Form disabled even after slot selection
- **Cause:** Calendar component not properly updating state
- **Fix:** Check CalendarSlotPicker's `onSlotSelect` callback

### Issue: Success modal not appearing
- **Cause:** API response not returning proper success status
- **Fix:** Verify API endpoint returns 200 status

### Issue: Character counter not updating
- **Cause:** Missing onChange handler
- **Fix:** Check `handleSpecialRequestsChange` function

### Issue: Form keeps resetting
- **Cause:** Auto-reset timer running
- **Fix:** Modal closes and resets form after 3 seconds (by design)

### Issue: Player count validation failing
- **Cause:** Input value not properly converted to number
- **Fix:** Use `parseInt()` in handlePlayerCountChange

## Support & Documentation

- Complete implementation guide: `ADVANCED_INTEGRATION.md`
- Calendar component reference: `CALENDAR_SLOT_DOCS.md`
- Component summary: `CALENDAR_SLOT_PICKER_SUMMARY.md`
- Quick start guide: `QUICK_START.md`

---

Built with React, TailwindCSS, and modern web standards for LaserZone. 🎯
