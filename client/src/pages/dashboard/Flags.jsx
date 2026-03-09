import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CalendarX, CheckCircle } from 'lucide-react'
import { getMyFlags } from '../../api/shift'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import DatePicker from '../../components/shared/DatePicker'
import toast from 'react-hot-toast'

const getDefaultRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toISO = (d) => d.toISOString().split('T')[0]
  return { startDate: toISO(start), endDate: toISO(end) }
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const fmt12 = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const fmt24toDisplay = (time24) => {
  if (!time24) return '—'
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const FlagCard = ({ flag }) => {
  const isAbsent = flag.type === 'absent'

  return (
    <div className={`card shadow-soft p-4 flex items-start gap-4 ${
      isAbsent ? 'border-l-4 border-red-400' : 'border-l-4 border-amber-400'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        isAbsent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
      }`}>
        {isAbsent
          ? <CalendarX size={16} className="text-red-500" />
          : <Clock size={16} className="text-amber-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatDate(flag.date)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled {fmt24toDisplay(flag.schedule?.startTime)} — {fmt24toDisplay(flag.schedule?.endTime)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            isAbsent
              ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          }`}>
            {isAbsent
              ? <><AlertTriangle size={11} /> Absent</>
              : <><Clock size={11} /> Late by {flag.lateBy}m</>
            }
          </span>
        </div>

        {!isAbsent && flag.timeIn && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Clocked in at{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt12(flag.timeIn)}</span>
            {' '}instead of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt24toDisplay(flag.schedule?.startTime)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

const Flags = () => {
  const [flags, setFlags] = useState([])
  const [filters, setFilters] = useState(getDefaultRange)
  const [loading, setLoading] = useState(true)

  const fetchFlags = async (overrideFilters = null) => {
    const f = overrideFilters || filters
    if (!f.startDate || !f.endDate) return
    setLoading(true)
    try {
      const res = await getMyFlags({ startDate: f.startDate, endDate: f.endDate })
      setFlags(res.data)
    } catch {
      toast.error('Failed to load flags')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    fetchFlags()
  }, [])

  const handleFilter = () => fetchFlags()

  const absentCount = flags.filter((f) => f.type === 'absent').length
  const lateCount = flags.filter((f) => f.type === 'late').length

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="My Attendance Flags" />
        <div className="p-6 space-y-5 max-w-3xl mx-auto animate-fade-in">

          {/* Filters */}
          <div className="card shadow-soft p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                From
              </label>
              <DatePicker
                value={filters.startDate}
                onChange={(val) => setFilters((f) => ({ ...f, startDate: val }))}
                placeholder="Start date"
                className="w-44"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                To
              </label>
              <DatePicker
                value={filters.endDate}
                onChange={(val) => setFilters((f) => ({ ...f, endDate: val }))}
                placeholder="End date"
                className="w-44"
              />
            </div>
            <button onClick={handleFilter} className="btn-primary self-end">
              Filter
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card shadow-soft p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{flags.length}</p>
              <p className="text-xs text-slate-400 mt-1">Total Flags</p>
            </div>
            <div className="card shadow-soft p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-slate-400 mt-1">Absences</p>
            </div>
            <div className="card shadow-soft p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
              <p className="text-xs text-slate-400 mt-1">Late Arrivals</p>
            </div>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex justify-center py-14">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && flags.length === 0 && (
            <div className="card shadow-soft p-14 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle size={22} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No flags in this period
              </p>
              <p className="text-xs text-slate-400">
                Great work — no late arrivals or absences found.
              </p>
            </div>
          )}

          {!loading && flags.length > 0 && (
            <div className="space-y-3">
              {flags.map((flag, i) => (
                <FlagCard key={`${flag.date}-${flag.type}-${i}`} flag={flag} />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Flags