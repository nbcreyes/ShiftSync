import { useState, useEffect } from 'react'
import { Plus, X, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react'
import { submitLeave, getMyLeaves, cancelLeave } from '../../api/leave'
import { getMyBalance } from '../../api/leaveBalance'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import Select from '../../components/shared/Select'
import DatePicker from '../../components/shared/DatePicker'
import toast from 'react-hot-toast'

const LEAVE_TYPES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'other', label: 'Other' },
]

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

const capitalize = (s) => s?.charAt(0).toUpperCase() + s?.slice(1)

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

const Leave = () => {
  const [leaves, setLeaves] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '', reason: '' })

  const year = new Date().getFullYear()

  const fetchAll = async () => {
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        getMyLeaves(),
        getMyBalance(year),
      ])
      setLeaves(leavesRes.data)
      setBalance(balanceRes.data)
    } catch {
      toast.error('Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.type || !form.startDate || !form.endDate) {
      toast.error('Type, start date, and end date are required')
      return
    }
    if (form.endDate < form.startDate) {
      toast.error('End date must be on or after start date')
      return
    }
    setSubmitting(true)
    try {
      await submitLeave(form)
      toast.success('Leave request submitted')
      setShowModal(false)
      setForm({ type: '', startDate: '', endDate: '', reason: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    setCancelling(id)
    try {
      await cancelLeave(id)
      toast.success('Leave request cancelled')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request')
    } finally {
      setCancelling(null)
    }
  }

  const pendingCount = leaves.filter((l) => l.status === 'pending').length
  const approvedCount = leaves.filter((l) => l.status === 'approved').length
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length

  const getRemaining = (type) => {
    if (!balance) return null
    const b = balance.balances[type]
    if (!b || b.allowed === 0) return null
    return b.allowed - b.used
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Leave Requests" />
        <div className="p-6 space-y-5 max-w-3xl mx-auto animate-fade-in">

          {/* Balance cards */}
          {balance && (
            <div className="card shadow-soft p-5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {year} Leave Balance
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {BALANCE_TYPES.map((type) => {
                  const b = balance.balances[type]
                  const remaining = b.allowed - b.used
                  const pct = b.allowed > 0 ? Math.max(0, (remaining / b.allowed) * 100) : 0
                  return (
                    <div key={type} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize mb-2">{type}</p>
                      {b.allowed === 0 ? (
                        <p className="text-xs text-slate-400">Not set</p>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {remaining}
                            <span className="text-xs font-normal text-slate-400 ml-1">/ {b.allowed} days</span>
                          </p>
                          <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{b.used} used</p>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary + action */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3">
              <div className="card shadow-soft px-4 py-3 text-center min-w-[80px]">
                <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Pending</p>
              </div>
              <div className="card shadow-soft px-4 py-3 text-center min-w-[80px]">
                <p className="text-xl font-bold text-green-500">{approvedCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Approved</p>
              </div>
              <div className="card shadow-soft px-4 py-3 text-center min-w-[80px]">
                <p className="text-xl font-bold text-red-500">{rejectedCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Rejected</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={15} />
              New Request
            </button>
          </div>

          {/* Leaves list */}
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
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No leave requests yet</p>
              <p className="text-xs text-slate-400">Submit a request using the button above.</p>
            </div>
          )}

          {!loading && leaves.length > 0 && (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div key={leave._id} className="card shadow-soft p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                          {leave.type} Leave
                        </span>
                        <LeaveStatusBadge status={leave.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                        <span className="ml-2 text-slate-400">
                          ({getDayCount(leave.startDate, leave.endDate)} day{getDayCount(leave.startDate, leave.endDate) > 1 ? 's' : ''})
                        </span>
                      </p>
                      {leave.reason && (
                        <p className="text-xs text-slate-400 mt-1.5 italic">"{leave.reason}"</p>
                      )}
                      {leave.adminNote && (
                        <div className="mt-2.5 flex items-start gap-1.5">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Admin note:</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">{leave.adminNote}</span>
                        </div>
                      )}
                      {leave.reviewedBy && (
                        <p className="text-xs text-slate-400 mt-1">Reviewed by {leave.reviewedBy.name}</p>
                      )}
                    </div>
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(leave._id)}
                        disabled={cancelling === leave._id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                        title="Cancel request"
                      >
                        {cancelling === leave._id
                          ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <X size={14} />
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New request modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                  <CalendarDays size={14} className="text-brand-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Leave Request</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Leave Type
                </label>
                <Select
                  options={LEAVE_TYPES}
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  placeholder="Select type..."
                />
                {/* Show remaining balance for selected type */}
                {form.type && getRemaining(form.type) !== null && (
                  <p className="text-xs mt-1.5 text-slate-500 dark:text-slate-400">
                    Remaining: <strong className={getRemaining(form.type) <= 2 ? 'text-red-500' : 'text-green-500'}>
                      {getRemaining(form.type)} day{getRemaining(form.type) !== 1 ? 's' : ''}
                    </strong>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">From</label>
                  <DatePicker
                    value={form.startDate}
                    onChange={(val) => setForm({ ...form, startDate: val })}
                    placeholder="Start date"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">To</label>
                  <DatePicker
                    value={form.endDate}
                    onChange={(val) => setForm({ ...form, endDate: val })}
                    placeholder="End date"
                    className="w-full"
                  />
                </div>
              </div>

              {form.startDate && form.endDate && form.endDate >= form.startDate && (
                <p className="text-xs text-brand-500 font-medium">
                  {getDayCount(form.startDate, form.endDate)} day{getDayCount(form.startDate, form.endDate) > 1 ? 's' : ''} requested
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Reason <span className="text-slate-300 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  placeholder="Brief explanation..."
                  className="input-base resize-none w-full"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leave