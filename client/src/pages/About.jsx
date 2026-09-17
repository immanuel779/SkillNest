import { StaticPage, Section } from '../components/StaticPage'
import { Target, Users, Zap, ShieldCheck } from 'lucide-react'

export default function About() {
  return (
    <StaticPage
      title="About SkillNest"
      subtitle="Where talent meets opportunity."
    >
      <Section title="Our mission">
        <p>
          SkillNest exists to make hiring and getting hired radically simpler.
          We connect ambitious job seekers with world-class employers in one
          clean, focused workspace — no noise, no spam, no endless back-and-forth.
        </p>
        <p>
          We believe the recruitment process should feel human. Every feature we
          build, from the applicant pipeline to real-time messaging, is designed
          around that idea.
        </p>
      </Section>

      <Section title="What makes us different">
        <div className="grid sm:grid-cols-2 gap-5 mt-2">
          {[
            {
              icon: Target,
              title: 'Focused on what matters',
              text: 'No feature bloat. Every button serves a real purpose in the hiring flow.',
            },
            {
              icon: Zap,
              title: 'Fast and modern',
              text: 'Real-time messaging, instant notifications, and a UI that stays out of your way.',
            },
            {
              icon: Users,
              title: 'Built for everyone',
              text: 'Job seekers, employers, and admins each get tools made for their exact needs.',
            },
            {
              icon: ShieldCheck,
              title: 'Trust first',
              text: 'Verified reporting, admin moderation, and secure authentication as standard.',
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <f.icon size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Our story">
        <p>
          SkillNest started as an MVP built to prove one idea: the core
          recruitment loop — discover, apply, review, shortlist, interview,
          hire — can work beautifully in a single platform without the
          friction of legacy tools.
        </p>
        <p>
          Today it powers job seekers finding their next role and employers
          building teams — with a full admin console keeping the platform safe.
        </p>
      </Section>
    </StaticPage>
  )
}