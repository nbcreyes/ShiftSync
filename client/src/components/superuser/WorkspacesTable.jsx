import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const WorkspacesTable = ({ workspaces }) => {
  const navigate = useNavigate()

  return (
    <div className="card shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">All Workspaces</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/60">
              {['Workspace', 'Owner', 'Members', 'Created', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {workspaces.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No workspaces</td></tr>
            )}
            {workspaces.map((ws) => (
              <tr key={ws.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => navigate(`/superuser/workspaces/${ws.id}`)}>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{ws.companyName}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{ws.owner?.name || '—'}</p>
                  <p className="text-xs text-slate-400">{ws.owner?.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">{ws.memberCount}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(ws.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right">
                  <ArrowUpRight size={15} className="text-slate-400 hover:text-brand-500 transition-colors inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorkspacesTable