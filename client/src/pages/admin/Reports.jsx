import { useState } from 'react'
import { BarChart3, Users, Download, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getSummaryReport, getDepartmentReport, exportCSV } from '../../api/admin'
import useSessionStore from '../../store/sessionStore'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import DatePicker from '../../components/shared/DatePicker'
import Select from '../../components/shared/Select'
import toast from 'react-hot-toast'

const PRESET_RANGES = [
  { label: 'This Week', value: 'this-week' },
  { label: 'Last Week', value: 'last-week' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Last Month', value: 'last-month' },
  { label: 'Custom', value: 'custom' },
]

const getPresetRange = (preset) => {
  const now = new Date()
  const toISO = (d) => d.toISOString().split('T')[0]

  if (preset === 'this-week') {
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { startDate: toISO(monday), endDate: toISO(sunday) }
  }

  if (preset === 'last-week') {
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff - 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { startDate: toISO(monday), endDate: toISO(sunday) }
  }

  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { startDate: toISO(start), endDate: toISO(end) }
  }

  if (preset === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { startDate: toISO(start), endDate: toISO(end) }
  }

  return { startDate: '', endDate: '' }
}

const StatCard = ({ icon: Icon, label, value, color = 'brand' }) => {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-500',
  }
  return (
    <div className="card shadow-soft p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const AttendanceBadge = ({ rate }) => {
  if (rate === null) return <span className="text-xs text-slate-400">—</span>
  const color =
    rate >= 90 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
    rate >= 70 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' :
    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color}`}>
      {rate}%
    </span>
  )
}

const Reports = () => {
  const { timezone } = useSessionStore()
  const [tab, setTab] = useState('employee')
  const [preset, setPreset] = useState('this-month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [summaryData, setSummaryData] = useState([])
  const [deptData, setDeptData] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [exporting, setExporting] = useState(false)

  const getRange = () => {
    if (preset === 'custom') return { startDate: customStart, endDate: customEnd }
    return getPresetRange(preset)
  }

  const handleGenerate = async () => {
    const { startDate, endDate } = getRange()
    if (!startDate || !endDate) {
      toast.error('Please select a valid date range')
      return
    }
    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }

    setLoading(true)
    try {
      const [summaryRes, deptRes] = await Promise.all([
        getSummaryReport({ startDate, endDate }),
        getDepartmentReport({ startDate, endDate }),
      ])
      setSummaryData(summaryRes.data)
      setDeptData(deptRes.data)
      setHasFetched(true)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const { startDate, endDate } = getRange()
    if (!startDate || !endDate) return

    setExporting(true)
    try {
      const res = await exportCSV({ startDate, endDate })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `shiftsync-report-${startDate}-${endDate}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Aggregate stats from summary data
  const totalPresent = summaryData.reduce((a, r) => a + r.daysPresent, 0)
  const totalAbsent = summaryData.reduce((a, r) => a + r.daysAbsent, 0)
  const totalLate = summaryData.reduce((a, r) => a + r.daysLate, 0)
  const avgAttendance = summaryData.length > 0
    ? Math.round(
        summaryData
          .filter((r) => r.attendanceRate !== null)
          .reduce((a, r) => a + r.attendanceRate, 0) /
        summaryData.filter((r) => r.attendanceRate !== null).length
      )
    : null

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Reports" />
        <div className="p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">

          {/* Filters */}
          <div className="card shadow-soft p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-44">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Period
                </label>
                <Select
                  options={PRESET_RANGES}
                  value={preset}
                  onChange={setPreset}
                />
              </div>

              {preset === 'custom' && (
                <>
                  <div className="w-44">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Start Date
                    </label>
                    <DatePicker
                      value={customStart}
                      onChange={setCustomStart}
                      maxDate={new Date().toISOString().split('T')[0]}
                      placeholder="Start date"
                    />
                  </div>
                  <div className="w-44">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      End Date
                    </label>
                    <DatePicker
                      value={customEnd}
                      onChange={setCustomEnd}
                      maxDate={new Date().toISOString().split('T')[0]}
                      placeholder="End date"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 ml-auto">
                {hasFetched && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={14} />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <BarChart3 size={14} />
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          {hasFetched && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={CheckCircle2} label="Total Present" value={totalPresent} color="emerald" />
                <StatCard icon={AlertTriangle} label="Total Absent" value={totalAbsent} color="red" />
                <StatCard icon={Clock} label="Late Arrivals" value={totalLate} color="amber" />
                <StatCard icon={TrendingUp} label="Avg Attendance" value={avgAttendance !== null ? `${avgAttendance}%` : '—'} color="brand" />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                {[
                  { key: 'employee', label: 'By Employee', icon: Users },
                  { key: 'department', label: 'By Department', icon: BarChart3 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      tab === key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-soft'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Employee Table */}
              {tab === 'employee' && (
                <div className="card shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Employee Summary
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/60">
                          {['Employee', 'Department', 'Present', 'Absent', 'Late', 'Avg Hours', 'Total Hours', 'OT Days', 'Attendance'].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {summaryData.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">
                              No data found for this period
                            </td>
                          </tr>
                        ) : (
                          summaryData.map((row) => (
                            <tr
                              key={row.user._id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.user.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                      {row.user.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{row.user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                {row.user.department || '—'}
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  {row.daysPresent}
                                </span>
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <span className={`text-xs font-semibold ${row.daysAbsent > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {row.daysAbsent}
                                </span>
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <span className={`text-xs font-semibold ${row.daysLate > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                  {row.daysLate}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" style={{ verticalAlign: 'middle' }}>
                                {row.avgWorkedHours}h
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" style={{ verticalAlign: 'middle' }}>
                                {row.totalWorkedHours}h
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <span className={`text-xs font-semibold ${row.overtimeDays > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {row.overtimeDays}
                                </span>
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <AttendanceBadge rate={row.attendanceRate} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Department Table */}
              {tab === 'department' && (
                <div className="card shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Department Summary
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/60">
                          {['Department', 'Members', 'Total Logs', 'Total Hours', 'Avg Hours/Log', 'OT Days'].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {deptData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                              No data found for this period
                            </td>
                          </tr>
                        ) : (
                          deptData.map((row) => (
                            <tr
                              key={row.department}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 text-sm" style={{ verticalAlign: 'middle' }}>
                                {row.department}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                {row.memberCount}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" style={{ verticalAlign: 'middle' }}>
                                {row.totalLogs}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" style={{ verticalAlign: 'middle' }}>
                                {row.totalWorkedHours}h
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" style={{ verticalAlign: 'middle' }}>
                                {row.avgWorkedHoursPerLog}h
                              </td>
                              <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                                <span className={`text-xs font-semibold ${row.overtimeDays > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {row.overtimeDays}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state before generating */}
          {!hasFetched && !loading && (
            <div className="card shadow-soft py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <BarChart3 size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Select a period and generate your report
              </p>
              <p className="text-xs text-slate-400">
                Employee attendance, hours worked, and department breakdowns
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Reports