# SkillNest

**Where Talent Meets Opportunity.**

A modern, full-stack job marketplace that connects job seekers and employers in one seamless workspace. Built as a production-ready MVP with real authentication, real-time data, and file uploads.

---

## Live Demo

🚀 **Live site:** <ADD-YOUR-VERCEL-URL-HERE>

Test accounts (feel free to try):
- Job Seeker: `<add-email>` / `<add-password>`
- Employer: `<add-email>` / `<add-password>`
- Admin: `<add-email>` / `<add-password>`

---

## What it does

### For Job Seekers
- Create a rich profile with photo, headline, bio, skills, experience, education, and resume
- Browse and filter jobs by keyword, location, category, job type, work mode, and experience level
- Save jobs, apply with a cover letter, and track every application from **Applied → Interview → Hired**
- Chat directly with employers
- Receive notifications and interview invitations
- Report suspicious job listings

### For Employers
- Build a company profile with logo, industry, size, and description
- Post, edit, publish, unpublish, and close job listings
- Manage applicants through a visual pipeline
- Shortlist, message, schedule interviews, and mark candidates as hired
- Contact candidates directly via WhatsApp
- See live stats on the employer dashboard

### For Admins
- Real-time platform statistics (users, employers, jobs, applications, hires)
- Manage users (suspend / reactivate)
- Moderate jobs (unpublish or delete inappropriate listings)
- Monitor all applications
- Review and resolve user reports
- Receive notifications for every major event across the platform

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Icons | Lucide React |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| File uploads | Cloudinary (unsigned uploads) |
| Hosting | Vercel |
| Repo | GitHub |

No custom backend — the entire app runs frontend-only against Firebase and Cloudinary, secured by Firestore Security Rules.

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/skillnest.git
cd skillnest