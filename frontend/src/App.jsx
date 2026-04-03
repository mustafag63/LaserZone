import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import ReservationForm from './components/ReservationForm'
import BookingDemo from './components/BookingDemo'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reservation" element={<ReservationForm />} />
          <Route path="/booking" element={<BookingDemo />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Add more routes here as needed (dashboard, etc.) */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
