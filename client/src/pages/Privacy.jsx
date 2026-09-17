import { StaticPage, Section } from '../components/StaticPage'

export default function Privacy() {
  return (
    <StaticPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      lastUpdated="September 2026"
    >
      <Section title="1. Information we collect">
        <p>
          When you create an account, we collect your name, email address, and
          the role you select (Job Seeker or Employer). If you complete your
          profile, we also store any additional information you choose to
          provide — such as a photo, headline, resume, work experience,
          education, and contact details.
        </p>
        <p>
          We also collect standard technical data: browser type, device, and IP
          address — used for security and analytics.
        </p>
      </Section>

      <Section title="2. How we use your information">
        <p>
          Your data is used to operate SkillNest: to match you with jobs or
          candidates, deliver messages, send notifications, and keep the
          platform secure. We never sell your personal data to third parties.
        </p>
      </Section>

      <Section title="3. What employers can see">
        <p>
          Employers only see your profile after you apply to one of their jobs.
          What they see is exactly what you've filled in on your profile page.
          You control that at any time from My Profile.
        </p>
      </Section>

      <Section title="4. Data storage">
        <p>
          Account data is stored securely with Google Firebase (Firestore and
          Authentication). Files you upload (photos, resumes, logos) are stored
          on Cloudinary. Both providers are industry-standard and encrypt data
          in transit.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>
          You can update or delete most of your data directly in the app. To
          request a full account deletion, email{' '}
          <a
            href="mailto:privacy@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            privacy@opeyemioluwadamilare415@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="6. Contact">
        <p>
          Questions? Reach us at{' '}
          <a
            href="mailto:privacy@opeyemioluwadamilare415@gmail.com"
            className="text-brand-700 font-semibold hover:underline"
          >
            privacy@opeyemioluwadamilare415@gmail.com
          </a>
          .
        </p>
      </Section>
    </StaticPage>
  )
}