import { Link } from 'react-router-dom'
import { Briefcase, Mail, Globe, Send, Share2 } from 'lucide-react'

export default function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Find Jobs', to: '/jobs' },
        { label: 'Post a Job', to: '/register' },
        { label: 'Pricing', to: '/pricing' },
        { label: 'How It Works', to: '/how-it-works' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Careers', to: '/careers' },
        { label: 'Blog', to: '/blog' },
        { label: 'Contact', to: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', to: '/help' },
        { label: 'Privacy', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
        { label: 'Security', to: '/security' },
      ],
    },
  ]

  return (
    <footer className="relative mt-24 bg-gray-900 text-gray-300 overflow-hidden w-full">
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container-app relative py-12 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Briefcase size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Skill<span className="gradient-text-brand">Nest</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Where talent meets opportunity. Connect with top employers,
              showcase your skills, and land the role you deserve.
            </p>
            <div className="flex gap-3 mt-6">
              {[Globe, Send, Share2, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href={
                    Icon === Mail
                      ? 'mailto:hello@opeyemioluwadamilare415@gmail.com'
                      : '#'
                  }
                  aria-label={`social-${i}`}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors relative group inline-block"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-brand-400 to-accent-400 group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} SkillNest. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 text-center sm:text-right">
            Built with care for job seekers and employers everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}