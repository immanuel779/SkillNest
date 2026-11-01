import { Link } from 'react-router-dom'
import { MapPin, Briefcase } from 'lucide-react'
const LOCATIONS = [
  { label: 'Lagos', q: 'Lagos' },
  { label: 'Abuja', q: 'Abuja' },
  { label: 'Port Harcourt', q: 'Port Harcourt' },
  { label: 'Remote', q: 'Remote' },
  { label: 'Ibadan', q: 'Ibadan' },
  { label: 'Kano', q: 'Kano' },
]

const CATEGORIES = [
  { label: 'Engineering', q: 'Engineering' },
  { label: 'Design', q: 'Design' },
  { label: 'Marketing', q: 'Marketing' },
  { label: 'Sales', q: 'Sales' },
  { label: 'Finance', q: 'Finance' },
  { label: 'Customer Support', q: 'Customer Support' },
  { label: 'Human Resources', q: 'Human Resources' },
  { label: 'Data & Analytics', q: 'Data & Analytics' },
]

export default function BrowseByLocation() {
  return (
    <section className="container-app py-16 md:py-20">
      <div className="card !p-6 md:!p-8">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={16} className="text-brand-600" />
          <h3 className="font-bold text-gray-900">Browse jobs by location</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <Link
              key={l.label}
              to={`/jobs?location=${encodeURIComponent(l.q)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-sm font-medium text-gray-700 border border-gray-100 hover:border-brand-200 transition"
            >
              <MapPin size={12} />
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-7 mb-5">
          <Briefcase size={16} className="text-accent-600" />
          <h3 className="font-bold text-gray-900">Browse by category</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              to={`/jobs?category=${encodeURIComponent(c.q)}`}
              className="inline-flex items-center px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-accent-50 hover:text-accent-700 text-sm font-medium text-gray-700 border border-gray-100 hover:border-accent-200 transition"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}