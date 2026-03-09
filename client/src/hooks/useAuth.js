import { useEffect } from 'react'
import { getMe } from '../api/auth'
import useAuthStore from '../store/authStore'

const useAuth = () => {
  const { user, accessToken, isLoading, setAuth, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to refresh token on app load
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { method: 'POST', credentials: 'include' }
        )

        if (!res.ok) {
          clearAuth()
          setLoading(false)
          return
        }

        const { accessToken } = await res.json()
        useAuthStore.getState().setAccessToken(accessToken)

        const meRes = await getMe()
        setAuth(meRes.data, accessToken)
      } catch {
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return { user, accessToken, isLoading }
}

export default useAuth