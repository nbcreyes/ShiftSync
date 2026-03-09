import { useState, useEffect } from 'react'
import {
  Shield, Pencil, Flag, UserCog, UserX, UserCheck, Trash2,
  CalendarDays, Clock, Settings, FileCheck, ChevronLeft, ChevronRight
} from 'lucide-react'
import { getAuditLogs } from '../../api/audit'
import { getUsers } from '../../api/admin'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import Select from '../../components/shared/Select'
import toast from 'react-hot-toast'

const ACTION_CONFIG = {
  log_edited:           { label: 'Log Edited',          icon: Pencil,      color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-500' },
  log_flagged:          { label: 'Log Flagged',          icon: Flag,        color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' },
  log_bulk_flagged:     { label: 'Bulk Flagged',         icon: Flag,        color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' },
  leave_approved:       { label: 'Leave Approved',       icon: CalendarDays, color: 'bg-green-50 dark:bg-green-900/20 text-green-500' },
  leave_rejected:       { label: 'Leave Rejected',       icon: CalendarDays, color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  shift_set:            { label: 'Shift Set',            icon: Clock,       color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
  shift_deleted:        { label: 'Shift Deleted',        icon: Clock,       color: 'bg-slate-100 dark:bg-slate-700 text-slate-500' },
  member_role_changed:  { label: 'Role Changed',         icon: UserCog,     color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
  member_deactivated:   { label: 'Member Deactivated',   icon: UserX,       color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  member_activated:     { label: 'Member Activated',     icon: UserCheck,   color: 'bg-green-50 dark:bg-green-900/20 text-green-500' },
  member_deleted:       { label: 'Member Deleted',       icon: Trash2,      color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  workspace_updated:    { label: 'Workspace Updated',    icon: Settings,    color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-500' },
  manual_log_approved:  { label: 'Manual Log Approved',  icon: FileCheck,   color: 'bg-green-50 dark:bg-green-900/20 text-green-500' },
  manual_log_rejected:  { label: 'Manual Log Rejected',  icon: FileCheck,   color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
}

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  ...Object.entries(ACTION_CONFIG).map(([value, { label }]) => ({ value, label })),
]

const formatDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

const ActionBadge = ({ action }) => {
  const config = ACTION_CONFIG[action] || {
    label: action,
    icon: Shield,
    color: 'bg-slate-100 dark:bg-slate-700 text-slate-500',
  }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${config.color}`}>
      <Icon size={11} />
      {config.label}
    </span>
  )
}

const AuditLog = () => {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ action: '', performedBy: '' })

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (filters.action) params.action = filters.action
      if (filters.performedBy) params.performedBy = filters.performedBy
      const res = await getAuditLogs(params)
      setLogs(res.data.logs)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res.data)
    } catch {}
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { fetchLogs(1) }, [filters])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Audit Log" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">

          {/* Filters */}
          <div className="card shadow-soft p-4 flex flex-wrap gap-3 items-end">
            <div className="w-56">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Action
              </label>
              <Select
                options={ACTION_OPTIONS}
                value={filters.action}
                onChange={(val) => setFilters({ ...filters, action: val })}
              />
            </div>
            <div className="w-56">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Performed By
              </label>
              <Select
                options={[
                  { value: '', label: 'Anyone' },
                  ...users.map((u) => ({ value: u._id, label: u.name })),
                ]}
                value={filters.performedBy}
                onChange={(val) => setFilters({ ...filters, performedBy: val })}
              />
            </div>
            {(filters.action || filters.performedBy) && (
              <button
                onClick={() => setFilters({ action: '', performedBy: '' })}
                className="btn-secondary self-end text-xs"
              >
                Clear filters
              </button>
            )}
            <p className="self-end ml-auto text-xs text-slate-400">
              {pagination.total} total entries
            </p>
          </div>

          {/* Log list */}
          {loading && (
            <div className="flex justify-center py-14">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="card shadow-soft p-14 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Shield size={22} className="text-brand-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No audit entries found</p>
              <p className="text-xs text-slate-400">Admin actions will appear here as they happen.</p>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="card shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Action', 'Description', 'Performed By', 'Target', 'When'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-5 py-3.5 max-w-xs" style={{ verticalAlign: 'middle' }}>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {log.performedBy?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {log.performedBy?.name}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">{log.performedBy?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        {log.targetUser ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {log.targetUser.name}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => fetchLogs(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => fetchLogs(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default AuditLog