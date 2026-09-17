import { StaticPage, Section } from '../components/StaticPage'

export default function Terms() {
  return (
    <StaticPage
      title="Terms of Service"
      subtitle="The rules for using SkillNest."
      lastUpdated="September 2026"
    >
      <Section title="1. Acceptance">
        <p>
          By creating an account or using SkillNest, you agree to these terms.
          If you don't agree, please don't use the platform.
        </p>
      </Section>

      <Section title="2. Your account">
        <p>
          You must provide accurate information and keep your password secure.
          You're responsible for all activity under your account. Accounts are
          personal — do not share credentials.
        </p>
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Post false, misleading, or scam job listings</li>
          <li>Harass, threaten, or discriminate against other users</li>
          <li>Post content that violates any law</li>
          <li>Attempt to break, scrape, or reverse-engineer the platform</li>
          <li>Impersonate another person or company</li>
        </ul>
        <p className="mt-2">
          Violations may result in suspension or permanent ban.
        </p>
      </Section>

      <Section title="4. Job listings">
        <p>
          Employers are solely responsible for the accuracy of job postings and
          compliance with employment law. SkillNest is a connection platform —
          we are not a party to any employment agreement.
        </p>
      </Section>

      <Section title="5. Content you post">
        <p>
          You retain ownership of content you post. By posting it, you grant
          SkillNest a license to display and distribute it within the platform
          (for example, showing your profile to employers you apply to).
        </p>
      </Section>

      <Section title="6. Termination">
        <p>
          We may suspend or terminate accounts that violate these terms. You may
          delete your account at any time.
        </p>
      </Section>

      <Section title="7. Disclaimer">
        <p>
          SkillNest is provided "as is" without warranty. We are not liable for
          damages arising from use of the platform, including interactions with
          other users.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Questions about these terms? Email{' '}
          <a
            href="mailto:legal@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            legal@opeyemioluwadamilare415@gmail.com
          </a>
          .
        </p>
      </Section>
    </StaticPage>
  )
}