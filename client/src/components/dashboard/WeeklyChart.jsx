import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getWeekDates = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs shadow-card">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-slate-300">{payload[0].value}h worked</p>
    </div>
  )
}

const WeeklyChart = ({ logs }) => {
  const weekDates = getWeekDates()
  const byDate = {}
  logs.forEach((log) => { byDate[log.date] = log })

  const data = weekDates.map((date, i) => {
    const log = byDate[date]
    const workedMins = log?.timeOut
      ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
      : 0
    return {
      day: days[i],
      hours: parseFloat((workedMins / 60).toFixed(2)),
      overtime: log?.overtime || false,
    }
  })

  return (
    <div className="card shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Hours</h2>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" /> Regular
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Overtime
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.overtime ? '#ef4444' : '#0ea5e9'} opacity={entry.hours === 0 ? 0.25 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyChart