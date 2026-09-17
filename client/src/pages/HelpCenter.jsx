import { useState } from 'react'
import { StaticPage, Section } from '../components/StaticPage'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    category: 'Account',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'Go to the Sign In page → click "Forgot password?" → enter your email. We\'ll send a reset link within a minute.',
      },
      {
        q: 'Can I change my email address?',
        a: 'Currently no. Contact support@opeyemioluwadamilare415@gmail.com and we\'ll help.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Email support@opeyemioluwadamilare415@gmail.com from your registered address. We process deletions within 7 days.',
      },
    ],
  },
  {
    category: 'Job Seekers',
    items: [
      {
        q: 'Is SkillNest free for job seekers?',
        a: 'Yes — forever. Apply to unlimited jobs, message employers, and schedule interviews at no cost.',
      },
      {
        q: 'Why is my profile not showing up to employers?',
        a: 'Employers only see your profile after you apply to one of their jobs. Make sure your profile is complete first.',
      },
      {
        q: 'Can I withdraw an application?',
        a: 'Not currently. If you\'ve been hired elsewhere, message the employer directly to let them know.',
      },
    ],
  },
  {
    category: 'Employers',
    items: [
      {
        q: 'Do I need a company profile to post jobs?',
        a: 'Yes. Go to Company in your dashboard first, fill it in, then you can post jobs.',
      },
      {
        q: 'How do I contact a candidate?',
        a: 'Open the applicant\'s card and click Message (in-app) or WhatsApp (opens WhatsApp Web with a pre-filled message).',
      },
      {
        q: 'Can I have multiple companies?',
        a: 'One company per account for now. Create a second employer account if you need more.',
      },
    ],
  },
]

export default function HelpCenter() {
  const [openId, setOpenId] = useState(null)

  return (
    <StaticPage
      title="Help Center"
      subtitle="Answers to the most common questions."
    >
      {FAQS.map((group) => (
        <Section key={group.category} title={group.category}>
          <div className="divide-y divide-gray-100 -mx-5">
            {group.items.map((item, i) => {
              const id = `${group.category}-${i}`
              const open = openId === id
              return (
                <div key={id}>
                  <button
                    onClick={() => setOpenId(open ? null : id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      ))}

      <Section title="Still stuck?">
        <p>
          Email{' '}
          <a
            href="mailto:support@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            support@opeyemioluwadamilare415@gmail.com
          </a>{' '}
          and we'll get back to you within one business day.
        </p>
      </Section>
    </StaticPage>
  )
}