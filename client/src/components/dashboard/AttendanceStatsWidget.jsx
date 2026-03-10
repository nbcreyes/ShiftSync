import { TrendingUp, AlertTriangle, CalendarCheck } from 'lucide-react'

const AttendanceStatsWidget = ({ logs = [], flags = [] }) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthLogs = logs.filter((l) => {
    const d = new Date(l.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  const monthFlags = flags.filter((f) => {
    const d = new Date(f.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  const presentDays = monthLogs.length
  const flagCount = monthFlags.length
  const overtimeDays = monthLogs.filter((l) => l.overtime).length

  // Attendance rate: days present vs working days elapsed this month
  const daysElapsed = (() => {
    const start = new Date(year, month, 1)
    const end = new Date(Math.min(now, new Date(year, month + 1, 0)))
    let count = 0
    const cursor = new Date(start)
    while (cursor <= end) {
      const day = cursor.getDay()
      if (day !== 0 && day !== 6) count++
      cursor.setDate(cursor.getDate() + 1)
    }
    return count
  })()

  const attendanceRate = daysElapsed > 0
    ? Math.round((presentDays / daysElapsed) * 100)
    : 0

  const monthName = now.toLocaleDateString('en-US', { month: 'long' })

  const stats = [
    {
      label: 'Attendance Rate',
      value: `${attendanceRate}%`,
      sub: `${presentDays} of ${daysElapsed} days`,
      icon: CalendarCheck,
      color: attendanceRate >= 90 ? 'text-green-500' : attendanceRate >= 70 ? 'text-amber-500' : 'text-red-500',
      bg: attendanceRate >= 90 ? 'bg-green-50 dark:bg-green-900/20' : attendanceRate >= 70 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Flags This Month',
      value: flagCount,
      sub: flagCount === 0 ? 'Clean record' : `${flagCount} flag${flagCount > 1 ? 's' : ''}`,
      icon: AlertTriangle,
      color: flagCount === 0 ? 'text-slate-400' : flagCount <= 2 ? 'text-amber-500' : 'text-red-500',
      bg: flagCount === 0 ? 'bg-slate-100 dark:bg-slate-700/40' : 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Overtime Days',
      value: overtimeDays,
      sub: overtimeDays === 0 ? 'None this month' : `${overtimeDays} day${overtimeDays > 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="card shadow-soft p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
          <TrendingUp size={15} className="text-brand-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Stats</h3>
          <p className="text-[11px] text-slate-400">{monthName} {year}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttendanceStatsWidget