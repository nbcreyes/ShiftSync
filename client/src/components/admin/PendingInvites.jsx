import { useState, useEffect } from 'react'
import { Trash2, Clock } from 'lucide-react'
import { getPendingInvites, cancelInvite } from '../../api/invite'
import toast from 'react-hot-toast'

const PendingInvites = ({ refresh }) => {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getPendingInvites()
      setInvites(res.data)
    } catch {
      toast.error('Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [refresh])

  const handleCancel = async (id) => {
    try {
      await cancelInvite(id)
      toast.success('Invite cancelled')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invite')
    }
  }

  return (
    <div className="card shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pending Invites</h2>
      </div>

      {loading ? (
        <div className="p-5 space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No pending invites</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {invites.map((invite) => (
            <div key={invite._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{invite.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {invite.email} · <span className="capitalize font-medium">{invite.role}</span>
                  {invite.department ? ` · ${invite.department}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={11} />
                  {new Date(invite.expiresAt).toLocaleDateString()}
                </div>
                <button onClick={() => handleCancel(invite._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingInvites