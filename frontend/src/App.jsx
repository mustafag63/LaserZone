import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
<<<<<<< HEAD
=======
import BookingDemo from './components/BookingDemo'
>>>>>>> origin/feat/T-06-calendar-component
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
<<<<<<< HEAD
=======
          <Route path="/booking" element={<BookingDemo />} />
>>>>>>> origin/feat/T-06-calendar-component
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Add more routes here as needed (dashboard, etc.) */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
