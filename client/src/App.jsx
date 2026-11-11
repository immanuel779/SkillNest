import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import JobSeekerDashboard from './pages/JobSeekerDashboard'
import JobSeekerProfile from './pages/JobSeekerProfile'
import FindJobs from './pages/FindJobs'
import JobDetails from './pages/JobDetails'
import MyApplications from './pages/MyApplications'
import ApplicationTimeline from './pages/ApplicationTimeline'
import SavedJobs from './pages/SavedJobs'
import MySearches from './pages/MySearches'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerCompanyProfile from './pages/EmployerCompanyProfile'
import EmployerPostJob from './pages/EmployerPostJob'
import EmployerJobs from './pages/EmployerJobs'
import EmployerJobApplicants from './pages/EmployerJobApplicants'
import EmployerScheduleInterview from './pages/EmployerScheduleInterview'
import EmployerInterviews from './pages/EmployerInterviews'
import EmployerUpdates from './pages/EmployerUpdates'
import EmployerAnalytics from './pages/EmployerAnalytics'
import EmployerTeam from './pages/EmployerTeam'
import AcceptInvite from './pages/AcceptInvite'
import JobSeekerInterviews from './pages/JobSeekerInterviews'
import InterviewDetails from './pages/InterviewDetails'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminJobs from './pages/admin/AdminJobs'
import AdminApplications from './pages/admin/AdminApplications'
import AdminReports from './pages/admin/AdminReports'
import AdminBroadcast from './pages/admin/AdminBroadcast'
import ApplicantProfileView from './pages/ApplicantProfileView'
import NotFound from './pages/NotFound'
import About from './pages/About'
import Contact from './pages/Contact'
import Pricing from './pages/Pricing'
import HowItWorks from './pages/HowItWorks'
import Careers from './pages/Careers'
import Blog from './pages/Blog'
import HelpCenter from './pages/HelpCenter'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Security from './pages/Security'
import CompanySpace from './pages/CompanySpace'
import CompanyLegacyRedirect from './pages/CompanyLegacyRedirect'
import AccountSettings from './pages/AccountSettings'
import Companies from './pages/Companies'
import { useInterviewReminders } from './hooks/useInterviewReminders'
import { useJobAlerts } from './hooks/useJobAlerts'
import ResumeBuilder from './pages/ResumeBuilder'
import AdminEmma from './pages/admin/AdminEmma'
import Community from './pages/Community'
import Advertise from './pages/Advertise'
import AdminAdSubmissions from './pages/admin/AdminAdSubmissions'
import EmployerVerification from './pages/EmployerVerification'
import EmployerCandidates from './pages/EmployerSavedCandidates'
import EmployerTalentInbox from './pages/EmployerTalentInbox'
import EmployerUpgrade from './pages/EmployerUpgrade'
import AdminVerifications from './pages/admin/AdminVerifications'
import EmployerCandidateAlerts from './pages/EmployerCandidateAlerts'
import EmployerSettings from './pages/EmployerSettings'
import AdminCommunity from './pages/AdminCommunity'
import AdminLanding from './pages/AdminLanding'
import BlogPost from './pages/BlogPost'
import AdminBlog from './pages/admin/AdminBlog'

function App() {
  useInterviewReminders()
  useJobAlerts()

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* ============================
            PUBLIC
            ============================ */}
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />

        <Route path="jobs" element={<FindJobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="companies" element={<Companies />} />
        <Route path="c/:slug" element={<CompanySpace />} />
        <Route path="companies/:id" element={<CompanyLegacyRedirect />} />

        {/* Accept team invite — public so invited users can sign in first */}
        <Route path="accept-invite/:token" element={<AcceptInvite />} />

        {/* Static pages */}
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="careers" element={<Careers />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:id" element={<BlogPost />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="security" element={<Security />} />
        <Route path="resume" element={<ResumeBuilder />} />
        <Route path="advertise" element={<Advertise />} />

        {/* ============================
            JOB SEEKER
            ============================ */}
        <Route
          path="dashboard/job-seeker"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile/job-seeker"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <JobSeekerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications/:id"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <ApplicationTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="saved-jobs"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <SavedJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route
          path="searches"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <MySearches />
            </ProtectedRoute>
          }
        />
        <Route
          path="interviews"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <JobSeekerInterviews />
            </ProtectedRoute>
          }
        />

        {/* ============================
            EMPLOYER
            ============================ */}
        <Route
          path="dashboard/employer"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/company"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerCompanyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/jobs"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/jobs/new"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerPostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/jobs/:id/edit"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerPostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/jobs/:id/applicants"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerJobApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/applications/:id/interview"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerScheduleInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/interviews"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerInterviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/updates"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerUpdates />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/analytics"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="employer/team"
          element={
            <ProtectedRoute allowRoles={['employer']}>
              <EmployerTeam />
            </ProtectedRoute>
          }
        />
        <Route path="employer/verification" element={<ProtectedRoute allowRoles={['employer']}><EmployerVerification /></ProtectedRoute>} />
        <Route path="employer/candidates" element={<ProtectedRoute allowRoles={['employer']}><EmployerCandidates /></ProtectedRoute>} />
        <Route path="employer/talent-inbox" element={<ProtectedRoute allowRoles={['employer']}><EmployerTalentInbox /></ProtectedRoute>} />
        <Route path="employer/upgrade" element={<ProtectedRoute allowRoles={['employer']}><EmployerUpgrade /></ProtectedRoute>} />
        <Route path="employer/settings" element={<ProtectedRoute allowRoles={['employer']}><EmployerSettings /></ProtectedRoute>} />
        <Route path="employer/alerts" element={<ProtectedRoute allowRoles={['employer']}><EmployerCandidateAlerts /></ProtectedRoute>} />

        {/* ============================
            SHARED (any authenticated user)
            ============================ */}
        <Route
          path="applicants/:uid"
          element={
            <ProtectedRoute allowRoles={['employer', 'admin']}>
              <ApplicantProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="interviews/:id"
          element={
            <ProtectedRoute>
              <InterviewDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        {/* ============================
            ADMIN (NESTED ROUTES)
            ============================ */}
        <Route
          path="dashboard/admin"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="broadcast" element={<AdminBroadcast />} />
          <Route path="emma" element={<AdminEmma />} />
          <Route path="ad-submissions" element={<AdminAdSubmissions />} />
          <Route path="verifications" element={<AdminVerifications />} />
          
          {/* 👇 Admin Dashboard Extras (Moved here to fix layout) 👇 */}
          <Route path="community" element={<AdminCommunity />} />
          <Route path="landing" element={<AdminLanding />} />
          <Route path="blog" element={<AdminBlog />} />
        </Route>

        {/* ============================
            404
            ============================ */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App