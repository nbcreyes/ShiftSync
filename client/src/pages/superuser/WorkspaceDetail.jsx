import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { getWorkspaceById, exportCSV } from '../../api/superuser'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import StatusBadge from '../../components/shared/StatusBadge'
import { formatTime, formatDate } from '../../utils/formatTime'
import { downloadCSVBlob } from '../../utils/csvDownload'
import { PageSkeleton } from '../../components/shared/LoadingSkeleton'
import toast from 'react-hot-toast'

const WorkspaceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('members')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await getWorkspaceById(id)
        setWorkspace(res.data)
      } catch {
        toast.error('Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleExport = async () => {
    try {
      const res = await exportCSV({ tenantId: id })
      downloadCSVBlob(res.data, `${workspace?.companyName}-timelog.csv`)
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1">
          <Navbar title="Workspace" />
          <PageSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={workspace?.companyName || 'Workspace'} />
        <div className="p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">

          {/* Header actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/superuser')}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={15} />
              Back to platform
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download size={15} />
              Export CSV
            </button>
          </div>

          {/* Info card */}
          <div className="card shadow-soft p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              {workspace?.companyName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Created {new Date(workspace?.createdAt).toLocaleDateString()} ·{' '}
              <span className="font-medium">{workspace?.members?.length}</span> members
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            {['members', 'recent logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-150 capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-soft'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="card shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/60">
                      {['Member', 'Email', 'Role', 'Department', 'Status'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {workspace?.members?.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No members</td></tr>
                    )}
                    {workspace?.members?.map((member) => (
                      <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{member.email}</td>
                        <td className="px-5 py-3.5 capitalize text-slate-700 dark:text-slate-300 text-sm">{member.role}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{member.department || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold ${member.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent logs tab */}
          {activeTab === 'recent logs' && (
            <div className="card shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/60">
                      {['Employee', 'Date', 'In', 'Out', 'Worked', 'Status'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {workspace?.recentLogs?.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">No logs found</td></tr>
                    )}
                    {workspace?.recentLogs?.map((log) => {
                      const workedMins = log.timeOut
                        ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
                        : null
                      return (
                        <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{log.userId?.name || '—'}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(log.date)}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatTime(log.timeIn)}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatTime(log.timeOut)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`font-semibold font-mono text-xs ${log.overtime ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                              {workedMins !== null ? `${(workedMins / 60).toFixed(2)}h` : '--'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default WorkspaceDetail