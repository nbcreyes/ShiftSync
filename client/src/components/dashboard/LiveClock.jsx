import { useEffect, useState } from 'react'

const LiveClock = ({ timeIn, timeOut, openBreak }) => {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const calc = () => {
      if (!timeIn) return setElapsed('--')

      // If clocked out, show fixed final duration
      const end = timeOut ? new Date(timeOut) : new Date()
      const start = new Date(timeIn)
      let diffMs = end - start

      // Subtract current open break duration if on break
      if (!timeOut && openBreak?.breakStart) {
        const breakMs = new Date() - new Date(openBreak.breakStart)
        diffMs -= breakMs
      }

      if (diffMs < 0) diffMs = 0

      const totalSecs = Math.floor(diffMs / 1000)
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      const s = totalSecs % 60

      setElapsed(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }

    calc()

    // Stop ticking if clocked out
    if (timeOut) return

    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [timeIn, timeOut, openBreak])

  return (
    <span className="font-mono text-3xl font-bold text-gray-900 dark:text-white tracking-widest">
      {elapsed}
    </span>
  )
}

export default LiveClock