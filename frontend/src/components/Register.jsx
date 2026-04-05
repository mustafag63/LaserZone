import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerUser } from '../utils/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Full name is required'
    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!EMAIL_REGEX.test(formData.email)) {
      e.email = 'Enter a valid email address'
    }
    if (!formData.password) {
      e.password = 'Password is required'
    } else if (formData.password.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }
    if (!formData.confirmPassword) {
      e.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await registerUser(formData.name, formData.email, formData.password)
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (error) {
      setServerError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-500/10 rounded-xl border border-cyan-500/20 mb-4">
              <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Laser<span className="text-cyan-400">Zone</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Create your account</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="name"
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                  disabled:opacity-50 transition-colors
                  ${errors.name ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                  disabled:opacity-50 transition-colors
                  ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                  disabled:opacity-50 transition-colors
                  ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
                  disabled:opacity-50 transition-colors
                  ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'}`}
              />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed
                text-gray-950 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
