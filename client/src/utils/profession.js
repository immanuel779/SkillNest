/**
 * Heuristics to detect whether a profile is tech/dev-related.
 * Used to decide whether to show GitHub-style fields.
 */

const TECH_KEYWORDS = [
  // roles
  'developer', 'engineer', 'programmer', 'coder', 'devops',
  'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack',
  'full stack', 'software', 'mobile', 'android', 'ios',
  'web developer', 'web dev', 'data scientist', 'data engineer',
  'machine learning', 'ml engineer', 'ai engineer', 'sre',
  'qa engineer', 'test engineer', 'solutions architect', 'cloud engineer',
  'technical lead', 'tech lead', 'cto', 'architect',
  // skills
  'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
  'node', 'node.js', 'express', 'nestjs',
  'javascript', 'typescript', 'python', 'java', 'kotlin', 'swift',
  'go', 'golang', 'rust', 'ruby', 'rails', 'php', 'laravel',
  'c#', 'c++', 'csharp', 'dotnet', '.net',
  'html', 'css', 'tailwind', 'sass', 'scss',
  'git', 'github', 'gitlab', 'bitbucket',
  'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'firebase',
  'sql', 'mongodb', 'postgres', 'postgresql', 'mysql', 'redis',
  'graphql', 'rest api', 'api', 'microservices',
  'tensorflow', 'pytorch', 'pandas', 'numpy',
  'flutter', 'react native', 'dart',
  'linux', 'bash', 'shell',
  'cybersecurity', 'infosec', 'pentesting',
]

/**
 * Returns true if the profile looks like a developer/engineer.
 * Checks headline, then skills.
 */
export function isTechProfile(profile) {
  if (!profile) return false

  const parts = []

  if (typeof profile.headline === 'string') parts.push(profile.headline)
  if (typeof profile.about === 'string') parts.push(profile.about)
  if (typeof profile.category === 'string') parts.push(profile.category)

  if (Array.isArray(profile.skills)) {
    profile.skills.forEach((s) => {
      if (typeof s === 'string') parts.push(s)
      else if (s?.name) parts.push(s.name)
    })
  }

  if (Array.isArray(profile.experience)) {
    profile.experience.forEach((x) => {
      if (x?.title) parts.push(x.title)
    })
  }

  const haystack = parts.join(' ').toLowerCase()
  if (!haystack) return false

  return TECH_KEYWORDS.some((kw) => haystack.includes(kw))
}

/**
 * Should we show the GitHub field for this user?
 * - Always show if they already have a GitHub URL (so they can edit it).
 * - Otherwise, only show for tech profiles.
 */
export function shouldShowGithub(profile) {
  if (!profile) return false
  if (profile.githubUrl && profile.githubUrl.trim()) return true
  return isTechProfile(profile)
}