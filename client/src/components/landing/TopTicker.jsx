import { ShieldCheck, Star, Zap } from 'lucide-react'

export default function TopTicker({ stats }) {
  return (
    <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-accent-500 text-white text-xs">
      <div className="container-app py-2 flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-[11px] sm:text-xs font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Zap size={11} className="text-accent-200" />
          <span className="font-bold">100% Free</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-green-300" />
          <span className="font-bold">
            {stats?.verifiedCompanies || 0}+ Verified
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Star size={11} className="text-yellow-300 fill-current" />
          <span className="font-bold">4.8★</span>
          <span className="opacity-80 hidden sm:inline">trusted by Nigerians</span>
        </span>
      </div>
    </div>
  )
}