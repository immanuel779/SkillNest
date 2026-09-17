export function SkeletonLine({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  )
}

export function SkeletonCircle({ size = 40 }) {
  return (
    <div
      className="animate-pulse rounded-full bg-gray-200 shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <SkeletonCircle size={48} />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-5/6" />
      </div>
    </div>
  )
}

export function SkeletonJobCard() {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <SkeletonLine className="h-5 w-2/3" />
          <SkeletonLine className="h-3 w-1/3" />
          <div className="flex gap-2 mt-3">
            <SkeletonLine className="h-5 w-16" />
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-5 w-14" />
          </div>
        </div>
        <SkeletonCircle size={36} />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="card">
      <SkeletonCircle size={40} />
      <SkeletonLine className="h-3 w-20 mt-3" />
      <SkeletonLine className="h-8 w-16 mt-2" />
    </div>
  )
}

export function SkeletonList({ count = 3, variant = 'card' }) {
  const items = Array.from({ length: count })
  return (
    <div className="grid gap-4">
      {items.map((_, i) =>
        variant === 'job' ? (
          <SkeletonJobCard key={i} />
        ) : (
          <SkeletonCard key={i} />
        )
      )}
    </div>
  )
}