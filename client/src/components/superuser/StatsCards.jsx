import { Building2, Users, Clock, Shield, UserCheck, Briefcase } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card shadow-soft p-5 hover:shadow-card transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{value ?? '--'}</p>
  </div>
)

const StatsCards = ({ stats }) => {
  const cards = [
    { icon: Building2, label: 'Workspaces', value: stats?.totalWorkspaces, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/30' },
    { icon: Users, label: 'Total Users', value: stats?.totalUsers, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
    { icon: Clock, label: 'Active Now', value: stats?.activeSessions, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { icon: Shield, label: 'Owners', value: stats?.totalOwners, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { icon: UserCheck, label: 'Admins', value: stats?.totalAdmins, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
    { icon: Briefcase, label: 'Employees', value: stats?.totalEmployees, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  )
}

export default StatsCards