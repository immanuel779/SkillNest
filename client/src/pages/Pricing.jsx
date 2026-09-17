import { StaticPage, Section } from '../components/StaticPage'
import { CheckCircle2 } from 'lucide-react'

export default function Pricing() {
  const plans = [
    {
      name: 'Job Seeker',
      price: 'Free',
      tagline: 'Always free, forever.',
      features: [
        'Unlimited applications',
        'Profile, resume & portfolio',
        'Real-time messaging',
        'Interview scheduling',
        'Saved jobs & notifications',
      ],
      cta: 'Get started',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Employer',
      price: 'Free',
      tagline: 'For teams hiring their first roles.',
      features: [
        'Company profile & logo',
        'Unlimited job posts',
        'Applicant pipeline',
        'Direct messaging + WhatsApp',
        'Interview scheduling',
      ],
      cta: 'Post your first job',
      href: '/register',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      tagline: 'For growing teams with advanced needs.',
      features: [
        'Everything in Employer',
        'Priority support',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated account manager',
      ],
      cta: 'Contact sales',
      href: '/contact',
      highlight: false,
    },
  ]

  return (
    <StaticPage
      title="Simple, transparent pricing"
      subtitle="Start free. Upgrade when you grow."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`card relative ${
              p.highlight
                ? 'border-2 border-brand-500 shadow-xl shadow-brand-500/10'
                : ''
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                Popular
              </span>
            )}
            <h3 className="font-bold text-lg">{p.name}</h3>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">
              {p.price}
            </div>
            <p className="text-sm text-gray-500 mt-1">{p.tagline}</p>

            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2
                    size={16}
                    className="text-green-600 mt-0.5 shrink-0"
                  />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={p.href}
              className={`mt-6 w-full ${
                p.highlight ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>

      <Section title="Frequently asked">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900">
              Is SkillNest really free?
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes. Job seekers and employers can use every core feature at no
              cost. Enterprise pricing is for teams that need advanced tooling.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              Do you take a cut of salaries?
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Never. SkillNest is a connection platform — what you negotiate
              with an employer is entirely between you and them.
            </p>
          </div>
        </div>
      </Section>
    </StaticPage>
  )
}