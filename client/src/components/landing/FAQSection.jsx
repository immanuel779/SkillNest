import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I find jobs on SkillNest?',
    a: 'Browse jobs without an account. To apply, create a free profile, upload your CV, and click Apply on any role. Our AI job matching also surfaces roles that fit your profile.',
  },
  {
    q: 'Is SkillNest free to use?',
    a: 'Yes. Job seekers never pay — free to search, apply, and message employers. Employers can post jobs free as well.',
  },
  {
    q: 'Can I build my CV inside SkillNest?',
    a: 'Yes. Our built-in Resume Builder creates a professional, ATS-friendly CV in minutes. You can also get AI feedback on your existing resume.',
  },
  {
    q: 'Are there remote jobs available?',
    a: 'Absolutely. Filter jobs by work mode — On-site, Remote, or Hybrid. Many Nigerian and international companies post remote roles on SkillNest.',
  },
  {
    q: 'How do I know a job is real?',
    a: 'Every employer is reviewed before verification. Verified companies show a blue checkmark. If you suspect a scam, use the Report button on any job.',
  },
  {
    q: 'How do I post a job as an employer?',
    a: 'Create your company profile, then post a job in a few minutes. Our AI job description writer drafts the content for you.',
  },
  {
    q: 'Does SkillNest have graduate and entry-level roles?',
    a: 'Yes. Filter by experience level — Entry, Mid, Senior, Lead, or Executive — to find the right fit.',
  },
  {
    q: 'How do I get notified about new jobs?',
    a: 'Save a search and we will email you the moment a matching role is posted. You can also follow companies to hear when they post updates.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState(0)

  return (
    <section className="container-app py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="badge bg-brand-50 text-brand-700 border border-brand-100">
          Got Questions?
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
          Frequently asked <span className="gradient-text">questions</span>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto card !p-2 md:!p-3 divide-y divide-gray-100">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full text-left flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50/60 rounded-lg transition"
              >
                <span className="font-semibold text-gray-900 text-sm md:text-base">
                  {f.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}