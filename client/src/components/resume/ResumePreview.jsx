import { forwardRef } from 'react'

const ResumePreview = forwardRef(function ResumePreview(
  { resume, isPremium = false },
  ref
) {
  const b = resume?.basics || {}
  const accent = resume?.accentColor || '#6d28d9'
  const template = resume?.template || 'modern'
  
  const fontFamily =
    resume?.fontFamily === 'serif'
      ? 'Georgia, Cambria, "Times New Roman", Times, serif'
      : resume?.fontFamily === 'mono'
      ? '"Courier New", Courier, monospace'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

  // Smart GitHub Logic
  const isTechRole = (headline = '') => {
    const techKeywords = ['developer', 'engineer', 'software', 'frontend', 'backend', 'fullstack', 'devops', 'data', 'it ', 'programmer', 'coder', 'react', 'node', 'web']
    return techKeywords.some(kw => headline.toLowerCase().includes(kw))
  }
  const showGithub = isTechRole(b.headline) || !!b.github

  // Build contact line with new socials
  const contactLine = [
    b.email, 
    b.phone, 
    b.location, 
    b.website, 
    b.linkedin,
    showGithub ? b.github : null,
    b.instagram,
    b.tiktok,
    b.facebook
  ].filter(Boolean).join('  ·  ')

  const fmtDate = (d) => {
    if (!d) return ''
    const [y, m] = d.split('-')
    if (!y) return d
    if (!m) return y
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m, 10) - 1]} ${y}`
  }

  const dateRange = (start, end, isCurrent) => {
    const s = fmtDate(start)
    const e = isCurrent ? 'Present' : fmtDate(end)
    if (s && e) return `${s} – ${e}`
    return s || e || ''
  }

  /* ============================ SECTIONS ============================ */
  const Section = ({ title, children, variant = 'default' }) => {
    const isSidebar = variant === 'sidebar'
    return (
      <section style={{ marginBottom: isSidebar ? '18pt' : '16pt' }}>
        <h2
          style={{
            fontSize: '11pt',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: isSidebar ? '#111' : accent,
            margin: '0 0 8pt 0',
            paddingBottom: '3pt',
            borderBottom: isSidebar ? '1px solid #d1d5db' : `1.5pt solid ${accent}`,
          }}
        >
          {title}
        </h2>
        {children}
      </section>
    )
  }

  const ExperienceBlock = ({ x, isCreative }) => (
    <div style={{ marginBottom: '12pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8pt' }}>
        <div>
          <strong style={{ fontSize: '11pt', color: '#111' }}>{x.title}</strong>
          {x.company && <span style={{ color: '#4b5563', fontWeight: 500 }}> · {x.company}</span>}
          {x.location && <span style={{ color: '#6b7280', fontSize: '9.5pt' }}> · {x.location}</span>}
        </div>
        <div style={{ fontSize: '9.5pt', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {dateRange(x.startDate, x.endDate, x.isCurrent)}
        </div>
      </div>
      {x.bullets?.length > 0 && (
        <ul style={{ margin: '5pt 0 0 0', paddingLeft: '14pt', color: '#374151' }}>
          {x.bullets.map((bullet, i) => (
            <li key={i} style={{ marginBottom: '3pt' }}>
              {isCreative ? (
                <span style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '-12pt', top: '4pt', width: '4pt', height: '4pt', borderRadius: '50%', backgroundColor: accent }} />
                  {bullet}
                </span>
              ) : (
                bullet
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const EducationBlock = ({ x }) => (
    <div style={{ marginBottom: '10pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8pt' }}>
        <div>
          <strong style={{ fontSize: '10.5pt', color: '#111' }}>
            {x.degree}{x.field ? ` in ${x.field}` : ''}
          </strong>
          {x.school && <span style={{ color: '#4b5563', display: 'block', fontSize: '10pt' }}>{x.school}</span>}
        </div>
        <div style={{ fontSize: '9.5pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
          {dateRange(x.startDate, x.endDate)}
        </div>
      </div>
    </div>
  )

  const SkillsBlock = ({ textAlign = 'left' }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt', justifyContent: textAlign === 'center' ? 'center' : 'flex-start' }}>
      {resume.skills.map((s, i) => (
        <span
          key={i}
          style={{
            fontSize: '9.5pt',
            color: template === 'classic' || template === 'minimal' ? '#374151' : accent,
            backgroundColor: template === 'classic' || template === 'minimal' ? 'transparent' : `${accent}15`,
            padding: template === 'classic' || template === 'minimal' ? '0' : '2pt 6pt',
            borderRadius: '4pt',
            fontWeight: 500,
            border: template === 'classic' || template === 'minimal' ? 'none' : `1px solid ${accent}30`,
          }}
        >
          {s.name}
        </span>
      ))}
    </div>
  )

  /* ============================ TEMPLATES ============================ */
  
  // 1. EXECUTIVE (Pro)
  if (template === 'executive') {
    return (
      <div ref={ref} className="bg-white text-gray-900" style={{ width: '210mm', minHeight: '297mm', display: 'flex', boxSizing: 'border-box', fontFamily, position: 'relative' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: '32%', backgroundColor: '#f8fafc', borderRight: `3pt solid ${accent}`, padding: '20mm 10mm', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ marginBottom: '16pt' }}>
            <h2 style={{ fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase', color: '#111', margin: '0 0 8pt 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4pt' }}>Contact</h2>
            <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: 1.6, wordBreak: 'break-all' }}>
              {b.email && <div>{b.email}</div>}
              {b.phone && <div>{b.phone}</div>}
              {b.location && <div>{b.location}</div>}
              {b.website && <div>{b.website}</div>}
              {b.linkedin && <div>{b.linkedin}</div>}
              {showGithub && b.github && <div>{b.github}</div>}
              {b.instagram && <div>{b.instagram}</div>}
              {b.tiktok && <div>{b.tiktok}</div>}
              {b.facebook && <div>{b.facebook}</div>}
            </div>
          </div>

          {resume.skills?.length > 0 && (
            <Section title="Skills" variant="sidebar">
              <SkillsBlock />
            </Section>
          )}

          {resume.education?.length > 0 && (
            <Section title="Education" variant="sidebar">
              {resume.education.map((x) => <EducationBlock key={x.id} x={x} />)}
            </Section>
          )}
        </div>

        {/* Right Content */}
        <div style={{ width: '68%', padding: '20mm 14mm' }}>
          <header style={{ marginBottom: '16pt' }}>
            <h1 style={{ fontSize: '26pt', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: '#111' }}>{b.fullName || 'Your Name'}</h1>
            {b.headline && <p style={{ fontSize: '13pt', color: accent, margin: '4pt 0 0 0', fontWeight: 600 }}>{b.headline}</p>}
          </header>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(resume.sectionOrder || []).map((key) => {
              if (key === 'summary' && resume.summary) return (
                <Section key={key} title="Professional Summary"><p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>{resume.summary}</p></Section>
              )
              if (key === 'experience' && resume.experience?.length > 0) return (
                <Section key={key} title="Experience">{resume.experience.map((x) => <ExperienceBlock key={x.id} x={x} />)}</Section>
              )
              if (key === 'projects' && resume.projects?.length > 0) return (
                <Section key={key} title="Projects">
                  {resume.projects.map((p) => (
                    <div key={p.id} style={{ marginBottom: '8pt' }}>
                      <strong style={{ fontSize: '11pt' }}>{p.name}</strong>
                      {p.url && <a href={p.url} style={{ fontSize: '9.5pt', color: accent, display: 'block' }}>{p.url.replace(/^https?:\/\//, '')}</a>}
                      {p.description && <p style={{ margin: '2pt 0 0', fontSize: '10pt', color: '#374151' }}>{p.description}</p>}
                    </div>
                  ))}
                </Section>
              )
              return null
            })}
          </div>
        </div>
      </div>
    )
  }

  // 2. CREATIVE (Pro)
  if (template === 'creative') {
    return (
      <div ref={ref} className="bg-white text-gray-900" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontFamily, position: 'relative' }}>
        {/* Bold Header */}
        <div style={{ backgroundColor: accent, padding: '24mm 16mm 16mm', color: '#ffffff' }}>
          <h1 style={{ fontSize: '32pt', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>{b.fullName || 'Your Name'}</h1>
          {b.headline && <p style={{ fontSize: '14pt', margin: '6pt 0 0 0', opacity: 0.9 }}>{b.headline}</p>}
          
          <div style={{ marginTop: '16pt', display: 'flex', flexWrap: 'wrap', gap: '8pt', fontSize: '9pt', opacity: 0.9 }}>
            {b.email && <span>{b.email}</span>}
            {b.phone && <span>· {b.phone}</span>}
            {b.location && <span>· {b.location}</span>}
            {b.website && <span>· {b.website}</span>}
            {b.linkedin && <span>· {b.linkedin}</span>}
            {showGithub && b.github && <span>· {b.github}</span>}
            {b.instagram && <span>· {b.instagram}</span>}
            {b.tiktok && <span>· {b.tiktok}</span>}
            {b.facebook && <span>· {b.facebook}</span>}
          </div>
        </div>

        <div style={{ padding: '14mm 16mm' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(resume.sectionOrder || []).map((key) => {
              if (key === 'summary' && resume.summary) return (
                <Section key={key} title="Profile"><p style={{ margin: 0, color: '#374151', lineHeight: 1.7, fontSize: '11pt' }}>{resume.summary}</p></Section>
              )
              if (key === 'experience' && resume.experience?.length > 0) return (
                <Section key={key} title="Experience">{resume.experience.map((x) => <ExperienceBlock key={x.id} x={x} isCreative />)}</Section>
              )
              if (key === 'education' && resume.education?.length > 0) return (
                <Section key={key} title="Education">{resume.education.map((x) => <EducationBlock key={x.id} x={x} />)}</Section>
              )
              if (key === 'skills' && resume.skills?.length > 0) return (
                <Section key={key} title="Skills"><SkillsBlock /></Section>
              )
              if (key === 'projects' && resume.projects?.length > 0) return (
                <Section key={key} title="Projects">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt' }}>
                    {resume.projects.map((p) => (
                      <div key={p.id}>
                        <strong style={{ fontSize: '10.5pt', color: '#111' }}>{p.name}</strong>
                        {p.description && <p style={{ margin: '2pt 0 0', fontSize: '9.5pt', color: '#4b5563' }}>{p.description}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )
              return null
            })}
          </div>
        </div>
      </div>
    )
  }

  // 3, 4, 5. MODERN, CLASSIC, MINIMAL
  const isClassic = template === 'classic'
  const isMinimal = template === 'minimal'

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 relative"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: isMinimal ? '24mm' : '18mm 16mm',
        fontFamily,
        fontSize: '10.5pt',
        lineHeight: isMinimal ? 1.6 : 1.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <header className={`mb-6 ${isClassic ? 'text-center pb-4 border-b border-gray-200' : ''}`}>
        <h1 className={`font-extrabold ${isClassic ? 'uppercase tracking-widest' : ''}`} style={{ fontSize: isClassic ? '24pt' : '22pt', letterSpacing: isClassic ? '2px' : '-0.5px', margin: 0, color: '#111' }}>
          {b.fullName || 'Your Name'}
        </h1>
        
        {b.headline && (
          <p className={`font-semibold mt-1`} style={{ fontSize: '11pt', color: isClassic || isMinimal ? '#374151' : accent, margin: 0 }}>
            {b.headline}
          </p>
        )}
        
        {contactLine && (
          <p className="mt-2 text-gray-500" style={{ fontSize: '9.5pt', margin: 0, wordBreak: 'break-word' }}>
            {contactLine}
          </p>
        )}
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(resume.sectionOrder || []).map((key) => {
          if (key === 'summary' && resume.summary) return (
            <Section key={key} title="Summary">
              <p style={{ margin: 0, color: '#374151', textAlign: isClassic ? 'justify' : 'left' }}>{resume.summary}</p>
            </Section>
          )
          
          if (key === 'experience' && resume.experience?.length > 0) return (
            <Section key={key} title="Experience">
              {resume.experience.map((x) => (
                <div key={x.id} style={{ marginBottom: '12pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8pt' }}>
                    <div>
                      <strong style={{ fontSize: '11pt', color: '#111' }}>{x.title}</strong>
                      {x.company && <span style={{ color: '#4b5563', fontWeight: 500 }}> · {x.company}</span>}
                      {x.location && <span style={{ color: '#6b7280', fontSize: '9.5pt' }}> · {x.location}</span>}
                    </div>
                    <div style={{ fontSize: '9.5pt', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {dateRange(x.startDate, x.endDate, x.isCurrent)}
                    </div>
                  </div>
                  {x.bullets?.length > 0 && (
                    <ul style={{ margin: '4pt 0 0 0', paddingLeft: '14pt', color: '#374151' }}>
                      {x.bullets.map((bullet, i) => (
                        <li key={i} style={{ marginBottom: '2pt' }}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )

          if (key === 'projects' && resume.projects?.length > 0) return (
            <Section key={key} title="Projects">
              {resume.projects.map((p) => (
                <div key={p.id} style={{ marginBottom: '8pt' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8pt' }}>
                    <strong style={{ fontSize: '11pt' }}>{p.name}</strong>
                    {p.url && <a href={p.url} style={{ fontSize: '9.5pt', color: isClassic || isMinimal ? '#4b5563' : accent, textDecoration: 'none' }}>{p.url.replace(/^https?:\/\//, '')}</a>}
                  </div>
                  {p.description && <p style={{ margin: '2pt 0 0 0', color: '#374151', fontSize: '10pt' }}>{p.description}</p>}
                </div>
              ))}
            </Section>
          )

          if (key === 'education' && resume.education?.length > 0) return (
            <Section key={key} title="Education">
              {resume.education.map((x) => <EducationBlock key={x.id} x={x} />)}
            </Section>
          )

          if (key === 'skills' && resume.skills?.length > 0) return (
            <Section key={key} title="Skills">
              <SkillsBlock />
            </Section>
          )

          return null
        })}
      </div>

      {/* WATERMARK (Non-premium only) */}
      {!isPremium && (
        <div style={{ position: 'absolute', bottom: '10mm', left: 0, right: 0, textAlign: 'center', opacity: 0.15, pointerEvents: 'none' }}>
          <p style={{ fontSize: '16pt', fontWeight: 900, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
            Created with SkillNest
          </p>
          <p style={{ fontSize: '8pt', margin: '2pt 0 0' }}>Upgrade to Pro to remove this watermark</p>
        </div>
      )}
    </div>
  )
})

export default ResumePreview