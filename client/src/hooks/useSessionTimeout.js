import { useEffect, useRef, useCallback } from 'react'
import useAuthStore from '../store/authStore'

const WARN_BEFORE_MS = 2 * 60 * 1000  // show modal 2 min before expiry
const CHECK_INTERVAL_MS = 15 * 1000   // check every 15 seconds

const parseExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

const useSessionTimeout = ({ onWarn, onExpired }) => {
  const accessToken = useAuthStore((s) => s.accessToken)
  const intervalRef = useRef(null)
  const warnedRef = useRef(false)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    warnedRef.current = false
  }, [])

  useEffect(() => {
    clear()
    if (!accessToken) return

    const expiry = parseExpiry(accessToken)
    if (!expiry) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const remaining = expiry - now

      if (remaining <= 0) {
        clear()
        onExpired()
        return
      }

      if (remaining <= WARN_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true
        onWarn(Math.floor(remaining / 1000))
      }
    }, CHECK_INTERVAL_MS)

    return clear
  }, [accessToken])
}

export default useSessionTimeout