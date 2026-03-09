import { NavLink, useNavigate } from 'react-router-dom'
import {
  Clock,
  LayoutDashboard,
  History,
  Users,
  CalendarDays,
  UserPlus,
  LogOut,
  ShieldCheck,
  BarChart3,
  UserCircle,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { logout } from '../../api/auth'
import toast from 'react-hot-toast'

const Sidebar = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch { /* proceed */ } finally {
      clearAuth()
      navigate('/login')
      toast.success('Logged out')
    }
  }

  const employeeLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/history', label: 'History', icon: History },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/timesheets', label: 'Timesheets', icon: CalendarDays },
    { to: '/admin/invites', label: 'Invites', icon: UserPlus },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ]

  const ownerLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/timesheets', label: 'Timesheets', icon: CalendarDays },
    { to: '/admin/invites', label: 'Invites', icon: UserPlus },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/members', label: 'Members', icon: Users },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ]

  const superuserLinks = [
    { to: '/superuser', label: 'Platform', icon: ShieldCheck },
  ]

  const links =
    user?.role === 'superuser' ? superuserLinks
    : user?.role === 'owner' ? ownerLinks
    : user?.role === 'admin' ? adminLinks
    : employeeLinks

  const navLink = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-500 text-white shadow-glow'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
    }`

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
          <Clock size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          ShiftSync
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLink} end>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.name}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar