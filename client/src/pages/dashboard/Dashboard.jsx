import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { getToday, getHistory } from '../../api/timelog'
import { getMyRemarks, getRemarkById } from '../../api/remark'
import { getMyManualRequests } from '../../api/manualLog'
import { getWorkspace } from '../../api/admin'
import useSessionStore from '../../store/sessionStore'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import TimeTracker from '../../components/dashboard/TimeTracker'
import WeeklySummary from '../../components/dashboard/WeeklySummary'
import WeeklyChart from '../../components/dashboard/WeeklyChart'
import LogsTable from '../../components/dashboard/LogsTable'
import RemarkBanner from '../../components/dashboard/RemarkBanner'
import RemarkModal from '../../components/dashboard/RemarkModal'
import ManualLogModal from '../../components/dashboard/ManualLogModal'
import { PageSkeleton } from '../../components/shared/LoadingSkeleton'

const Dashboard = () => {
  const { setTodaySession, setTimezone } = useSessionStore()
  const user = useAuthStore((s) => s.user)
  const [weekLogs, setWeekLogs] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [remarks, setRemarks] = useState([])
  const [manualRequests, setManualRequests] = useState([])
  const [selectedRemark, setSelectedRemark] = useState(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const getWeekRange = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    }
  }

  const fetchAll = async (page = 1) => {
    try {
      // Step 1: sync workspace timezone first so tz() is correct for all subsequent calls
      if (user?.role !== 'superuser') {
        try {
          const workspaceRes = await getWorkspace()
          if (workspaceRes?.data?.timezone) {
            setTimezone(workspaceRes.data.timezone)
          }
        } catch {
          // fallback to browser tz already in store
        }
      }

      // Step 2: fetch everything else with correct timezone
      const { startDate, endDate } = getWeekRange()
      const [todayRes, weekRes, historyRes, remarksRes, manualRes] =
        await Promise.all([
          getToday(),
          getHistory({ startDate, endDate, limit: 7 }),
          getHistory({ page, limit: 10 }),
          getMyRemarks(),
          getMyManualRequests(),
        ])

      if (todayRes.data) {
        const { log, breaks, openBreak } = todayRes.data
        setTodaySession(log, breaks, openBreak)
      } else {
        setTodaySession(null, [], null)
      }

      setWeekLogs(weekRes.data.logs || [])
      setHistoryLogs(historyRes.data.logs || [])
      setPagination({
        page: historyRes.data.page,
        pages: historyRes.data.pages,
        total: historyRes.data.total,
      })
      setRemarks(remarksRes.data || [])
      setManualRequests(manualRes.data || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleRemarkClick = async (log) => {
    try {
      const remark = remarks.find((r) => r.logId?._id === log._id || r.logId === log._id)
      if (remark) {
        const res = await getRemarkById(remark._id)
        setSelectedRemark(res.data)
      }
    } catch (err) {
      console.error('Failed to load remark:', err)
    }
  }

  const pendingManual = manualRequests.filter((r) => r.status === 'pending')

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1">
          <Navbar title="Dashboard" />
          <PageSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Dashboard" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
          <RemarkBanner remarks={remarks} />

          {/* Pending manual log requests banner */}
          {pendingManual.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {pendingManual.length} manual log request{pendingManual.length > 1 ? 's' : ''} pending
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                    Waiting for admin approval
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TimeTracker onSessionUpdate={() => fetchAll()} />
            <WeeklySummary logs={weekLogs} />
          </div>

          <WeeklyChart logs={weekLogs} />

          <LogsTable
            logs={historyLogs}
            total={pagination.total}
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={(p) => fetchAll(p)}
            onRemarkClick={handleRemarkClick}
          />

          {/* Manual log request button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              <ClipboardList size={15} />
              Request Manual Log
            </button>
          </div>
        </div>
      </main>

      {selectedRemark && (
        <RemarkModal
          remark={selectedRemark}
          onClose={() => setSelectedRemark(null)}
          onUpdate={() => { fetchAll(); setSelectedRemark(null) }}
        />
      )}

      {showManualModal && (
        <ManualLogModal
          onClose={() => setShowManualModal(false)}
          onSubmitted={() => fetchAll()}
        />
      )}
    </div>
  )
}

export default Dashboard