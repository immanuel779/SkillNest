import { StaticPage, Section } from '../components/StaticPage'
import {
  Lock,
  ShieldCheck,
  Eye,
  KeyRound,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react'

export default function Security() {
  const features = [
    {
      icon: KeyRound,
      title: 'Protected accounts',
      text: 'Your password is stored using industry-standard encryption. We never see or keep it in plain text.',
    },
    {
      icon: Lock,
      title: 'Encrypted connections',
      text: 'Every request to and from SkillNest is encrypted in transit. Your data is never sent over an unsecured connection.',
    },
    {
      icon: Fingerprint,
      title: 'Role-based access',
      text: 'Only the people who should see your information can see it. Employers see your profile only after you apply to their jobs.',
    },
    {
      icon: Eye,
      title: 'Active moderation',
      text: 'Our team reviews every report and takes action on suspicious listings, users, or behavior.',
    },
    {
      icon: ShieldCheck,
      title: 'Trusted infrastructure',
      text: 'SkillNest runs on enterprise-grade cloud platforms used by millions of applications worldwide.',
    },
    {
      icon: AlertTriangle,
      title: 'Built-in reporting',
      text: 'See something wrong? Report any job or user in one tap. Reports go straight to our moderation team.',
    },
  ]

  return (
    <StaticPage
      title="Security at SkillNest"
      subtitle="How we protect your account, your data, and your privacy."
    >
      <div className="grid sm:grid-cols-2 gap-5">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <f.icon size={18} />
            </div>
            <h3 className="font-bold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{f.text}</p>
          </div>
        ))}
      </div>

      <Section title="What we never do">
        <ul className="list-disc pl-5 space-y-1">
          <li>We never sell your personal data to third parties</li>
          <li>We never share your contact details without your action</li>
          <li>We never store passwords in plain text</li>
          <li>We never let employers see your profile before you apply</li>
        </ul>
      </Section>

      <Section title="Your account security">
        <p>Best practices we recommend:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Use a strong, unique password for SkillNest</li>
          <li>Never share your login credentials with anyone</li>
          <li>Log out on shared devices</li>
          <li>Report suspicious messages immediately</li>
        </ul>
      </Section>

      <Section title="Reporting a vulnerability">
        <p>
          If you believe you've found a security issue, please disclose it
          responsibly by emailing{' '}
          <a
            href="mailto:security@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            security@opeyemioluwadamilare415@gmail.com
          </a>
          . We'll acknowledge within 48 hours and keep you updated on our
          progress. Please don't publicly disclose the issue before we've had a
          chance to respond.
        </p>
      </Section>
    </StaticPage>
  )
}