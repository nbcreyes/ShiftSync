import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { getStats, getWorkspaces, exportCSV } from '../../api/superuser'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import StatsCards from '../../components/superuser/StatsCards'
import WorkspacesTable from '../../components/superuser/WorkspacesTable'
import { downloadCSVBlob } from '../../utils/csvDownload'
import { PageSkeleton } from '../../components/shared/LoadingSkeleton'
import toast from 'react-hot-toast'

const SuperuserDashboard = () => {
  const [stats, setStats] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, workspacesRes] = await Promise.all([getStats(), getWorkspaces()])
      setStats(statsRes.data)
      setWorkspaces(workspacesRes.data)
    } catch {
      toast.error('Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleExport = async () => {
    try {
      const res = await exportCSV({})
      downloadCSVBlob(res.data, 'platform-timelog.csv')
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1">
          <Navbar title="Platform" />
          <PageSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Platform Overview" />
        <div className="p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Platform-wide statistics
            </p>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={15} />
              Export All CSV
            </button>
          </div>

          <StatsCards stats={stats} />
          <WorkspacesTable workspaces={workspaces} />
        </div>
      </main>
    </div>
  )
}

export default SuperuserDashboard