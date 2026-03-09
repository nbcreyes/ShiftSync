const StatusBadge = ({ status }) => {
  const config = {
    working:      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Working' },
    'on-break':   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   label: 'On Break' },
    'clocked-out':{ bg: 'bg-slate-100 dark:bg-slate-700/50',   text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400',   label: 'Clocked Out' },
    clean:        { bg: 'bg-slate-100 dark:bg-slate-700/50',   text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400',   label: 'Clean' },
    remarked:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500',  label: 'Remarked' },
    resolved:     { bg: 'bg-brand-100 dark:bg-brand-900/30',   text: 'text-brand-700 dark:text-brand-400',   dot: 'bg-brand-500',   label: 'Resolved' },
    open:         { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500',  label: 'Open' },
  }

  const c = config[status] || config.clean

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse-dot`} />
      {c.label}
    </span>
  )
}

export default StatusBadge