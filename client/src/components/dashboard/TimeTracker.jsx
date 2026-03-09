import { useState } from 'react'
import { LogIn, Coffee, LogOut, Play } from 'lucide-react'
import { timeIn, startBreak, endBreak, timeOut } from '../../api/timelog'
import useSessionStore from '../../store/sessionStore'
import LiveClock from './LiveClock'
import StatusBadge from '../shared/StatusBadge'
import toast from 'react-hot-toast'
import { formatTime } from '../../utils/formatTime'

const TimeTracker = ({ onSessionUpdate }) => {
  const { todayLog, openBreak, setTodayLog, setOpenBreak } = useSessionStore()
  const [loading, setLoading] = useState(false)

  const getStatus = () => {
    if (!todayLog || todayLog.timeOut) return 'clocked-out'
    if (openBreak) return 'on-break'
    return 'working'
  }

  const status = getStatus()

  const handle = async (action) => {
    setLoading(true)
    try {
      let res
      if (action === 'in') res = await timeIn()
      else if (action === 'break-start') res = await startBreak()
      else if (action === 'break-end') res = await endBreak()
      else if (action === 'out') res = await timeOut()

      if (action === 'in') { setTodayLog(res.data); toast.success('Clocked in') }
      else if (action === 'break-start') { setOpenBreak(res.data); toast.success('Break started') }
      else if (action === 'break-end') { setOpenBreak(null); toast.success('Break ended') }
      else if (action === 'out') { setTodayLog(res.data); setOpenBreak(null); toast.success('Clocked out') }

      if (onSessionUpdate) onSessionUpdate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-soft p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Today</h2>
        <StatusBadge status={status} />
      </div>

      {/* Clock */}
      <div className="flex flex-col items-center py-4">
        <LiveClock timeIn={todayLog?.timeIn} timeOut={todayLog?.timeOut} openBreak={openBreak} />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
          {todayLog ? `Clocked in at ${formatTime(todayLog.timeIn)}` : 'Not clocked in yet'}
        </p>
      </div>

      {/* Stats row */}
      {todayLog && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Time In', value: formatTime(todayLog.timeIn) },
            { label: 'Break', value: `${Math.round(todayLog.totalBreakMins)}m` },
            { label: 'Time Out', value: todayLog.timeOut ? formatTime(todayLog.timeOut) : '--' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {todayLog?.overtime && (
        <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
          Overtime logged for today
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2.5">
        {!todayLog && (
          <button onClick={() => handle('in')} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <LogIn size={15} /> Clock In
          </button>
        )}
        {todayLog && !todayLog.timeOut && !openBreak && (
          <>
            <button
              onClick={() => handle('break-start')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <Coffee size={15} /> Break
            </button>
            <button
              onClick={() => handle('out')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <LogOut size={15} /> Clock Out
            </button>
          </>
        )}
        {todayLog && !todayLog.timeOut && openBreak && (
          <button
            onClick={() => handle('break-end')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            <Play size={15} /> End Break
          </button>
        )}
        {todayLog?.timeOut && (
          <div className="flex-1 text-center py-2.5 text-sm text-slate-400 dark:text-slate-500 font-medium">
            Session complete
          </div>
        )}
      </div>
    </div>
  )
}

export default TimeTracker