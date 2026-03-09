const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} />
)

export const CardSkeleton = () => (
  <div className="card shadow-soft p-6 space-y-4">
    <SkeletonBlock className="h-3.5 w-1/3" />
    <SkeletonBlock className="h-8 w-1/2" />
    <SkeletonBlock className="h-3.5 w-full" />
    <SkeletonBlock className="h-3.5 w-2/3" />
  </div>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBlock key={i} className="h-12 w-full" />
    ))}
  </div>
)

export const PageSkeleton = () => (
  <div className="space-y-5 p-6">
    <SkeletonBlock className="h-7 w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <TableSkeleton />
  </div>
)

export default SkeletonBlock