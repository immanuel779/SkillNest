import { Check, Sparkles, Crown } from 'lucide-react'

function fmtPrice(price, currency) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : ''
  return `${symbol}${Number(price || 0).toLocaleString()}`
}

export default function AdPackageCard({ pkg, selected, onSelect }) {
  const highlighted = pkg.highlighted

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg)}
      className={`relative text-left w-full rounded-2xl border-2 p-5 transition group ${
        selected
          ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 shadow-lg'
          : highlighted
          ? 'border-accent-300 bg-gradient-to-br from-accent-50/60 to-white dark:from-accent-950/40 dark:to-gray-900 hover:border-accent-400'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-300'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full px-3 py-1 shadow-lg">
          <Sparkles size={10} /> Most Popular
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center">
          <Check size={14} />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {pkg.name === 'Enterprise' && (
          <Crown size={16} className="text-accent-500" />
        )}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          {pkg.name}
        </h3>
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
          {fmtPrice(pkg.price, pkg.currency)}
        </span>
        <span className="text-sm text-gray-500">
          / {pkg.durationDays} days
        </span>
      </div>

      <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-4 inline-flex items-center gap-1">
        📊 {pkg.impressions} estimated reach
      </p>

      <ul className="space-y-2">
        {(pkg.features || []).map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <Check
              size={14}
              className="text-green-600 shrink-0 mt-0.5"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div
        className={`mt-5 w-full rounded-xl py-2.5 text-center font-bold text-sm transition ${
          selected
            ? 'bg-brand-700 text-white'
            : highlighted
            ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/40'
        }`}
      >
        {selected ? 'Selected' : 'Choose plan'}
      </div>
    </button>
  )
}