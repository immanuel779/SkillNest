import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { auth } from '../config/firebase' // Adjust path if needed
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'

export default function EmployerSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Sends a secure password reset link to the employer's email
      await sendPasswordResetEmail(auth, user.email)
      setMessage({ 
        type: 'success', 
        text: `A password reset link has been sent to ${user.email}. Please check your inbox.` 
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset link.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Dark Header */}
      <div className="bg-[#1a1c23] text-white pt-10 pb-8 px-4 sm:px-6 relative">
        <div className="container-app relative max-w-4xl">
          <Link to="/employer/company" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4 transition w-fit">
            <ArrowLeft size={16} /> Back to Profile
          </Link>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Account Settings
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Manage your password and security preferences.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-app max-w-4xl mt-8 relative z-10">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm max-w-2xl">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wide">
            <Lock size={16} className="text-[#7c3aed]" /> CHANGE PASSWORD
          </h2>

          {message.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-start gap-2 ${
              message.type === 'success' ? 'bg-[#f3e8ff] text-[#7c3aed] border border-[#e9d5ff]' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <p>{message.text}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex items-start gap-3">
            <ShieldCheck className="text-blue-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-blue-900">Secure Password Reset</p>
              <p className="text-xs text-blue-700 mt-1">
                For your security, we will send a password reset link to <strong>{user?.email}</strong>. Clicking the link in your email will allow you to set a new password.
              </p>
            </div>
          </div>

          <button 
            onClick={handlePasswordReset} 
            disabled={loading}
            className="btn-primary w-full sm:w-auto !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-3 !px-8 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} 
            {loading ? 'Sending...' : 'Send Password Reset Link'}
          </button>
        </div>
      </div>
    </div>
  )
}