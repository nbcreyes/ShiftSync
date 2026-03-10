import { CalendarDays, CheckCircle } from 'lucide-react'
import { toZonedTime, format } from 'date-fns-tz'

const formatDate = (str) => {
  if (!str) return '—'
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getDayCount = (start, end) => {
  if (!start || !end) return 0
  const diff = new Date(end + 'T12:00:00') - new Date(start + 'T12:00:00')
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
}

const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1)

const UpcomingLeaveWidget = ({ leaves = [], timezone }) => {
  const tz = timezone || 'UTC'

  // Get today's date string in workspace timezone e.g. "2026-03-10"
  const todayStr = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd', { timeZone: tz })

  const getDaysUntil = (startStr) => {
    if (startStr <= todayStr) return 'Ongoing'
    const todayMs = new Date(todayStr + 'T12:00:00').getTime()
    const startMs = new Date(startStr + 'T12:00:00').getTime()
    const diff = Math.round((startMs - todayMs) / (1000 * 60 * 60 * 24))
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  const upcoming = leaves
    .filter((l) => l.status === 'approved' && l.endDate >= todayStr)
    .sort((a, b) => new Date(a.startDate + 'T12:00:00') - new Date(b.startDate + 'T12:00:00'))
    .slice(0, 3)

  return (
    <div className="card shadow-soft p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <CalendarDays size={15} className="text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Leave</h3>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-xs text-slate-400">No upcoming approved leave</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((leave) => (
            <div
              key={leave._id}
              className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {capitalize(leave.type)} Leave
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    <span className="ml-1.5">· {getDayCount(leave.startDate, leave.endDate)}d</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 shrink-0 ml-3">
                {getDaysUntil(leave.startDate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UpcomingLeaveWidget