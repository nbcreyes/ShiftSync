import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, Users, BarChart2 } from 'lucide-react'
import DarkModeToggle from '../components/shared/DarkModeToggle'

const features = [
  { icon: Clock,        title: 'Time Tracking',      description: 'Clock in, take breaks, clock out. Simple and accurate.' },
  { icon: Users,        title: 'Team Management',     description: 'Invite your team, assign roles, manage departments.' },
  { icon: BarChart2,    title: 'Weekly Reports',      description: 'Visual summaries and CSV exports for your records.' },
  { icon: CheckCircle,  title: 'Dispute Resolution',  description: 'Flag logs, exchange remarks, resolve issues transparently.' },
]

const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
            <Clock size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">ShiftSync</span>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost text-sm px-4 py-2"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-sm px-4 py-2"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-200 dark:border-brand-800">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
          Built for remote teams
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-5 tracking-tight">
          Time tracking,<br />done right.
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-10">
          ShiftSync helps distributed teams log hours, manage schedules, and resolve timesheet disputes — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate('/register')} className="btn-primary px-6 py-3 text-sm">
            Create your workspace
          </button>
          <button onClick={() => navigate('/login')} className="btn-secondary px-6 py-3 text-sm">
            Sign in
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card shadow-soft p-6 hover:shadow-card transition-shadow duration-200">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-4">
                <Icon size={18} className="text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5 text-sm">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-5 text-center text-xs text-slate-400">
        ShiftSync — built for remote teams
      </footer>
    </div>
  )
}

export default Landing