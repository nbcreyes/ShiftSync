import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import StatusBadge from '../shared/StatusBadge'
import { formatTime, formatDate } from '../../utils/formatTime'

const LogsTable = ({ logs, total, page, pages, onPageChange, onRemarkClick }) => {
  return (
    <div className="card shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Log History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/60">
              {['Date', 'In', 'Out', 'Break', 'Worked', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  No logs found
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const workedMins = log.timeOut
                ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
                : null
              return (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{formatDate(log.date)}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatTime(log.timeIn)}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{formatTime(log.timeOut)}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{Math.round(log.totalBreakMins)}m</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold font-mono text-xs ${log.overtime ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {workedMins !== null ? `${(workedMins / 60).toFixed(2)}h` : '--'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                  <td className="px-5 py-3.5">
                    {(log.status === 'remarked' || log.status === 'resolved') && (
                      <button onClick={() => onRemarkClick(log)} className="text-slate-400 hover:text-brand-500 transition-colors">
                        <MessageSquare size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">{total} total · Page {page} of {pages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogsTable