import { StaticPage, Section } from '../components/StaticPage'
import { Briefcase, MapPin, Clock } from 'lucide-react'

export default function Careers() {
  const openings = [
    { title: 'Senior Frontend Engineer', location: 'Remote', type: 'Full-time' },
    { title: 'Product Designer', location: 'Lagos, Nigeria', type: 'Hybrid' },
    { title: 'Customer Success Lead', location: 'Remote', type: 'Full-time' },
  ]

  return (
    <StaticPage
      title="Careers at SkillNest"
      subtitle="Help us shape the future of hiring."
    >
      <Section title="Why join us?">
        <p>
          We're a small, focused team building tools that tens of thousands of
          people will use to change their careers. That's a rare privilege — and
          we don't take it lightly.
        </p>
        <p>
          We work remotely-first, ship fast, and care deeply about craft. If
          that sounds like you, we'd love to hear from you.
        </p>
      </Section>

      <Section title="Open positions">
        {openings.length === 0 ? (
          <p className="text-gray-500">
            No open roles right now — check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {openings.map((o) => (
              <div
                key={o.title}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 hover:border-brand-300 transition"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{o.title}</h3>
                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-4">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} /> {o.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {o.type}
                    </span>
                  </div>
                </div>
                <a
                  href="mailto:careers@opeyemioluwadamilare415@gmail.com"
                  className="btn-outline !py-2 !px-3 text-sm shrink-0"
                >
                  <Briefcase size={14} /> Apply
                </a>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Don't see a fit?">
        <p>
          Send your CV to{' '}
          <a
            href="mailto:opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            careers@opeyemioluwadamilare415@gmail.com
          </a>{' '}
          and tell us what you'd love to work on.
        </p>
      </Section>
    </StaticPage>
  )
}