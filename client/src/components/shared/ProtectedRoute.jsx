import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'superuser') return <Navigate to="/superuser" replace />
    if (user.role === 'employee') return <Navigate to="/dashboard" replace />
    return <Navigate to="/admin" replace />
  }

  return children
}

export default ProtectedRoute