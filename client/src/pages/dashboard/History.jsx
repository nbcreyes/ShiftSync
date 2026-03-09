import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { getHistory, exportCSV } from '../../api/timelog'
import { getMyRemarks, getRemarkById } from '../../api/remark'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import LogsTable from '../../components/dashboard/LogsTable'
import RemarkModal from '../../components/dashboard/RemarkModal'
import DatePicker from '../../components/shared/DatePicker'
import { downloadCSVBlob } from '../../utils/csvDownload'
import toast from 'react-hot-toast'

const History = () => {
  const [logs, setLogs] = useState([])
  const [remarks, setRemarks] = useState([])
  const [selectedRemark, setSelectedRemark] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ startDate: '', endDate: '' })
  const [loading, setLoading] = useState(true)

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const [logsRes, remarksRes] = await Promise.all([
        getHistory({ ...filters, page, limit: 15 }),
        getMyRemarks(),
      ])
      setLogs(logsRes.data.logs)
      setPagination({
        page: logsRes.data.page,
        pages: logsRes.data.pages,
        total: logsRes.data.total,
      })
      setRemarks(remarksRes.data || [])
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const handleExport = async () => {
    try {
      const res = await exportCSV(filters)
      downloadCSVBlob(res.data, 'my-timelog.csv')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleRemarkClick = async (log) => {
    try {
      const remark = remarks.find((r) => r.logId?._id === log._id || r.logId === log._id)
      if (remark) {
        const res = await getRemarkById(remark._id)
        setSelectedRemark(res.data)
      }
    } catch {
      toast.error('Failed to load remark')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="History" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">

          {/* Filters */}
          <div className="card shadow-soft p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">From</label>
              <DatePicker
                value={filters.startDate}
                onChange={(val) => setFilters({ ...filters, startDate: val })}
                placeholder="Start date"
                className="w-44"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">To</label>
              <DatePicker
                value={filters.endDate}
                onChange={(val) => setFilters({ ...filters, endDate: val })}
                placeholder="End date"
                className="w-44"
              />
            </div>
            <button onClick={() => fetchLogs(1)} className="btn-primary self-end">
              Filter
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary self-end ml-auto flex items-center gap-2"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          <LogsTable
            logs={logs}
            total={pagination.total}
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={fetchLogs}
            onRemarkClick={handleRemarkClick}
          />
        </div>
      </main>

      {selectedRemark && (
        <RemarkModal
          remark={selectedRemark}
          onClose={() => setSelectedRemark(null)}
          onUpdate={() => { fetchLogs(); setSelectedRemark(null) }}
        />
      )}
    </div>
  )
}

export default History