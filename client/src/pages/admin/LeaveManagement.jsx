import { useState, useEffect } from 'react'
import { CalendarDays, CheckCircle, XCircle, Clock, ChevronDown, Settings, CheckSquare, Square, Download } from 'lucide-react'
import { getAllLeaves, reviewLeave } from '../../api/leave'
import { getAllBalances, setUserBalance } from '../../api/leaveBalance'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import Select from '../../components/shared/Select'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const BALANCE_TYPES = ['vacation', 'sick', 'personal']

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',  icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',  icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-50 dark:bg-red-900/20 text-red-500',                            icon: XCircle },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getDayCount = (start, end) => {
  if (!start || !end) return 0
  const diff = new Date(end + 'T12:00:00') - new Date(start + 'T12:00:00')
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
}

const LeaveStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
      <Icon size={11} />
      {config.label}
    </span>
  )
}

const LeaveManagement = () => {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  const [activeTab, setActiveTab] = useState('requests')
  const [leaves, setLeaves] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: '', adminNote: '' })
  const [reviewing, setReviewing] = useState(false)
  const [balanceEdits, setBalanceEdits] = useState({})
  const [savingBalance, setSavingBalance] = useState(null)
  const [selected, setSelected] = useState([])
  const [bulkNote, setBulkNote] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const year = new Date().getFullYear()

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res = await getAllLeaves(statusFilter ? { status: statusFilter } : {})
      setLeaves(res.data)
      setSelected([])
    } catch {
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalances = async () => {
    try {
      const res = await getAllBalances(year)
      setBalances(res.data)
      const edits = {}
      res.data.forEach((b) => {
        edits[b.userId._id] = {
          vacation: b.balances.vacation.allowed,
          sick: b.balances.sick.allowed,
          personal: b.balances.personal.allowed,
        }
      })
      setBalanceEdits(edits)
    } catch {
      toast.error('Failed to load balances')
    }
  }

  useEffect(() => { fetchLeaves() }, [statusFilter])
  useEffect(() => { if (isOwner && activeTab === 'balances') fetchBalances() }, [activeTab])

  const openReview = (leave) => {
    setReviewModal(leave)
    setReviewForm({ status: '', adminNote: '' })
  }

  const handleReview = async () => {
    if (!reviewForm.status) { toast.error('Please select approve or reject'); return }
    setReviewing(true)
    try {
      await reviewLeave(reviewModal._id, reviewForm)
      toast.success(`Leave request ${reviewForm.status}`)
      setReviewModal(null)
      fetchLeaves()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review request')
    } finally {
      setReviewing(false)
    }
  }

  const pendingLeaves = leaves.filter((l) => l.status === 'pending')

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === pendingLeaves.length) {
      setSelected([])
    } else {
      setSelected(pendingLeaves.map((l) => l._id))
    }
  }

  const handleBulkReview = async (status) => {
    if (selected.length === 0) return
    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    await Promise.all(
      selected.map(async (id) => {
        try {
          await reviewLeave(id, { status, adminNote: bulkNote.trim() || null })
          successCount++
        } catch {
          failCount++
        }
      })
    )

    if (successCount > 0) toast.success(`${successCount} request${successCount > 1 ? 's' : ''} ${status}`)
    if (failCount > 0) toast.error(`${failCount} request${failCount > 1 ? 's' : ''} failed`)

    setBulkNote('')
    setSelected([])
    setBulkProcessing(false)
    fetchLeaves()
  }

  const handleSaveBalance = async (userId) => {
    setSavingBalance(userId)
    try {
      await setUserBalance(userId, { year, balances: balanceEdits[userId] })
      toast.success('Balance updated')
      fetchBalances()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save balance')
    } finally {
      setSavingBalance(null)
    }
  }

  const exportCSV = () => {
    const rows = leaves.map((l) => [
      l.userId?.name || '—',
      l.userId?.department || '—',
      l.type,
      l.startDate,
      l.endDate,
      getDayCount(l.startDate, l.endDate),
      l.status,
      l.reason ? `"${l.reason.replace(/"/g, '""')}"` : '—',
      l.adminNote ? `"${l.adminNote.replace(/"/g, '""')}"` : '—',
    ].join(','))

    const header = 'Employee,Department,Type,Start Date,End Date,Days,Status,Reason,Admin Note'
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pendingCount = leaves.filter((l) => l.status === 'pending').length
  const approvedCount = leaves.filter((l) => l.status === 'approved').length
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length
  const allPendingSelected = pendingLeaves.length > 0 && selected.length === pendingLeaves.length

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Leave Management" />
        <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">

          {/* Tabs */}
          {isOwner && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
              {[
                { key: 'requests', label: 'Requests' },
                { key: 'balances', label: 'Leave Balances', icon: Settings },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Requests tab ───────────────────────────────────────────────── */}
          {activeTab === 'requests' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card shadow-soft p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Pending</p>
                </div>
                <div className="card shadow-soft p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Approved</p>
                </div>
                <div className="card shadow-soft p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Rejected</p>
                </div>
              </div>

              {/* Filter + Export */}
              <div className="card shadow-soft p-4 flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                  Filter by status
                </label>
                <div className="w-48">
                  <Select
                    options={[
                      { value: '', label: 'All requests' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </div>
                <div className="ml-auto">
                  <button
                    onClick={exportCSV}
                    disabled={leaves.length === 0}
                    className="flex items-center gap-2 btn-secondary text-xs px-3 py-2 disabled:opacity-40"
                  >
                    <Download size={13} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Bulk action bar */}
              {selected.length > 0 && (
                <div className="card shadow-soft p-4 border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 shrink-0">
                    {selected.length} selected
                  </p>
                  <input
                    type="text"
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="Optional note for all selected..."
                    className="input-base flex-1 py-1.5 text-sm"
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleBulkReview('approved')}
                      disabled={bulkProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Approve All
                    </button>
                    <button
                      onClick={() => handleBulkReview('rejected')}
                      disabled={bulkProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Reject All
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex justify-center py-14">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && leaves.length === 0 && (
                <div className="card shadow-soft p-14 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                    <CalendarDays size={22} className="text-brand-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">No leave requests</p>
                  <p className="text-xs text-slate-400">
                    {statusFilter ? `No ${statusFilter} requests found.` : 'No leave requests have been submitted yet.'}
                  </p>
                </div>
              )}

              {!loading && leaves.length > 0 && (
                <div className="card shadow-soft overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700/60">
                        <th className="pl-5 py-3 w-8">
                          {pendingLeaves.length > 0 && (
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-brand-500 transition-colors">
                              {allPendingSelected
                                ? <CheckSquare size={15} className="text-brand-500" />
                                : <Square size={15} />
                              }
                            </button>
                          )}
                        </th>
                        {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Reason', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {leaves.map((leave) => {
                        const isPending = leave.status === 'pending'
                        const isSelected = selected.includes(leave._id)
                        return (
                          <tr
                            key={leave._id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isSelected ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
                          >
                            <td className="pl-5 py-3.5 w-8" style={{ verticalAlign: 'middle' }}>
                              {isPending && (
                                <button onClick={() => toggleSelect(leave._id)} className="text-slate-400 hover:text-brand-500 transition-colors">
                                  {isSelected
                                    ? <CheckSquare size={15} className="text-brand-500" />
                                    : <Square size={15} />
                                  }
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3.5" style={{ verticalAlign: 'middle' }}>
                              <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{leave.userId?.name}</p>
                              <p className="text-xs text-slate-400">{leave.userId?.department || '—'}</p>
                            </td>
                            <td className="px-4 py-3.5" style={{ verticalAlign: 'middle' }}>
                              <span className="capitalize text-slate-600 dark:text-slate-300 text-xs font-medium">{leave.type}</span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200" style={{ verticalAlign: 'middle' }}>
                              {getDayCount(leave.startDate, leave.endDate)}d
                            </td>
                            <td className="px-4 py-3.5" style={{ verticalAlign: 'middle' }}>
                              <LeaveStatusBadge status={leave.status} />
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-400 max-w-[180px] truncate" style={{ verticalAlign: 'middle' }}>
                              {leave.reason || '—'}
                            </td>
                            <td className="px-4 py-3.5" style={{ verticalAlign: 'middle' }}>
                              {isPending && !isSelected && (
                                <button
                                  onClick={() => openReview(leave)}
                                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                                >
                                  Review <ChevronDown size={12} />
                                </button>
                              )}
                              {leave.status !== 'pending' && leave.adminNote && (
                                <span className="text-xs text-slate-400 italic truncate max-w-[120px] block">
                                  {leave.adminNote}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Balances tab (owner only) ───────────────────────────────────── */}
          {activeTab === 'balances' && isOwner && (
            <div className="card shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {year} Leave Allowances
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set allowed days per leave type per employee. Unpaid and Other are unlimited.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/60">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                      {BALANCE_TYPES.map((t) => (
                        <th key={t} className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{t}</th>
                      ))}
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Used</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {balances.map((b) => {
                      const uid = b.userId._id
                      const edits = balanceEdits[uid] || {}
                      return (
                        <tr key={uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                          <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{b.userId.name}</p>
                            <p className="text-xs text-slate-400">{b.userId.department || '—'}</p>
                          </td>
                          {BALANCE_TYPES.map((type) => (
                            <td key={type} className="px-4 py-3.5 text-center" style={{ verticalAlign: 'middle' }}>
                              <input
                                type="number"
                                min="0"
                                max="365"
                                value={edits[type] ?? 0}
                                onChange={(e) => setBalanceEdits((prev) => ({
                                  ...prev,
                                  [uid]: { ...prev[uid], [type]: parseInt(e.target.value) || 0 },
                                }))}
                                className="w-16 text-center input-base py-1.5 text-sm"
                              />
                            </td>
                          ))}
                          <td className="px-5 py-3.5 text-right" style={{ verticalAlign: 'middle' }}>
                            <div className="text-xs text-slate-400 space-y-0.5">
                              {BALANCE_TYPES.map((type) => (
                                <div key={type}>
                                  <span className="capitalize">{type}:</span>{' '}
                                  <span className="font-medium text-slate-600 dark:text-slate-300">{b.balances[type].used}d</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right" style={{ verticalAlign: 'middle' }}>
                            <button
                              onClick={() => handleSaveBalance(uid)}
                              disabled={savingBalance === uid}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              {savingBalance === uid ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {balances.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Single review modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <CalendarDays size={14} className="text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Review Leave Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {reviewModal.userId?.name} · {reviewModal.type} · {formatDate(reviewModal.startDate)} — {formatDate(reviewModal.endDate)}
                </p>
              </div>
            </div>

            {reviewModal.reason && (
              <div className="mb-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 mb-1">Employee's reason</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{reviewModal.reason}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Decision</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      reviewForm.status === 'approved'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      reviewForm.status === 'rejected'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-red-300'
                    }`}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Note <span className="text-slate-300 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={reviewForm.adminNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminNote: e.target.value })}
                  rows={3}
                  placeholder="Add a note for the employee..."
                  className="input-base resize-none w-full"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleReview}
                disabled={reviewing || !reviewForm.status}
                className={`flex-1 text-sm font-medium rounded-xl py-2.5 transition-all active:scale-95 disabled:opacity-50 text-white ${
                  reviewForm.status === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {reviewing ? 'Saving...' : reviewForm.status === 'rejected' ? 'Reject Request' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveManagement