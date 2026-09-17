import { StaticPage, Section } from '../components/StaticPage'
import { Search, Send, MessageSquare, Calendar, UserCheck, Building2, Briefcase, Users } from 'lucide-react'

export default function HowItWorks() {
  const seekerSteps = [
    { icon: UserCheck, title: 'Create your profile', text: 'Add your headline, skills, experience, education, and upload a resume.' },
    { icon: Search, title: 'Find your role', text: 'Search and filter jobs by category, type, mode, and experience level.' },
    { icon: Send, title: 'Apply in seconds', text: 'One-click apply using your SkillNest profile and resume.' },
    { icon: MessageSquare, title: 'Chat with employers', text: 'Message hiring managers directly inside the app.' },
    { icon: Calendar, title: 'Interview & get hired', text: 'Receive interview invites, join via meeting link, and track your status.' },
  ]

  const employerSteps = [
    { icon: Building2, title: 'Build your company profile', text: 'Add your logo, industry, size, and story.' },
    { icon: Briefcase, title: 'Post a job', text: 'Publish roles with rich details and required skills in minutes.' },
    { icon: Users, title: 'Review applicants', text: 'See every candidate in a visual pipeline.' },
    { icon: MessageSquare, title: 'Shortlist & message', text: 'Reach out directly — in-app or via WhatsApp.' },
    { icon: Calendar, title: 'Schedule & hire', text: 'Book interviews, share meeting links, and mark your hire.' },
  ]

  return (
    <StaticPage
      title="How SkillNest Works"
      subtitle="Two paths. One powerful platform."
    >
      <Section title="For Job Seekers">
        <ol className="space-y-4">
          {seekerSteps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <s.icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-600">
                    STEP {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="For Employers">
        <ol className="space-y-4">
          {employerSteps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                <s.icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent-600">
                    STEP {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Ready to get started?">
        <div className="flex flex-wrap gap-3 mt-2">
          <a href="/register" className="btn-primary">
            Create free account
          </a>
          <a href="/jobs" className="btn-outline">
            Browse jobs
          </a>
        </div>
      </Section>
    </StaticPage>
  )
}