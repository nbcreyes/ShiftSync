import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, X, Clock } from 'lucide-react'
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '../../api/announcement'
import Sidebar from '../../components/shared/Sidebar'
import Navbar from '../../components/shared/Navbar'
import DatePicker from '../../components/shared/DatePicker'
import toast from 'react-hot-toast'
import { format, parseISO, isPast } from 'date-fns'

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({ title: '', message: '', expiresAt: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    try {
      const res = await getAllAnnouncements()
      setAnnouncements(res.data)
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSubmitting(true)
    try {
      await createAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        expiresAt: form.expiresAt || null,
      })
      toast.success('Announcement posted')
      setShowModal(false)
      setForm({ title: '', message: '', expiresAt: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    setDeleting(id)
    try {
      await deleteAnnouncement(id)
      toast.success('Announcement deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (str) => {
    try { return format(parseISO(str), 'MMM d, yyyy · h:mm a') } catch { return '—' }
  }

  const isExpired = (ann) => ann.expiresAt && isPast(new Date(ann.expiresAt))

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title="Announcements" />
        <div className="p-6 space-y-5 max-w-3xl mx-auto animate-fade-in">

          {/* Header action */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Post workspace-wide notices visible to all members on their dashboard.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={14} />
              New Announcement
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="card shadow-soft py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Megaphone size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No announcements yet</p>
              <p className="text-xs text-slate-400">Post a notice and it will appear on all members' dashboards.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const expired = isExpired(ann)
                return (
                  <div
                    key={ann._id}
                    className={`card shadow-soft p-5 ${expired ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${expired ? 'bg-slate-100 dark:bg-slate-700' : 'bg-brand-50 dark:bg-brand-900/20'}`}>
                          <Megaphone size={15} className={expired ? 'text-slate-400' : 'text-brand-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{ann.title}</p>
                            {expired && (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-1.5 py-0.5">Expired</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ann.message}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[10px] text-slate-400">
                              Posted by {ann.createdBy?.name} · {formatDate(ann.createdAt)}
                            </span>
                            {ann.expiresAt && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={9} />
                                Expires {formatDate(ann.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(ann._id)}
                        disabled={deleting === ann._id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                      >
                        {deleting === ann._id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 shadow-card animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                  <Megaphone size={14} className="text-brand-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Announcement</h3>
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
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Office closed Friday"
                  className="input-base w-full"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  placeholder="Write your announcement here..."
                  className="input-base resize-none w-full"
                  maxLength={1000}
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{form.message.length}/1000</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Expires On <span className="text-slate-300 normal-case font-normal">(optional)</span>
                </label>
                <DatePicker
                  value={form.expiresAt}
                  onChange={(val) => setForm({ ...form, expiresAt: val })}
                  minDate={new Date().toISOString().split('T')[0]}
                  placeholder="No expiry"
                  className="w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to show indefinitely</p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Announcements