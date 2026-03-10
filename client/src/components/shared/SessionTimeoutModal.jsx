import { useEffect, useState } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

const fmt = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const SessionTimeoutModal = ({ secondsRemaining, onStayLoggedIn, onLogOut, staying }) => {
  const [countdown, setCountdown] = useState(secondsRemaining)

  useEffect(() => {
    setCountdown(secondsRemaining)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsRemaining])

  const urgent = countdown <= 30

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-card animate-slide-up">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          urgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <Clock size={22} className={urgent ? 'text-red-500' : 'text-amber-500'} />
        </div>

        {/* Text */}
        <div className="text-center mb-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Session Expiring Soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your session will expire in
          </p>
          <p className={`text-3xl font-bold mt-2 tabular-nums ${
            urgent ? 'text-red-500' : 'text-amber-500'
          }`}>
            {fmt(countdown)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Would you like to stay logged in?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onLogOut}
            disabled={staying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <LogOut size={13} />
            Log Out
          </button>
          <button
            onClick={onStayLoggedIn}
            disabled={staying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-70 shadow-glow"
          >
            {staying
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <RefreshCw size={13} />
            }
            {staying ? 'Refreshing...' : 'Stay Logged In'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default SessionTimeoutModal