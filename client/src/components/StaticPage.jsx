export function StaticPage({ title, subtitle, children, lastUpdated }) {
  return (
    <div className="container-app py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>
        )}
        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}