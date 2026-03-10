import { toZonedTime, format } from 'date-fns-tz'
import useSessionStore from '../../store/sessionStore'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getWeekDates = (timezone) => {
  const tz = timezone || 'UTC'
  const now = toZonedTime(new Date(), tz)
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
}

const WeeklySummary = ({ logs }) => {
  const { timezone } = useSessionStore()
  const tz = timezone || 'UTC'

  const weekDates = getWeekDates(tz)
  const byDate = {}
  logs.forEach((log) => { byDate[log.date] = log })

  const totalWorkedMins = logs.reduce((sum, log) => {
    if (!log.timeOut) return sum
    return sum + (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
  }, 0)

  const overtimeDays = logs.filter((l) => l.overtime).length
  const today = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd', { timeZone: tz })

  return (
    <div className="card shadow-soft p-6 flex flex-col gap-6">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">This Week</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Total Hours</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {(totalWorkedMins / 60).toFixed(1)}
            <span className="text-sm font-sans font-medium text-slate-400 ml-1">hrs</span>
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Overtime Days</p>
          <p className={`text-2xl font-bold font-mono ${overtimeDays > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
            {overtimeDays}
            <span className="text-sm font-sans font-medium text-slate-400 ml-1">days</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date, i) => {
          const log = byDate[date]
          const workedMins = log?.timeOut
            ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
            : 0
          const isToday = date === today
          const hasWork = workedMins > 0

          return (
            <div key={date} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{days[i]}</span>
              <div className={`w-full rounded-xl h-11 flex items-center justify-center text-xs font-semibold transition-all
                ${isToday ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-900' : ''}
                ${log?.overtime
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : hasWork
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400'
                }`}
              >
                {hasWork ? `${(workedMins / 60).toFixed(1)}h` : '--'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklySummary