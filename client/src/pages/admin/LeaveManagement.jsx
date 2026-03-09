import { useState, useEffect } from 'react'
import { CalendarDays, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'
import { getAllLeaves, reviewLeave } from '../../api/leave'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import Select from '../../components/shared/Select'
import toast from 'react-hot-toast'

const LEAVE_TYPES = ['vacation', 'sick', 'personal', 'unpaid', 'other']

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
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: '', adminNote: '' })
  const [reviewing, setReviewing] = useState(false)

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res = await getAllLeaves(statusFilter ? { status: statusFilter } : {})
      setLeaves(res.data)
    } catch {
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaves() }, [statusFilter])

  const openReview = (leave) => {
    setReviewModal(leave)
    setReviewForm({ status: '', adminNote: '' })
  }

  const handleReview = async () => {
    if (!reviewForm.status) {
      toast.error('Please select approve or reject')
      return
    }
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

  const pendingCount = leaves.filter((l) => l.status === 'pending').length
  const approvedCount = leaves.filter((l) => l.status === 'approved').length
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Leave Management" />
        <div className="p-6 space-y-5 max-w-4xl mx-auto animate-fade-in">

          {/* Summary cards */}
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

          {/* Filter */}
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
          </div>

          {/* List */}
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
                    {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Reason', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {leave.userId?.name}
                        </p>
                        <p className="text-xs text-slate-400">{leave.userId?.department || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        <span className="capitalize text-slate-600 dark:text-slate-300 text-xs font-medium">
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200" style={{ verticalAlign: 'middle' }}>
                        {getDayCount(leave.startDate, leave.endDate)}d
                      </td>
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[180px] truncate" style={{ verticalAlign: 'middle' }}>
                        {leave.reason || '—'}
                      </td>
                      <td className="px-5 py-3.5" style={{ verticalAlign: 'middle' }}>
                        {leave.status === 'pending' && (
                          <button
                            onClick={() => openReview(leave)}
                            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                          >
                            Review
                            <ChevronDown size={12} />
                          </button>
                        )}
                        {leave.status !== 'pending' && leave.adminNote && (
                          <span className="text-xs text-slate-400 italic truncate max-w-[120px] block">
                            {leave.adminNote}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <CalendarDays size={14} className="text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Review Leave Request
                </h3>
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
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      reviewForm.status === 'approved'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle size={15} />
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      reviewForm.status === 'rejected'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:border-red-300'
                    }`}
                  >
                    <XCircle size={15} />
                    Reject
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
              <button
                onClick={() => setReviewModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewing || !reviewForm.status}
                className={`flex-1 text-sm font-medium rounded-xl py-2.5 transition-all active:scale-95 disabled:opacity-50 text-white ${
                  reviewForm.status === 'rejected'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
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