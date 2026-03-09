import { useEffect, useState } from 'react'
import { getAllRemarks, getRemarkById } from '../../api/remark'
import { getSummaryReport } from '../../api/admin'
import useSessionStore from '../../store/sessionStore'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import LiveBoard from '../../components/admin/LiveBoard'
import RemarkThread from '../../components/admin/RemarkThread'
import { formatDate, formatTime } from '../../utils/formatTime'
import StatusBadge from '../../components/shared/StatusBadge'
import { MessageSquare, TrendingUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

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
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const { timezone } = useSessionStore()
  const [remarks, setRemarks] = useState([])
  const [selectedRemark, setSelectedRemark] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const getThisMonthRange = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const toISO = (d) => d.toISOString().split('T')[0]
    return { startDate: toISO(start), endDate: toISO(end) }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getThisMonthRange()
      const [remarksRes, summaryRes] = await Promise.all([
        getAllRemarks({ status: 'open' }),
        getSummaryReport({ startDate, endDate }),
      ])

      setRemarks(remarksRes.data)

      const summary = summaryRes.data
      const totalPresent = summary.reduce((a, r) => a + r.daysPresent, 0)
      const totalAbsent = summary.reduce((a, r) => a + r.daysAbsent, 0)
      const totalLate = summary.reduce((a, r) => a + r.daysLate, 0)
      const rates = summary.filter((r) => r.attendanceRate !== null).map((r) => r.attendanceRate)
      const avgAttendance = rates.length > 0
        ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        : null

      setStats({ totalPresent, totalAbsent, totalLate, avgAttendance })
    } catch {
      toast.error('Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRemarkClick = async (remark) => {
    try {
      const res = await getRemarkById(remark._id)
      setSelectedRemark(res.data)
    } catch {
      toast.error('Failed to load remark thread')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Overview" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">

          {/* This month stats */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card shadow-soft p-5 h-24 animate-pulse bg-slate-100 dark:bg-slate-700/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={CheckCircle2}
                label="Present This Month"
                value={stats?.totalPresent}
                color="emerald"
              />
              <StatCard
                icon={AlertTriangle}
                label="Absent This Month"
                value={stats?.totalAbsent}
                color="red"
              />
              <StatCard
                icon={Clock}
                label="Late This Month"
                value={stats?.totalLate}
                color="amber"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Attendance"
                value={stats?.avgAttendance !== null ? `${stats?.avgAttendance}%` : '—'}
                color="brand"
              />
            </div>
          )}

          <LiveBoard />

          {/* Open Remarks */}
          <div className="card shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Open Remarks
              </h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : remarks.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No open remarks — all clear
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {remarks.map((remark) => (
                  <div
                    key={remark._id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(remark.logId?.date)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTime(remark.logId?.timeIn)} — {formatTime(remark.logId?.timeOut)}
                      </p>
                      {remark.adminNote && (
                        <p className="text-xs text-slate-400 mt-0.5 italic truncate max-w-xs">
                          "{remark.adminNote}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <StatusBadge status={remark.status} />
                      <button
                        onClick={() => handleRemarkClick(remark)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      >
                        <MessageSquare size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {selectedRemark && (
        <RemarkThread
          remark={selectedRemark}
          onClose={() => setSelectedRemark(null)}
          onUpdate={() => { fetchAll(); setSelectedRemark(null) }}
        />
      )}
    </div>
  )
}

export default AdminPanel