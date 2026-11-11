import { useState } from 'react'
import { 
  Sparkles, Plus, Trash2, ChevronDown, ChevronUp, 
  Image as ImageIcon, Link as LinkIcon, Layout, 
  Eye, MonitorPlay, Type, Palette, Settings2
} from 'lucide-react'

/* ─── HELPER COMPONENTS ─── */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{hint}</p>}
    </div>
  )
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2.5 uppercase tracking-wide">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-[#7c3aed]" />
          </div>
          {title}
        </h3>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-gray-100 space-y-6 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── MAIN COMPONENT ─── */
export default function LandingConfigEditor({ config, setConfig }) {
  
  // Helper to update simple top-level keys
  const set = (key, value) => setConfig((c) => ({ ...c, [key]: value }))

  // Helper to update nested footer social links
  const setSocial = (platform, url) => {
    setConfig((c) => ({
      ...c,
      footerSocials: {
        ...(c.footerSocials || {}),
        [platform]: url,
      },
    }))
  }

  // Helper for toggles
  const toggleVisibility = (key) => {
    setConfig((c) => ({ ...c, [key]: c[key] === false ? true : false }))
  }

  const SOCIAL_PLATFORMS = [
    'facebook', 'twitter', 'linkedin', 'instagram', 
    'youtube', 'tiktok', 'whatsapp', 'telegram', 'threads', 'github'
  ]

  const VISIBILITY_TOGGLES = [
    { key: 'showTopTicker', label: 'Top Ticker Bar', desc: 'The moving text at the very top' },
    { key: 'showHero', label: 'Hero Section', desc: 'The main welcome area with search' },
    { key: 'showStatsBar', label: 'Live Stats Bar', desc: 'Shows total jobs, companies, etc.' },
    { key: 'showCategories', label: 'Categories', desc: 'Browse jobs by category grid' },
    { key: 'showFeaturedJobs', label: 'Featured Jobs', desc: 'Highlighted premium job listings' },
    { key: 'showTestimonials', label: 'Testimonials', desc: 'User reviews and success stories' },
    { key: 'showCommunity', label: 'Community Widget', desc: 'Live chat and forum preview' },
    { key: 'showAds', label: 'Advertisement Banners', desc: 'Paid ads and sponsor banners' },
    { key: 'showBlog', label: 'Career Blog', desc: 'Latest articles and advice' },
    { key: 'showNewsletter', label: 'Newsletter Signup', desc: 'Email capture form' },
    { key: 'showFAQs', label: 'FAQ Section', desc: 'Frequently asked questions' },
  ]

  return (
    <div className="space-y-6 pb-20">
      
      {/* ─── HERO SECTION ─── */}
      <CollapsibleSection title="Hero & Main Banner" icon={MonitorPlay} defaultOpen={true}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Badge Text" hint="Small pill above the headline">
            <input className="input" value={config.heroBadge || ''} onChange={(e) => set('heroBadge', e.target.value)} placeholder="Nigeria's trusted job platform" />
          </Field>
          <Field label="Hero Background Image URL" hint="Leave empty to use default solid gradient">
            <div className="relative">
              <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={config.heroBgImage || ''} onChange={(e) => set('heroBgImage', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Field label="Title — Line 1">
            <input className="input bg-white" value={config.heroTitle1 || ''} onChange={(e) => set('heroTitle1', e.target.value)} placeholder="Where" />
          </Field>
          <Field label="Title — Highlight">
            <input className="input bg-white !text-[#7c3aed] !font-bold" value={config.heroTitleAccent || ''} onChange={(e) => set('heroTitleAccent', e.target.value)} placeholder="Talent" />
          </Field>
          <Field label="Title — Line 2">
            <input className="input bg-white" value={config.heroTitle2 || ''} onChange={(e) => set('heroTitle2', e.target.value)} placeholder="Meets" />
          </Field>
          <Field label="Title — Line 3">
            <input className="input bg-white" value={config.heroTitle3 || ''} onChange={(e) => set('heroTitle3', e.target.value)} placeholder="Opportunity" />
          </Field>
        </div>

        <Field label="Hero Subtitle" hint="The paragraph below the main title">
          <textarea rows={3} className="input resize-none" value={config.heroSubtitle || ''} onChange={(e) => set('heroSubtitle', e.target.value)} placeholder="Find your dream job in Nigeria..." />
        </Field>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
          <div className="space-y-4">
            <Field label="Primary Button Text">
              <input className="input" value={config.primaryCta || ''} onChange={(e) => set('primaryCta', e.target.value)} placeholder="Find Jobs" />
            </Field>
            <Field label="Primary Button Link">
              <input className="input" value={config.primaryCtaLink || ''} onChange={(e) => set('primaryCtaLink', e.target.value)} placeholder="/jobs" />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Secondary Button Text">
              <input className="input" value={config.secondaryCta || ''} onChange={(e) => set('secondaryCta', e.target.value)} placeholder="Post a Job" />
            </Field>
            <Field label="Secondary Button Link">
              <input className="input" value={config.secondaryCtaLink || ''} onChange={(e) => set('secondaryCtaLink', e.target.value)} placeholder="/register" />
            </Field>
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── PAGE SECTION HEADINGS ─── */}
      <CollapsibleSection title="Page Section Headings" icon={Type}>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Featured Jobs */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Featured Jobs Section</h4>
            <Field label="Title">
              <input className="input bg-white" value={config.featuredJobsTitle || ''} onChange={(e) => set('featuredJobsTitle', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <input className="input bg-white" value={config.featuredJobsSubtitle || ''} onChange={(e) => set('featuredJobsSubtitle', e.target.value)} />
            </Field>
          </div>

          {/* Community */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Community Section</h4>
            <Field label="Title">
              <input className="input bg-white" value={config.communityTitle || ''} onChange={(e) => set('communityTitle', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <input className="input bg-white" value={config.communitySubtitle || ''} onChange={(e) => set('communitySubtitle', e.target.value)} />
            </Field>
          </div>

          {/* Blog */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Blog Section</h4>
            <Field label="Title">
              <input className="input bg-white" value={config.blogTitle || ''} onChange={(e) => set('blogTitle', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <input className="input bg-white" value={config.blogSubtitle || ''} onChange={(e) => set('blogSubtitle', e.target.value)} />
            </Field>
          </div>

          {/* Testimonials */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Testimonials Section</h4>
            <Field label="Title">
              <input className="input bg-white" value={config.testimonialsTitle || ''} onChange={(e) => set('testimonialsTitle', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <input className="input bg-white" value={config.testimonialsSubtitle || ''} onChange={(e) => set('testimonialsSubtitle', e.target.value)} />
            </Field>
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── FOOTER SETTINGS ─── */}
      <CollapsibleSection title="Global Footer Settings" icon={Layout}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Footer Logo URL" hint="Square logo for the footer">
            <input className="input" value={config.footerLogo || ''} onChange={(e) => set('footerLogo', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Copyright Text">
            <input className="input" value={config.footerCopyright || ''} onChange={(e) => set('footerCopyright', e.target.value)} placeholder="© {year} SkillNest. All rights reserved." />
          </Field>
        </div>

        <Field label="About Text" hint="Appears in the first column of the footer">
          <textarea rows={3} className="input resize-none" value={config.footerAbout || ''} onChange={(e) => set('footerAbout', e.target.value)} placeholder="SkillNest is Nigeria's leading job portal..." />
        </Field>

        <Field label="Search Tags" hint="Separate with commas. These appear as clickable chips in the footer.">
          <input className="input" value={(config.footerTags || []).join(', ')} onChange={(e) => set('footerTags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} placeholder="Remote Jobs, NGO Jobs, Graduate Trainee" />
        </Field>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <LinkIcon size={14} className="text-[#7c3aed]"/> Social Media Links
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
            {SOCIAL_PLATFORMS.map((platform) => (
              <Field key={platform} label={platform}>
                <input
                  className="input bg-white text-xs"
                  value={(config.footerSocials || {})[platform] || ''}
                  onChange={(e) => setSocial(platform, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                />
              </Field>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── TICKER BADGES ─── */}
      <CollapsibleSection title="Top Ticker Badges" icon={Sparkles}>
        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Small trust indicators shown at the very top of the page. You can add up to 5.
        </p>
        
        <div className="space-y-3">
          {(config.tickerBadges || []).map((b, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <select
                className="input !w-full sm:!w-40 shrink-0 bg-white"
                value={b.icon}
                onChange={(e) => {
                  const newBadges = [...config.tickerBadges]
                  newBadges[i].icon = e.target.value
                  set('tickerBadges', newBadges)
                }}
              >
                <option value="sparkles">✨ Sparkles</option>
                <option value="shield">🛡️ Shield</option>
                <option value="star">⭐ Star</option>
                <option value="zap">⚡ Zap</option>
                <option value="check">✅ Check</option>
                <option value="users">👥 Users</option>
              </select>
              <input
                className="input flex-1 bg-white"
                value={b.label}
                onChange={(e) => {
                  const newBadges = [...config.tickerBadges]
                  newBadges[i].label = e.target.value
                  set('tickerBadges', newBadges)
                }}
                placeholder="e.g., Verified Jobs - All 36 States"
              />
              <button
                type="button"
                onClick={() => {
                  const newBadges = config.tickerBadges.filter((_, j) => j !== i)
                  set('tickerBadges', newBadges)
                }}
                className="text-red-600 hover:bg-red-100 rounded-lg p-2.5 transition shrink-0 flex items-center justify-center bg-white border border-red-200"
                title="Remove badge"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => set('tickerBadges', [...(config.tickerBadges || []), { icon: 'sparkles', label: 'New badge' }])}
          className="btn-outline !py-2.5 !px-4 text-sm mt-2 border-dashed"
        >
          <Plus size={16} /> Add Badge
        </button>

        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
          <Field label="Ticker Background Color">
            <div className="flex gap-2">
              <input type="color" className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-1 bg-white" value={config.tickerBgColor || '#1a1c23'} onChange={(e) => set('tickerBgColor', e.target.value)} />
              <input className="input flex-1 font-mono text-xs" value={config.tickerBgColor || '#1a1c23'} onChange={(e) => set('tickerBgColor', e.target.value)} />
            </div>
          </Field>
          <Field label="Ticker Text Color">
            <div className="flex gap-2">
              <input type="color" className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-1 bg-white" value={config.tickerTextColor || '#ffffff'} onChange={(e) => set('tickerTextColor', e.target.value)} />
              <input className="input flex-1 font-mono text-xs" value={config.tickerTextColor || '#ffffff'} onChange={(e) => set('tickerTextColor', e.target.value)} />
            </div>
          </Field>
        </div>
      </CollapsibleSection>

      {/* ─── VISIBILITY TOGGLES ─── */}
      <CollapsibleSection title="Page Visibility & Sections" icon={Eye}>
        <p className="text-xs text-gray-500 -mt-2 mb-4">
          Turn specific sections of the landing page on or off instantly without deleting the content.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VISIBILITY_TOGGLES.map((t) => (
            <div
              key={t.key}
              onClick={() => toggleVisibility(t.key)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                config[t.key] !== false 
                  ? 'border-[#7c3aed] bg-purple-50/30' 
                  : 'border-gray-200 bg-gray-50 opacity-60 grayscale hover:grayscale-0'
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={config[t.key] !== false}
                  readOnly
                  className="w-5 h-5 accent-[#7c3aed] cursor-pointer"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{t.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

    </div>
  )
}