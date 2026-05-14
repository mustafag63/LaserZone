import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/languageCore'

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-black">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-purple-600 mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
