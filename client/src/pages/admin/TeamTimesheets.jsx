import { useState, useEffect } from 'react'
import { Download, Flag, AlertTriangle, Clock, Pencil } from 'lucide-react'
import { getUsers, getUserTimelog, exportCSV, adminEditLog } from '../../api/admin'
import { getFlags } from '../../api/shift'
import { createRemark, getRemarkById, getAllRemarks } from '../../api/remark'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import StatusBadge from '../../components/shared/StatusBadge'
import RemarkThread from '../../components/admin/RemarkThread'
import ManualLogRequests from '../../components/admin/ManualLogRequests'
import Select from '../../components/shared/Select'
import DatePicker from '../../components/shared/DatePicker'
import TimePicker from '../../components/shared/TimePicker'
import { formatTime, formatDate } from '../../utils/formatTime'
import { downloadCSVBlob } from '../../utils/csvDownload'
import toast from 'react-hot-toast'

const FlagBadge = ({ type, lateBy }) => {
  if (type === 'absent') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full">
        <AlertTriangle size={9} />
        Absent
      </span>
    )
  }
  if (type === 'late') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-500 px-1.5 py-0.5 rounded-full">
        <Clock size={9} />
        Late {lateBy}m
      </span>
    )
  }
  return null
}

const getDefaultRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toISO = (d) => d.toISOString().split('T')[0]
  return { startDate: toISO(start), endDate: toISO(end) }
}

// Convert "HH:mm" + date string into full ISO
const toISO = (date, time) => {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

// Extract "HH:mm" from ISO string
const toHHMM = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const TeamTimesheets = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [logs, setLogs] = useState([])
  const [flags, setFlags] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getDefaultRange()
    return { startDate, endDate }
  })
  const [flagModal, setFlagModal] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [selectedRemark, setSelectedRemark] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showFlagsOnly, setShowFlagsOnly] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ timeIn: '', timeOut: '', adminNote: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers()
        setUsers(res.data)
      } catch {
        toast.error('Failed to load users')
      }
    }
    fetchUsers()
  }, [])

  const fetchLogs = async (userId, page = 1) => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await getUserTimelog(userId, { ...filters, page, limit: 15 })
      setLogs(res.data.logs)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch {
      toast.error('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchFlagsForUser = async (userId) => {
    if (!filters.startDate || !filters.endDate) return
    try {
      const res = await getFlags({ startDate: filters.startDate, endDate: filters.endDate })
      const filtered = res.data.filter(
        (flag) => flag.userId?._id === userId || flag.userId === userId
      )
      setFlags(filtered)
    } catch {
      // Flags are optional — fail silently
    }
  }

  const handleUserSelect = (userId) => {
    const u = users.find((u) => u._id === userId)
    if (!u) return
    setSelectedUser(u)
    setLogs([])
    setFlags([])
    fetchLogs(u._id)
    fetchFlagsForUser(u._id)
  }

  const handleFilter = () => {
    if (selectedUser) {
      fetchLogs(selectedUser._id)
      fetchFlagsForUser(selectedUser._id)
    }
  }

  const handleFlag = async () => {
    if (!adminNote.trim()) return
    setFlagging(true)
    try {
      await createRemark(flagModal._id, adminNote)
      toast.success('Log flagged')
      setFlagModal(null)
      setAdminNote('')
      fetchLogs(selectedUser._id, pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to flag log')
    } finally {
      setFlagging(false)
    }
  }

  const handleOpenThread = async (log) => {
    try {
      const res = await getAllRemarks({ logId: log._id })
      if (res.data?.length > 0) {
        const thread = await getRemarkById(res.data[0]._id)
        setSelectedRemark(thread.data)
      }
    } catch {
      toast.error('Failed to load remark')
    }
  }

  const handleExport = async () => {
    try {
      const res = await exportCSV({ userId: selectedUser?._id, ...filters })
      downloadCSVBlob(res.data, 'team-timelog.csv')
    } catch {
      toast.error('Export failed')
    }
  }

  const openEditModal = (log) => {
    setEditModal(log)
    setEditForm({
      timeIn: toHHMM(log.timeIn),
      timeOut: toHHMM(log.timeOut),
      adminNote: log.adminNote || '',
    })
  }

  const handleEditSave = async () => {
    if (!editForm.timeIn) {
      toast.error('Time In is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        timeIn: toISO(editModal.date, editForm.timeIn),
        timeOut: editForm.timeOut ? toISO(editModal.date, editForm.timeOut) : undefined,
        adminNote: editForm.adminNote,
      }

      if (payload.timeOut && payload.timeOut <= payload.timeIn) {
        toast.error('Time Out must be after Time In')
        setSaving(false)
        return
      }

      await adminEditLog(editModal._id, payload)
      toast.success('Log updated')
      setEditModal(null)
      fetchLogs(selectedUser._id, pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update log')
    } finally {
      setSaving(false)
    }
  }

  // Build flag lookup map: date -> flag
  const flagMap = {}
  flags.forEach((f) => { flagMap[f.date] = f })

  // Absent flags with no corresponding log
  const logDates = new Set(logs.map((l) => l.date))
  const absentOnlyFlags = flags.filter((f) => f.type === 'absent' && !logDates.has(f.date))

  // Combined rows
  const rows = [
    ...logs.map((log) => ({ type: 'log', log, flag: flagMap[log.date] || null })),
    ...absentOnlyFlags.map((f) => ({ type: 'absent', flag: f })),
  ].sort((a, b) => {
    const dateA = a.type === 'log' ? a.log.date : a.flag.date
    const dateB = b.type === 'log' ? b.log.date : b.flag.date
    return dateA < dateB ? 1 : -1
  })

  const filteredRows = showFlagsOnly ? rows.filter((r) => r.flag) : rows
  const flagCount = rows.filter((r) => r.flag).length

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Team Timesheets" />
        <div className="p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">

          <ManualLogRequests onRequestReviewed={() => fetchLogs(selectedUser?._id)} />

          {/* Filters */}
          <div className="card shadow-soft p-4 flex flex-wrap gap-3 items-end">
            <div className="w-56">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Employee
              </label>
              <Select
                options={users.map((u) => ({ value: u._id, label: u.name }))}
                value={selectedUser?._id || ''}
                onChange={handleUserSelect}
                placeholder="Select employee..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                From
              </label>
              <DatePicker
                value={filters.startDate}
                onChange={(val) => setFilters({ ...filters, startDate: val })}
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
                onChange={(val) => setFilters({ ...filters, endDate: val })}
                placeholder="End date"
                className="w-44"
              />
            </div>
            {selectedUser && (
              <button onClick={handleFilter} className="btn-primary self-end">
                Filter
              </button>
            )}
            <button
              onClick={handleExport}
              className="btn-secondary self-end ml-auto flex items-center gap-2"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          {/* Flag summary banner */}
          {flagCount > 0 && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {flagCount} attendance flag{flagCount > 1 ? 's' : ''} found in this period
                </p>
              </div>
              <button
                onClick={() => setShowFlagsOnly(!showFlagsOnly)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  showFlagsOnly
                    ? 'bg-amber-500 text-white'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
              >
                {showFlagsOnly ? 'Show All' : 'Show Flagged Only'}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60">
                    {['Date', 'In', 'Out', 'Break', 'Worked', 'Flags', 'Status', 'Note', ''].map((h) => (
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
                  {!selectedUser && (
                    <tr>
                      <td colSpan={9} className="px-5 py-14 text-center text-sm text-slate-400">
                        Select an employee to view their logs
                      </td>
                    </tr>
                  )}
                  {selectedUser && loading && (
                    <tr>
                      <td colSpan={9} className="px-5 py-14 text-center">
                        <div className="flex justify-center">
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedUser && !loading && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-14 text-center text-sm text-slate-400">
                        No logs found
                      </td>
                    </tr>
                  )}

                  {!loading && filteredRows.map((row) => {
                    if (row.type === 'absent') {
                      return (
                        <tr key={`absent-${row.flag.date}`} className="bg-red-50/30 dark:bg-red-900/10">
                          <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200" style={{ verticalAlign: 'middle' }}>
                            {formatDate(row.flag.date)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-xs" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-xs" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5 text-slate-400" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5 text-slate-400" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                            <FlagBadge type="absent" />
                          </td>
                          <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5 text-xs text-slate-400" style={{ verticalAlign: 'middle' }}>—</td>
                          <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }} />
                        </tr>
                      )
                    }

                    const { log, flag } = row
                    const workedMins = log.timeOut
                      ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
                      : null

                    return (
                      <tr
                        key={log._id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          flag ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center gap-1.5">
                            {formatDate(log.date)}
                            {log.isManual && (
                              <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-1.5 py-0.5 rounded-full">
                                Manual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs" style={{ verticalAlign: 'middle' }}>
                          {formatTime(log.timeIn)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs" style={{ verticalAlign: 'middle' }}>
                          {formatTime(log.timeOut)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                          {Math.round(log.totalBreakMins)}m
                        </td>
                        <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                          <span className={`font-semibold font-mono text-xs ${log.overtime ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                            {workedMins !== null ? `${(workedMins / 60).toFixed(2)}h` : '--'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                          {flag ? (
                            <FlagBadge type={flag.type} lateBy={flag.lateBy} />
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 max-w-xs truncate" style={{ verticalAlign: 'middle' }}>
                          {log.adminNote || log.employeeNote || '—'}
                        </td>
                        <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(log)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                              title="Edit log"
                            >
                              <Pencil size={13} />
                            </button>
                            {log.status === 'clean' && (
                              <button
                                onClick={() => setFlagModal(log)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                title="Flag log"
                              >
                                <Flag size={14} />
                              </button>
                            )}
                            {(log.status === 'remarked' || log.status === 'resolved') && (
                              <button
                                onClick={() => handleOpenThread(log)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-orange-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                              >
                                <Flag size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <p className="text-xs text-slate-400">{pagination.total} logs total</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchLogs(selectedUser._id, p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        p === pagination.page
                          ? 'bg-brand-500 text-white'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit log modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Pencil size={14} className="text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Edit Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(editModal.date)} · {selectedUser?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Time In
                  </label>
                  <TimePicker
                    value={editForm.timeIn}
                    onChange={(val) => setEditForm({ ...editForm, timeIn: val })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Time Out
                  </label>
                  <TimePicker
                    value={editForm.timeOut}
                    onChange={(val) => setEditForm({ ...editForm, timeOut: val })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Admin Note
                </label>
                <textarea
                  value={editForm.adminNote}
                  onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                  rows={3}
                  placeholder="Optional note about this edit..."
                  className="input-base resize-none w-full"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setEditModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Flag this log
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {formatDate(flagModal.date)} · {formatTime(flagModal.timeIn)} — {formatTime(flagModal.timeOut)}
            </p>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Describe the issue..."
              className="input-base resize-none mb-4 w-full"
            />
            <div className="flex gap-2.5">
              <button
                onClick={() => { setFlagModal(null); setAdminNote('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={flagging || !adminNote.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl py-2.5 transition-all active:scale-95"
              >
                {flagging ? 'Flagging...' : 'Flag Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRemark && (
        <RemarkThread
          remark={selectedRemark}
          onClose={() => setSelectedRemark(null)}
          onUpdate={() => { fetchLogs(selectedUser?._id); setSelectedRemark(null) }}
        />
      )}
    </div>
  )
}

export default TeamTimesheets