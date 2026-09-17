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
import SavedJobs from './pages/SavedJobs'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerCompanyProfile from './pages/EmployerCompanyProfile'
import EmployerPostJob from './pages/EmployerPostJob'
import EmployerJobs from './pages/EmployerJobs'
import EmployerJobApplicants from './pages/EmployerJobApplicants'
import EmployerScheduleInterview from './pages/EmployerScheduleInterview'
import EmployerInterviews from './pages/EmployerInterviews'
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
import CompanyProfile from './pages/CompanyProfile'
import ApplicantProfileView from './pages/ApplicantProfileView'
import NotFound from './pages/NotFound'
import { useInterviewReminders } from './hooks/useInterviewReminders'
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

function App() {
  useInterviewReminders()

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />

        <Route path="jobs" element={<FindJobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="companies/:id" element={<CompanyProfile />} />
        {/* Static pages */}
<Route path="about" element={<About />} />
<Route path="contact" element={<Contact />} />
<Route path="pricing" element={<Pricing />} />
<Route path="how-it-works" element={<HowItWorks />} />
<Route path="careers" element={<Careers />} />
<Route path="blog" element={<Blog />} />
<Route path="help" element={<HelpCenter />} />
<Route path="privacy" element={<Privacy />} />
<Route path="terms" element={<Terms />} />
<Route path="security" element={<Security />} />

        {/* Job seeker */}
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
          path="saved-jobs"
          element={
            <ProtectedRoute allowRoles={['job_seeker']}>
              <SavedJobs />
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

        {/* Employer */}
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

        {/* Applicant profile view (employer + admin) */}
        <Route
          path="applicants/:uid"
          element={
            <ProtectedRoute allowRoles={['employer', 'admin']}>
              <ApplicantProfileView />
            </ProtectedRoute>
          }
        />

        {/* Shared */}
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

        {/* Legacy redirect */}
        <Route
          path="dashboard/admin"
          element={<Navigate to="/admin" replace />}
        />

        {/* Admin console */}
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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App