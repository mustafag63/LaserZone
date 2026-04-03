# Authentication UI Documentation

## Overview
This document describes the Authentication UI for LaserZone, which includes Login and Register pages with comprehensive form validation, error handling, and token management.

## Features

### 1. **Login Page** (`src/components/Login.jsx`)
- Email and password fields
- Client-side validation (email format, required fields)
- Error state handling with user-friendly messages
- Loading state during API request
- Link to register page
- Stores JWT token and user data in localStorage

### 2. **Register Page** (`src/components/Register.jsx`)
- Name, email, and password fields
- Client-side validation (name length, email format, password length)
- Error state handling with user-friendly messages
- Loading state during API request
- Link to login page
- Stores JWT token and user data in localStorage

### 3. **Authentication Context** (`src/context/AuthContext.jsx`)
- Global state management for auth
- Provides `user`, `token`, `loading`, and `isAuthenticated` state
- Functions: `login()`, `logout()`
- Automatically restores session from localStorage on mount
- Prevents undefined errors with proper context usage

### 4. **Protected Route Component** (`src/components/ProtectedRoute.jsx`)
- Wraps routes that require authentication
- Redirects unauthenticated users to login
- Shows loading state during auth check
- Usage: `<ProtectedRoute><YourComponent /></ProtectedRoute>`

### 5. **API Utilities** (`src/utils/api.js`)
- Centralized API call handler with:
  - Automatic token injection (Bearer token)
  - Proper error handling
  - Auto-redirect on 401 (Unauthorized)
- Helper functions:
  - `apiCall(endpoint, options)` - Generic API caller
  - `loginUser(email, password)` - Login endpoint
  - `registerUser(name, email, password)` - Register endpoint

## Form Validation

### Login Form
- **Email**: Required, valid email format
- **Password**: Required, minimum 6 characters

### Register Form
- **Name**: Required, minimum 2 characters
- **Email**: Required, valid email format
- **Password**: Required, minimum 6 characters

## API Response Format

The backend returns the following structure:

```json
{
  "message": "Success message",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

## Error Handling

- **Network Errors**: Generic "An error occurred" message
- **API Errors**: Display backend error message (e.g., "Email is already registered")
- **Validation Errors**: Field-level error messages
- **401 (Unauthorized)**: Auto-clears tokens and redirects to login

## Session Management

- **Token Storage**: Stored in `localStorage` as `token`
- **User Data**: Stored in `localStorage` as `user` (JSON string)
- **Session Restoration**: Automatically restored on app load
- **Logout**: Removes token and user from both state and localStorage

## Environment Configuration

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:5000
```

The API URL can be modified per environment (development, production, etc.).

## Usage in Pages

### Example: Using Auth Context in a Component
```jsx
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Example: Creating Protected Routes
```jsx
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'

<Route
  path="/dashboard"
  element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
/>
```

## Styling

- **Design System**: Modern card-based layout with gradient backgrounds
- **Framework**: Tailwind CSS
- **Theme**: Purple/Pink gradient with dark mode support
- **Responsive**: Mobile-first design, works on all screen sizes
- **Animation**: Smooth fade-in animation on form load

## Next Steps

1. Create protected pages (Dashboard, Profile, etc.)
2. Add password reset functionality
3. Implement social login (OAuth)
4. Add two-factor authentication
5. Create user profile management page
