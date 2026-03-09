import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getLiveBoard } from '../../api/admin'
import StatusBadge from '../shared/StatusBadge'
import { formatTime } from '../../utils/formatTime'
import toast from 'react-hot-toast'

const LiveBoard = () => {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadBoard = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await getLiveBoard()
      setBoard(res.data)
    } catch {
      if (!silent) toast.error('Failed to load live board')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadBoard()
    const interval = setInterval(() => loadBoard(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const counts = {
    working: board.filter((e) => e.status === 'working').length,
    'on-break': board.filter((e) => e.status === 'on-break').length,
    'clocked-out': board.filter((e) => e.status === 'clocked-out').length,
  }

  return (
    <div className="card shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live Board</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {counts.working} working
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {counts['on-break']} on break
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {counts['clocked-out']} clocked out
            </span>
          </div>
        </div>
        <button
          onClick={() => loadBoard(true)}
          disabled={refreshing}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="p-5 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No activity today</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {board.map((entry) => (
            <div
              key={entry.logId}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {entry.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {entry.user?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.user?.department || 'No department'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {formatTime(entry.timeIn)}
                  </p>
                  {entry.overtime && (
                    <p className="text-xs text-red-500 font-semibold">OT</p>
                  )}
                </div>
                <StatusBadge status={entry.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LiveBoard