/**
 * Compute a job seeker's profile completeness (0–100).
 * Returns a `score` plus per-item details for suggestions.
 */

const CHECK = (id, label, weight, hint, href) => ({
  id,
  label,
  weight,
  hint,
  href,
})

const CHECKS = [
  CHECK(
    'photo',
    'Profile photo',
    10,
    'Add a photo — profiles with a photo get 3× more views.',
    '/profile/job-seeker'
  ),
  CHECK(
    'fullName',
    'Full name',
    5,
    'Add your full name.',
    '/profile/job-seeker'
  ),
  CHECK(
    'headline',
    'Professional headline',
    10,
    'A short headline like "Senior Frontend Engineer" makes a strong first impression.',
    '/profile/job-seeker'
  ),
  CHECK(
    'about',
    'About section',
    10,
    'Write at least a couple of sentences about yourself.',
    '/profile/job-seeker'
  ),
  CHECK(
    'location',
    'Location',
    5,
    'Add your city and country so employers can find you.',
    '/profile/job-seeker'
  ),
  CHECK(
    'phone',
    'Phone / WhatsApp',
    5,
    'Add a phone number so employers can reach you directly.',
    '/profile/job-seeker'
  ),
  CHECK(
    'skills',
    'At least 3 skills',
    15,
    'Skills are how employers find and match you.',
    '/profile/job-seeker'
  ),
  CHECK(
    'experience',
    'At least 1 work experience',
    15,
    'Add your most recent role to show real-world experience.',
    '/profile/job-seeker'
  ),
  CHECK(
    'education',
    'At least 1 education entry',
    10,
    'Add a degree, diploma, or certification.',
    '/profile/job-seeker'
  ),
  CHECK(
    'resume',
    'Resume uploaded',
    15,
    'You need a resume to apply to jobs.',
    '/profile/job-seeker'
  ),
  CHECK(
    'links',
    'A portfolio, LinkedIn, or GitHub link',
    5,
    'Links give employers a way to see your work.',
    '/profile/job-seeker'
  ),
]

function isSatisfied(id, profile) {
  if (!profile) return false
  switch (id) {
    case 'photo':
      return !!profile.photoURL
    case 'fullName':
      return !!profile.fullName && profile.fullName.trim().length >= 2
    case 'headline':
      return !!profile.headline && profile.headline.trim().length >= 10
    case 'about':
      return !!profile.about && profile.about.trim().length >= 50
    case 'location':
      return !!profile.location && profile.location.trim().length >= 2
    case 'phone':
      return !!profile.phone && profile.phone.replace(/\D/g, '').length >= 6
    case 'skills':
      return Array.isArray(profile.skills) && profile.skills.length >= 3
    case 'experience':
      return (
        Array.isArray(profile.experience) && profile.experience.length >= 1
      )
    case 'education':
      return Array.isArray(profile.education) && profile.education.length >= 1
    case 'resume':
      return !!profile.resumeUrl
    case 'links':
      return !!(
        profile.portfolioUrl ||
        profile.linkedinUrl ||
        profile.githubUrl
      )
    default:
      return false
  }
}

export function computeProfileCompleteness(profile) {
  const items = CHECKS.map((c) => ({
    ...c,
    done: isSatisfied(c.id, profile),
  }))

  const score = items.reduce((sum, it) => (it.done ? sum + it.weight : sum), 0)
  const missing = items
    .filter((it) => !it.done)
    .sort((a, b) => b.weight - a.weight)

  return {
    score,
    items,
    missing,
    total: 100,
  }
}

export function scoreLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'green' }
  if (score >= 70) return { label: 'Good', color: 'brand' }
  if (score >= 40) return { label: 'Getting there', color: 'yellow' }
  return { label: 'Just starting', color: 'red' }
}