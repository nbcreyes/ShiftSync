import { useState } from 'react'
import { X, Send, CheckCircle2 } from 'lucide-react'
import { replyToRemark, resolveRemark } from '../../api/remark'
import useAuthStore from '../../store/authStore'
import { formatTime, formatDate } from '../../utils/formatTime'
import toast from 'react-hot-toast'

const RemarkThread = ({ remark, onClose, onUpdate }) => {
  const user = useAuthStore((s) => s.user)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  if (!remark) return null

  const handleReply = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await replyToRemark(remark._id, message)
      setMessage('')
      toast.success('Reply sent')
      if (onUpdate) onUpdate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolveRemark(remark._id)
      toast.success('Remark resolved')
      if (onUpdate) onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[85vh] flex flex-col shadow-card animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Remark Thread</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(remark.logId?.date)} · {formatTime(remark.logId?.timeIn)} — {formatTime(remark.logId?.timeOut)}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {remark.thread?.map((msg, i) => {
            const isMe = msg.authorId?._id === user?._id || msg.authorId === user?._id
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-brand-500 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                }`}>
                  {msg.message}
                </div>
                <span className="text-xs text-slate-400 mt-1 px-1">
                  {msg.authorId?.name || 'User'} · <span className="capitalize">{msg.role}</span>
                </span>
              </div>
            )
          })}
        </div>

        {remark.status !== 'resolved' ? (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder="Write a reply..."
                className="input-base flex-1"
              />
              <button onClick={handleReply} disabled={sending || !message.trim()} className="btn-primary px-3">
                <Send size={15} />
              </button>
            </div>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl py-2.5 transition-all active:scale-95"
            >
              <CheckCircle2 size={15} />
              {resolving ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          </div>
        ) : (
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
            This remark has been resolved
          </div>
        )}
      </div>
    </div>
  )
}

export default RemarkThread