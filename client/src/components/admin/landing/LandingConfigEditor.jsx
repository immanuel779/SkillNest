import { Sparkles, Plus, Trash2 } from 'lucide-react'

/* --- Helper Components --- */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card mb-6">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <Sparkles size={16} className="text-brand-600" />
        {title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

/* --- Main Component --- */
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

  return (
    <div className="space-y-6">
      {/* ─── HERO SECTION ─── */}
      <Section title="Hero Section">
        <Field label="Badge text" hint="The small pill above the main headline">
          <input
            className="input"
            value={config.heroBadge || ''}
            onChange={(e) => set('heroBadge', e.target.value)}
            placeholder="Nigeria's trusted job platform"
          />
        </Field>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Title — Line 1">
            <input
              className="input"
              value={config.heroTitle1 || ''}
              onChange={(e) => set('heroTitle1', e.target.value)}
              placeholder="Where"
            />
          </Field>
          <Field label="Title — Highlight">
            <input
              className="input"
              value={config.heroTitleAccent || ''}
              onChange={(e) => set('heroTitleAccent', e.target.value)}
              placeholder="Talent"
            />
          </Field>
          <Field label="Title — Line 2">
            <input
              className="input"
              value={config.heroTitle2 || ''}
              onChange={(e) => set('heroTitle2', e.target.value)}
              placeholder="Meets"
            />
          </Field>
          <Field label="Title — Line 3">
            <input
              className="input"
              value={config.heroTitle3 || ''}
              onChange={(e) => set('heroTitle3', e.target.value)}
              placeholder="Opportunity"
            />
          </Field>
        </div>

        <Field label="Subtitle" hint="The paragraph below the main title">
          <textarea
            rows={3}
            className="input resize-none"
            value={config.heroSubtitle || ''}
            onChange={(e) => set('heroSubtitle', e.target.value)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Primary Button Text">
            <input
              className="input"
              value={config.primaryCta || ''}
              onChange={(e) => set('primaryCta', e.target.value)}
              placeholder="Find Jobs"
            />
          </Field>
          <Field label="Secondary Button Text">
            <input
              className="input"
              value={config.secondaryCta || ''}
              onChange={(e) => set('secondaryCta', e.target.value)}
              placeholder="Post a Job"
            />
          </Field>
        </div>
      </Section>

      {/* ─── SECTION HEADINGS ─── */}
      <Section title="Page Section Headings">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Featured Jobs — Title">
            <input
              className="input"
              value={config.featuredJobsTitle || ''}
              onChange={(e) => set('featuredJobsTitle', e.target.value)}
            />
          </Field>
          <Field label="Featured Jobs — Subtitle">
            <input
              className="input"
              value={config.featuredJobsSubtitle || ''}
              onChange={(e) => set('featuredJobsSubtitle', e.target.value)}
            />
          </Field>
          <Field label="Community — Title">
            <input
              className="input"
              value={config.communityTitle || ''}
              onChange={(e) => set('communityTitle', e.target.value)}
            />
          </Field>
          <Field label="Community — Subtitle">
            <input
              className="input"
              value={config.communitySubtitle || ''}
              onChange={(e) => set('communitySubtitle', e.target.value)}
            />
          </Field>
          <Field label="Blog — Title">
            <input
              className="input"
              value={config.blogTitle || ''}
              onChange={(e) => set('blogTitle', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* ─── FOOTER SETTINGS ─── */}
      <Section title="Footer Settings">
        <Field label="About Text" hint="Appears in the first column of the footer">
          <textarea
            rows={3}
            className="input resize-none"
            value={config.footerAbout || ''}
            onChange={(e) => set('footerAbout', e.target.value)}
            placeholder="SkillNest is Nigeria's leading job portal..."
          />
        </Field>

        <Field label="Search Tags" hint="Separate with commas. These appear as clickable chips in the footer.">
          <input
            className="input"
            value={(config.footerTags || []).join(', ')}
            onChange={(e) =>
              set(
                'footerTags',
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
            placeholder="Remote Jobs, NGO Jobs, Graduate Trainee, Entry Level"
          />
        </Field>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 mt-4">
            Social Media Links
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            {['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'].map((platform) => (
              <Field key={platform} label={platform}>
                <input
                  className="input bg-white dark:bg-gray-900"
                  value={(config.footerSocials || {})[platform] || ''}
                  onChange={(e) => setSocial(platform, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`}
                />
              </Field>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── TICKER BADGES ─── */}
      <Section title="Top Ticker Badges">
        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Small trust indicators shown at the very top of the page.
        </p>
        <div className="space-y-3">
          {(config.tickerBadges || []).map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <select
                className="input !w-36 shrink-0"
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
              </select>
              <input
                className="input flex-1"
                value={b.label}
                onChange={(e) => {
                  const newBadges = [...config.tickerBadges]
                  newBadges[i].label = e.target.value
                  set('tickerBadges', newBadges)
                }}
                placeholder="Label"
              />
              <button
                type="button"
                onClick={() => {
                  const newBadges = config.tickerBadges.filter((_, j) => j !== i)
                  set('tickerBadges', newBadges)
                }}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg p-2.5 transition shrink-0"
                title="Remove badge"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            set('tickerBadges', [
              ...(config.tickerBadges || []),
              { icon: 'sparkles', label: 'New badge' },
            ])
          }
          className="btn-outline !py-2 !px-3 text-sm mt-2"
        >
          <Plus size={14} /> Add badge
        </button>
      </Section>

      {/* ─── VISIBILITY TOGGLES ─── */}
      <Section title="Visibility Toggles">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { key: 'showStatsBar', label: 'Show live stats bar' },
            { key: 'showAds', label: 'Show advertisements' },
            { key: 'showBlog', label: 'Show blog section' },
          ].map((t) => (
            <label
              key={t.key}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-800 cursor-pointer bg-white dark:bg-gray-900 transition"
            >
              <input
                type="checkbox"
                checked={config[t.key] !== false}
                onChange={(e) => set(t.key, e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </Section>
    </div>
  )
}