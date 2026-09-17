import { StaticPage, Section } from '../components/StaticPage'
import { Calendar, ArrowRight } from 'lucide-react'

export default function Blog() {
  const posts = [
    {
      title: 'How to write a cover letter that actually gets read',
      date: 'Coming soon',
      excerpt:
        'Hiring managers spend 30 seconds on your application. Here is how to make those seconds count.',
    },
    {
      title: 'Building a remote-first team: lessons from 100 hires',
      date: 'Coming soon',
      excerpt:
        'What we learned about async communication, trust, and documentation after a year of remote hiring.',
    },
    {
      title: 'The 5 skills employers are hiring for in 2026',
      date: 'Coming soon',
      excerpt:
        'A data-driven look at what the market actually wants — and how to position yourself.',
    },
  ]

  return (
    <StaticPage
      title="SkillNest Blog"
      subtitle="Insights on hiring, careers, and the future of work."
    >
      {posts.map((p) => (
        <article key={p.title} className="card card-hover">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={12} />
            {p.date}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-2">{p.title}</h2>
          <p className="text-sm text-gray-600 mt-2">{p.excerpt}</p>
          <div className="mt-4">
            <span className="text-sm text-brand-700 font-semibold inline-flex items-center gap-1">
              Read soon <ArrowRight size={14} />
            </span>
          </div>
        </article>
      ))}

      <Section title="Want to write for us?">
        <p>
          We're accepting guest posts from people with real hiring or career
          experience. Email{' '}
          <a
            href="mailto:blog@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            blog@opeyemioluwadamilare415@gmail.com
          </a>
          .
        </p>
      </Section>
    </StaticPage>
  )
}