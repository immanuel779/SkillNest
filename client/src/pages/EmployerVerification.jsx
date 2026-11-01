import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  Building2,
  ChevronRight,
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyCompany } from '../services/companyService'
import { submitVerification, getMyVerification } from '../services/verificationService'
import { uploadDocument } from '../services/storageService'
import { useToast } from '../context/ToastContext'

const STEPS = ['Select Document', 'Upload & Submit', 'Under Review', 'Verified']

const DOC_TYPES = [
  { id: 'cac', label: 'CAC Certificate', desc: 'Corporate Affairs Commission Registration Certificate', icon: Building2 },
  { id: 'tin', label: 'Tax Identification Certificate', desc: 'Federal Inland Revenue Service (FIRS) Tax ID', icon: FileText },
  { id: 'permit', label: 'Business Permit', desc: 'Valid business operating license', icon: ShieldCheck },
]

export default function EmployerVerification() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [company, setCompany] = useState(null)
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)
  const [docType, setDocType] = useState('cac')
  const [file, setFile] = useState(null)
  const [regNumber, setRegNumber] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      const c = await getMyCompany(user.uid)
      setCompany(c)
      if (c) {
        const v = await getMyVerification(c.id)
        setVerification(v)
        // Auto-route based on status
        if (v?.status === 'pending') setCurrentStep(3)
        else if (v?.status === 'approved') setCurrentStep(4)
      }
      setLoading(false)
    })()
  }, [user])

  const handleFileDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const validateAndSetFile = (f) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)) {
      return toast.error('Please upload a PDF, JPG, or PNG')
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !regNumber.trim() || !confirmed) return
    setSubmitting(true)
    try {
      const docUrl = await uploadDocument(`verifications/${company.id}`, file)
      
      const submissionId = await submitVerification(company.id, user.uid, {
        docType,
        regNumber,
        additionalInfo,
        documentUrl: docUrl,
        documentName: file.name
      })

      setVerification({ id: submissionId, status: 'pending' })
      setCurrentStep(3)
      toast.success('Submitted!', 'We will review your documents shortly.')
    } catch (err) {
      toast.error('Submission failed', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20">
      
      {/* DARK HEADER */}
      <div className="bg-brand-950 text-white pt-8 pb-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="container-app relative max-w-5xl">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <ShieldCheck size={28} className="text-brand-400" />
               <h1 className="text-2xl font-extrabold">Request Verification</h1>
             </div>
             <Link to="/dashboard/employer" className="text-sm text-white/70 hover:text-white flex items-center gap-1">
               <ArrowLeft size={14} /> Dashboard
             </Link>
          </div>

          {/* STEPPER */}
          <div className="flex items-center justify-between relative mt-12">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />
            {STEPS.map((step, i) => {
              const stepNum = i + 1
              const isActive = currentStep === stepNum
              const isComplete = currentStep > stepNum
              return (
                <div key={step} className="flex flex-col items-center gap-2 bg-brand-950 px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    isActive ? 'bg-white text-brand-900 ring-4 ring-white/20' : 
                    isComplete ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {isComplete ? <CheckCircle2 size={16} /> : stepNum}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-semibold ${isActive ? 'text-white' : 'text-white/50'}`}>{step}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container-app max-w-5xl -mt-6 relative z-10 grid lg:grid-cols-[1fr_300px] gap-6">
        
        {/* LEFT COLUMN - DYNAMIC FORM */}
        <div className="space-y-6">
          
          {currentStep === 1 && (
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-2">Select Document Type</h2>
              <p className="text-sm text-gray-500 mb-6">Choose which official document you want to use to verify your business.</p>
              
              <div className="space-y-3">
                {DOC_TYPES.map(doc => (
                  <label key={doc.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    docType === doc.id ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-brand-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="docType" 
                      value={doc.id} 
                      checked={docType === doc.id} 
                      onChange={() => setDocType(doc.id)}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${docType === doc.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                      <doc.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{doc.label}</p>
                      <p className="text-xs text-gray-500">{doc.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setCurrentStep(2)} className="btn-primary">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><UploadCloud size={20} className="text-brand-600"/> Upload Document</h2>
                <p className="text-sm text-gray-500 mb-6">Upload a clear, legible copy of your {DOC_TYPES.find(d => d.id === docType)?.label}.</p>
                
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                    file ? 'border-green-400 bg-green-50/30' : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => validateAndSetFile(e.target.files[0])} 
                    className="hidden" 
                    accept=".pdf,image/jpeg,image/png"
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-green-700">
                      <CheckCircle2 size={40} className="mb-3" />
                      <p className="font-bold">{file.name}</p>
                      <p className="text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-xs text-red-500 underline mt-3">Remove</button>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <UploadCloud size={40} className="mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold text-gray-700">Drag & drop your document here</p>
                      <p className="text-xs mt-1">PDF, JPG, or PNG (max 5MB)</p>
                      <button className="btn-outline mt-4 !py-2 !px-4 text-sm !bg-white">Browse Files</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6 sm:p-8 space-y-4">
                <h2 className="text-xl font-bold mb-2">Company Details</h2>
                <div>
                  <label className="label">Company Registration Number <span className="text-red-500">*</span></label>
                  <input 
                    className="input" 
                    value={regNumber} 
                    onChange={e => setRegNumber(e.target.value)} 
                    placeholder="RC123456 or BN123456" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Enter your CAC RC or BN registration number.</p>
                </div>
                <div>
                  <label className="label">Additional Information (Optional)</label>
                  <textarea 
                    className="input resize-none" 
                    rows={3} 
                    value={additionalInfo} 
                    onChange={e => setAdditionalInfo(e.target.value)} 
                    placeholder="Any context you'd like to provide..."
                    maxLength={600}
                  />
                </div>
              </div>

              <div className="card p-6 sm:p-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-5 h-5 mt-0.5 accent-brand-600 rounded" />
                  <p className="text-sm text-gray-700">
                    I confirm that all information and documents provided are accurate and belong to my company, <strong>{company?.name}</strong>.
                  </p>
                </label>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setCurrentStep(1)} className="btn-outline">Back</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!file || !regNumber.trim() || !confirmed || submitting} 
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : <><Lock size={14}/> Complete & Submit</>}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="card p-10 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={40} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Under Review</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Your documents have been submitted successfully. Our team is currently reviewing your business details. This usually takes 24-48 hours.
              </p>
              <div className="mt-8 bg-gray-50 border border-gray-100 rounded-xl p-4 inline-block text-left">
                 <p className="text-xs font-bold uppercase text-gray-400 mb-2">Submitted</p>
                 <p className="text-sm font-semibold flex items-center gap-2"><FileText size={16}/> {DOC_TYPES.find(d => d.id === docType)?.label}</p>
                 <p className="text-sm text-gray-600 mt-1">Reg No: {regNumber}</p>
              </div>
              <div className="mt-8">
                <Link to="/dashboard/employer" className="btn-outline">Return to Dashboard</Link>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="card p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Company Verified</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Congratulations! Your business has been verified. You now have the trusted badge on your profile and can post unlimited jobs.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link to="/employer/jobs/new" className="btn-primary">Post a Job</Link>
                <Link to="/dashboard/employer" className="btn-outline">Go to Dashboard</Link>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN - BENEFITS & PROCESS */}
        <div className="space-y-4 hidden lg:block">
          <div className="card bg-white p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-500 fill-yellow-500" /> Verification Benefits
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center shrink-0"><ShieldCheck size={14} className="text-green-600"/></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Verified Badge</p>
                  <p className="text-xs text-gray-500">Stand out with a trusted badge on your profile.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0"><Users size={14} className="text-blue-600"/></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Build Trust</p>
                  <p className="text-xs text-gray-500">Job seekers apply more confidently to verified companies.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center shrink-0"><TrendingUp size={14} className="text-purple-600"/></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Higher Visibility</p>
                  <p className="text-xs text-gray-500">Priority placement in search results and recommendations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50 p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Verification Process</h3>
            <ul className="space-y-4">
              {['Select your document type', 'Upload a clear copy', 'Enter your registration number', 'Submit for admin review', 'Receive your badge in 24-48h'].map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}