import { useState } from 'react'
import { Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const AnnouncementBanner = ({ announcements }) => {
  const [dismissed, setDismissed] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())

  if (!announcements || announcements.length === 0) return null

  const visible = announcements.filter((a) => !dismissed.has(a._id))
  if (visible.length === 0) return null

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatDate = (str) => {
    try { return format(parseISO(str), 'MMM d, yyyy') } catch { return '' }
  }

  return (
    <div className="space-y-2">
      {visible.map((ann) => {
        const isExpanded = expanded.has(ann._id)
        const isLong = ann.message.length > 120
        return (
          <div
            key={ann._id}
            className="flex gap-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/50 rounded-2xl px-5 py-4"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone size={15} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-300 leading-snug">
                  {ann.title}
                </p>
                <button
                  onClick={() => setDismissed((prev) => new Set([...prev, ann._id]))}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>

              <p className="text-xs text-brand-700 dark:text-brand-400 mt-1 leading-relaxed">
                {isLong && !isExpanded
                  ? ann.message.slice(0, 120) + '…'
                  : ann.message}
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-[10px] text-brand-500 dark:text-brand-500">
                  {ann.createdBy?.name} · {formatDate(ann.createdAt)}
                </span>
                {ann.expiresAt && (
                  <span className="text-[10px] text-brand-400 dark:text-brand-600">
                    Expires {formatDate(ann.expiresAt)}
                  </span>
                )}
                {isLong && (
                  <button
                    onClick={() => toggleExpand(ann._id)}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                  >
                    {isExpanded ? <><ChevronUp size={10} /> Show less</> : <><ChevronDown size={10} /> Read more</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AnnouncementBanner