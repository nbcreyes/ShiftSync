import { MessageSquareWarning, ArrowRight } from 'lucide-react'

const RemarkBanner = ({ remarks }) => {
  const open = remarks.filter((r) => r.status === 'open')
  if (open.length === 0) return null

  return (
    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <MessageSquareWarning size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {open.length} open remark{open.length > 1 ? 's' : ''} on your logs
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            Review and respond to keep your records up to date
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          {open.length}
        </span>
      </div>
    </div>
  )
}

export default RemarkBanner