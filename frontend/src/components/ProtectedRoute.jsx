import { Navigate, Outlet } from 'react-router-dom'
import { getStoredAuthSession } from '../lib/auth0'

function ProtectedRoute({ adminOnly = false }) {
  const session = getStoredAuthSession()
  const profile = session?.profile
  const isAuthenticated = Boolean(profile)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly) {
    const isAdmin = profile?.role?.toLowerCase() === 'admin' || profile?.is_superuser || profile?.is_staff
    if (!isAdmin) {
      return <Navigate to="/catalogo" replace />
    }
  }

  return <Outlet />
}

export default ProtectedRoute