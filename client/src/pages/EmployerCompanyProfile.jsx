import { useEffect, useState, useRef } from 'react' // Added useRef
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  LayoutDashboard,
  PlusSquare,
  Briefcase,
  Bell,
  ShieldCheck,
  Lock,
  LogOut,
  Info,
  Phone,
  Loader2 // Added for upload spinner
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyCompany, saveCompany } from '../services/companyService'

// Add Firebase Storage imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase' // Adjust path if needed

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Engineering', 
  'Marketing', 'Sales', 'Customer Service', 'Human Resources', 'Other'
]

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-500 employees', '500+ employees'
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

export default function EmployerCompanyProfile() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false) // New state for image upload
  const [message, setMessage] = useState({ type: '', text: '' })

  const [form, setForm] = useState({
    name: '',
    foundedYear: '',
    industry: '',
    size: '',
    description: '',
    logo: '',
    contactPerson: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  })

  // Calculate Profile Completeness
  const requiredFields = ['name', 'industry', 'size', 'description', 'contactPerson', 'phone', 'address', 'city', 'state']
  const filledFields = requiredFields.filter(field => form[field] && form[field].trim() !== '')
  const completeness = Math.round((filledFields.length / requiredFields.length) * 100)
  
  const missingFields = []
  if (!form.industry) missingFields.push('Industry')
  if (!form.city) missingFields.push('City')
  if (!form.state) missingFields.push('State')
  if (!form.description) missingFields.push('Company Description')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const data = await getMyCompany(user.uid)
        if (data && alive) {
          setForm((f) => ({ ...f, ...data }))
        }
      } catch (err) {
        console.warn('Failed to load company profile', err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // ─── LOGO UPLOAD HANDLER ───
  const handleLogoUpload = async (file) => {
    if (!file) return

    // Validate size (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Max size is 2MB.' })
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file (JPG, PNG, etc).' })
      return
    }

    setUploadingLogo(true)
    setMessage({ type: '', text: '' })

    try {
      // Create a unique filename (e.g., company_logos/userId_123456.jpg)
      const filename = `company_logos/${user.uid}_${Date.now()}_${file.name}`
      const storageRef = ref(storage, filename)
      
      // Upload file
      await uploadBytes(storageRef, file)
      
      // Get URL
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update form state
      update('logo', downloadURL)
      setMessage({ type: 'success', text: 'Logo uploaded! Remember to click "Save Profile".' })
    } catch (err) {
      console.error(err)
      // Fallback: If Firebase storage is not setup, use Base64 so it at least works locally
      const reader = new FileReader()
      reader.onloadend = () => {
        update('logo', reader.result)
        setMessage({ type: 'success', text: 'Logo loaded (Local preview only - Firebase Storage not configured).' })
      }
      reader.readAsDataURL(file)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-gray-100', 'border-[#7c3aed]')
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await saveCompany(user.uid, form)
      setMessage({ type: 'success', text: 'Company profile saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── DARK HEADER WITH PROGRESS BAR ─── */}
      <div className="bg-[#1a1c23] text-white pt-10 pb-0 px-4 sm:px-6 relative">
        <div className="container-app relative max-w-6xl">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Company Profile
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Manage your company information and attract top talent across Nigeria.
          </p>
        </div>
        
        {/* Progress Bar Banner attached to bottom of header */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#7c3aed] text-white text-sm py-2">
          <div className="container-app max-w-6xl flex items-center gap-2">
            <span className="font-bold">Profile {completeness}% complete</span>
            <span className="opacity-90">— fill in the remaining fields to attract more candidates</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-6xl mt-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* ─── LEFT SIDEBAR ─── */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            
            {/* Company Card */}
            <div className="card !p-6 flex flex-col items-center text-center border border-gray-200 shadow-sm rounded-xl">
              <div className="w-24 h-24 rounded-2xl bg-[#7c3aed] flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 overflow-hidden relative">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="tracking-tighter">{form.name ? form.name.substring(0, 2).toUpperCase() : 'OO'}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {form.contactPerson || profile?.fullName || 'Company Name'}
              </h2>
              <CheckCircle2 size={16} className="text-[#7c3aed] mt-1 mb-2" />
              <p className="text-xs text-gray-500 break-all">
                {user?.email || 'email@example.com'}
              </p>

              <div className="w-full mt-6 text-left">
                <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-2">Profile Completeness</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-[#7c3aed] h-2.5 rounded-full" style={{ width: `${completeness}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-400">Add more details to strengthen your profile</p>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="card !p-2 border border-gray-200 shadow-sm rounded-xl flex flex-col gap-1">
              <Link to="/employer/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <LayoutDashboard size={18} className="text-gray-400" /> Dashboard
              </Link>
              <Link to="/employer/jobs/new" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <PlusSquare size={18} className="text-gray-400" /> Post New Job
              </Link>
              <Link to="/employer/jobs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <Briefcase size={18} className="text-gray-400" /> My Job Posts
              </Link>
              <Link to="/employer/company" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-[#f3e8ff] text-[#7c3aed] transition">
                <Building2 size={18} /> Company Profile
              </Link>
              <Link to="/employer/alerts" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <Bell size={18} className="text-gray-400" /> Candidate Alerts
              </Link>
              <Link to="/employer/verification" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <ShieldCheck size={18} className="text-gray-400" /> Verify Company
              </Link>
              <Link to="/employer/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <Lock size={18} className="text-gray-400" /> Change Password
              </Link>
              <button onClick={() => { /* handle logout */ }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition w-full text-left mt-2">
                <LogOut size={18} className="text-red-400" /> Sign Out
              </button>
            </div>

            {/* Profile Tips */}
            <div className="card !p-5 border border-gray-200 shadow-sm rounded-xl bg-white">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Info size={16} className="text-[#7c3aed]" /> PROFILE TIPS
              </h3>
              <ul className="space-y-3">
                {[
                  'Upload a professional company logo',
                  'Write a compelling description (min 100 chars)',
                  'Add full contact details',
                  'Include your website URL',
                  'Specify your company size & industry'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-[#7c3aed] shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* ─── RIGHT FORM AREA ─── */}
          <div className="lg:col-span-8 xl:col-span-9">
            
            {/* Warning Banner */}
            {missingFields.length > 0 && (
              <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 flex items-start gap-3 mb-6 shadow-sm">
                <AlertTriangle size={20} className="text-[#d97706] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#92400e] text-sm">Action Required: Please complete your company profile before posting jobs.</p>
                  <p className="text-[#b45309] text-sm mt-1">Missing: {missingFields.join(', ')}.</p>
                </div>
              </div>
            )}

            {message.text && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold ${
                message.type === 'success' ? 'bg-[#f3e8ff] text-[#7c3aed] border border-[#e9d5ff]' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-[#7c3aed]" /> BASIC INFORMATION
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">COMPANY NAME <span className="text-red-500">*</span></label>
                    <input className="input" value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Acme Corp" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">FOUNDED YEAR</label>
                    <input className="input" type="number" value={form.foundedYear || ''} onChange={(e) => update('foundedYear', e.target.value)} placeholder="2020" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">INDUSTRY <span className="text-red-500">*</span></label>
                    <select className="input" value={form.industry || ''} onChange={(e) => update('industry', e.target.value)} required>
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">COMPANY SIZE <span className="text-red-500">*</span></label>
                    <select className="input" value={form.size || ''} onChange={(e) => update('size', e.target.value)} required>
                      <option value="">Select Size</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">COMPANY DESCRIPTION <span className="text-red-500">*</span></label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed] transition">
                     <textarea 
                       rows={5} 
                       className="w-full p-4 outline-none resize-none text-sm" 
                       value={form.description || ''} 
                       onChange={(e) => update('description', e.target.value)}
                       placeholder="Tell candidates what your company does, your mission, and culture..."
                       required
                     />
                     <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-500 flex items-center gap-1"><Info size={12}/> Minimum 100 characters.</span>
                        <span className={form.description.length < 100 ? 'text-red-500 font-semibold' : 'text-[#7c3aed] font-semibold'}>
                          {form.description.length}/100
                        </span>
                     </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">COMPANY LOGO</label>
                  
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleLogoUpload(e.target.files[0])} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {/* Clickable Dropzone */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-gray-100', 'border-[#7c3aed]') }}
                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-gray-100', 'border-[#7c3aed]') }}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <Loader2 size={32} className="text-[#7c3aed] animate-spin mb-3" />
                    ) : (
                      <UploadCloud size={32} className="text-gray-300 mb-3" />
                    )}
                    <p className="text-sm text-[#7c3aed] font-semibold mb-1">
                      {uploadingLogo ? 'Uploading...' : 'Click to upload'} <span className="text-gray-500 font-normal">{!uploadingLogo && 'or drag & drop'}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">JPG, PNG, GIF - Max 2MB - Square image recommended</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wide">
                  <Phone size={16} className="text-[#7c3aed]" /> CONTACT INFORMATION
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">CONTACT PERSON <span className="text-red-500">*</span></label>
                    <input className="input" value={form.contactPerson || ''} onChange={(e) => update('contactPerson', e.target.value)} placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">PHONE NUMBER <span className="text-red-500">*</span></label>
                    <input className="input" type="tel" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="+234 123 456 7890" required />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">WEBSITE URL</label>
                  <input className="input" type="url" value={form.website || ''} onChange={(e) => update('website', e.target.value)} placeholder="https://www.yourcompany.com" />
                </div>
              </div>

              {/* Location */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6 uppercase tracking-wide">
                  <MapPin size={16} className="text-[#7c3aed]" /> LOCATION
                </h2>
                
                <div className="mb-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">ADDRESS <span className="text-red-500">*</span></label>
                  <textarea rows={3} className="input resize-none" value={form.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="Street address, building number, etc." required />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">CITY <span className="text-red-500">*</span></label>
                    <input className="input" value={form.city || ''} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Lagos, Abuja" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">STATE <span className="text-red-500">*</span></label>
                    <select className="input" value={form.state || ''} onChange={(e) => update('state', e.target.value)} required>
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">COUNTRY</label>
                  <input className="input bg-gray-50 cursor-not-allowed" value={form.country} readOnly />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-sm">
                <button type="submit" disabled={saving || uploadingLogo} className="w-full sm:w-auto btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-3 !px-8 text-base shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50">
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" onClick={() => window.location.reload()} className="w-full sm:w-auto btn-outline !py-3 !px-8 text-base !border-gray-200 !text-gray-600">
                  <RotateCcw size={18} /> Reset
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}