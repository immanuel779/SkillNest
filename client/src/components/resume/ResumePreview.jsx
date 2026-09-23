import { forwardRef } from 'react'

/**
 * Clean printable resume.
 * Wrap with <div ref={ref}> for react-to-print.
 */
const ResumePreview = forwardRef(function ResumePreview(
  { resume },
  ref
) {
  const b = resume?.basics || {}
  const contactLine = [
    b.email,
    b.phone,
    b.location,
    b.website,
    b.linkedin,
    b.github,
  ]
    .filter(Boolean)
    .join('  ·  ')

  const accent = resume?.accentColor || '#6d28d9'

  const fmtDate = (d) => {
    if (!d) return ''
    // yyyy-mm → Mon yyyy
    const [y, m] = d.split('-')
    if (!y) return d
    if (!m) return y
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`
  }

  const dateRange = (start, end, isCurrent) => {
    const s = fmtDate(start)
    const e = isCurrent ? 'Present' : fmtDate(end)
    if (s && e) return `${s} – ${e}`
    return s || e || ''
  }

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '18mm 16mm',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontSize: '10.5pt',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <header className="mb-5">
        <h1
          className="font-extrabold"
          style={{
            fontSize: '22pt',
            letterSpacing: '-0.5px',
            margin: 0,
            color: '#111',
          }}
        >
          {b.fullName || 'Your Name'}
        </h1>
        {b.headline && (
          <p
            className="font-semibold mt-1"
            style={{ fontSize: '11pt', color: accent, margin: 0 }}
          >
            {b.headline}
          </p>
        )}
        {contactLine && (
          <p
            className="mt-2"
            style={{ fontSize: '9.5pt', color: '#4b5563', margin: 0 }}
          >
            {contactLine}
          </p>
        )}
      </header>

      {/* Summary */}
      {resume?.summary && (
        <Section title="Summary" accent={accent}>
          <p style={{ margin: 0, color: '#374151' }}>{resume.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {resume?.experience?.length > 0 && (
        <Section title="Experience" accent={accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt' }}>
            {resume.experience.map((x) => (
              <div key={x.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '11pt' }}>{x.title}</strong>
                    {x.company && (
                      <span style={{ color: '#4b5563' }}>
                        {' '}
                        · {x.company}
                      </span>
                    )}
                    {x.location && (
                      <span style={{ color: '#6b7280' }}> · {x.location}</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '9.5pt',
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dateRange(x.startDate, x.endDate, x.isCurrent)}
                  </div>
                </div>
                {x.bullets?.length > 0 && (
                  <ul
                    style={{
                      margin: '4pt 0 0 0',
                      paddingLeft: '14pt',
                      color: '#374151',
                    }}
                  >
                    {x.bullets.map((bullet, i) => (
                      <li key={i} style={{ marginBottom: '2pt' }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {resume?.projects?.length > 0 && (
        <Section title="Projects" accent={accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
            {resume.projects.map((p) => (
              <div key={p.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <strong style={{ fontSize: '11pt' }}>{p.name}</strong>
                  {p.url && (
                    <a
                      href={p.url}
                      style={{
                        fontSize: '9.5pt',
                        color: accent,
                        textDecoration: 'none',
                      }}
                    >
                      {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
                {p.description && (
                  <p
                    style={{
                      margin: '2pt 0 0 0',
                      color: '#374151',
                      fontSize: '10pt',
                    }}
                  >
                    {p.description}
                  </p>
                )}
                {p.bullets?.length > 0 && (
                  <ul
                    style={{
                      margin: '3pt 0 0 0',
                      paddingLeft: '14pt',
                      color: '#374151',
                    }}
                  >
                    {p.bullets.map((b, i) => (
                      <li key={i} style={{ marginBottom: '2pt' }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {resume?.education?.length > 0 && (
        <Section title="Education" accent={accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
            {resume.education.map((x) => (
              <div
                key={x.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '8pt',
                }}
              >
                <div>
                  <strong style={{ fontSize: '10.5pt' }}>
                    {x.degree}
                    {x.field ? ` in ${x.field}` : ''}
                  </strong>
                  {x.school && (
                    <span style={{ color: '#4b5563' }}> · {x.school}</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '9.5pt',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dateRange(x.startDate, x.endDate)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {resume?.skills?.length > 0 && (
        <Section title="Skills" accent={accent}>
          <p style={{ margin: 0, color: '#374151' }}>
            {resume.skills.map((s) => s.name).join('  ·  ')}
          </p>
        </Section>
      )}
    </div>
  )
})

function Section({ title, accent, children }) {
  return (
    <section style={{ marginBottom: '14pt' }}>
      <h2
        style={{
          fontSize: '11pt',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: accent,
          margin: '0 0 6pt 0',
          paddingBottom: '3pt',
          borderBottom: `1pt solid ${accent}40`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export default ResumePreview