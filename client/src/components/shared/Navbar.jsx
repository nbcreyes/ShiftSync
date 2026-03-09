import useAuthStore from '../../store/authStore'
import DarkModeToggle from './DarkModeToggle'
import NotificationBell from './NotificationBell'

const Navbar = ({ title }) => {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-10">
      <h1 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <DarkModeToggle />
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden md:block">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Navbar