import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  Building2,
  AlertCircle,
  Loader2,
  X,
  Eye
} from 'lucide-react'
import { listAllVerifications, updateVerificationStatus } from '../../services/verificationService'
import { useToast } from '../../context/ToastContext'

export default function AdminVerifications() {
  const toast = useToast()
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)
  
  // State for the Details Modal
  const [selectedVerification, setSelectedVerification] = useState(null)

  const fetchVerifications = async () => {
    setLoading(true)
    const data = await listAllVerifications()
    setVerifications(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  const handleAction = async (verification, status) => {
    if (!window.confirm(`Are you sure you want to mark this as ${status}?`)) return

    setActionLoading(verification.id)
    try {
      await updateVerificationStatus(
        verification.id, 
        status, 
        verification.companyId, 
        verification.userId
      )
      toast.success('Success', `Verification marked as ${status}.`)
      setSelectedVerification(null) // Close modal if open
      await fetchVerifications()
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = verifications.filter(v => {
    const status = v.status || 'pending'
    return status.toLowerCase() === activeTab
  })

  const pendingCount = verifications.filter(v => v.status === 'pending').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="text-[#7c3aed]" size={28} /> Business Verifications
        </h1>
        <p className="text-gray-500 mt-1">Review documents and approve employer accounts to let them post jobs.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { id: 'pending', label: `Pending (${pendingCount})`, icon: Clock },
          { id: 'approved', label: 'Approved', icon: CheckCircle2 },
          { id: 'rejected', label: 'Rejected', icon: XCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#7c3aed] text-[#7c3aed]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#7c3aed]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No {activeTab} verifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'pending' ? 'All caught up! There are no pending requests.' : `No verifications have been marked as ${activeTab} yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              
              {/* Left: Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {v.companyName || v.businessName || 'Company Request'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Submitted: {v.submittedAt?.seconds ? new Date(v.submittedAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-row md:flex-col lg:flex-row gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <button
                  onClick={() => setSelectedVerification(v)}
                  className="flex-1 btn-outline !border-gray-300 !text-gray-700 hover:!bg-gray-50 !py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> Review Details
                </button>
                
                {activeTab !== 'approved' && (
                  <button
                    onClick={() => handleAction(v, 'approved')}
                    disabled={actionLoading === v.id}
                    className="flex-1 btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 !py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === v.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Approve
                  </button>
                )}
                {activeTab !== 'rejected' && (
                  <button
                    onClick={() => handleAction(v, 'rejected')}
                    disabled={actionLoading === v.id}
                    className="flex-1 btn-outline !border-red-200 !text-red-600 hover:!bg-red-50 !py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ─── REVIEW DETAILS MODAL ─── */}
      {selectedVerification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-[#7c3aed]" /> Verification Documents
              </h3>
              <button onClick={() => setSelectedVerification(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Dynamically shows all submitted fields) */}
            <div className="p-6 overflow-y-auto space-y-4">
              {Object.entries(selectedVerification)
                .filter(([key]) => !['id', 'status', 'companyId', 'userId', 'submittedAt', 'reviewedAt', 'rejectionReason'].includes(key))
                .map(([key, value]) => {
                  
                  // Format the key (e.g., "cacNumber" -> "CAC Number")
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                  
                  // Don't show empty values
                  if (!value || (Array.isArray(value) && value.length === 0)) return null

                  return (
                    <div key={key} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                      
                      {/* If it's an array (like documents) */}
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {value.map((item, i) => (
                            <a key={i} href={item} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[#7c3aed] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition">
                              View Document {i + 1} <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      ) : 
                      /* If it's a URL string */
                      typeof value === 'string' && value.startsWith('http') ? (
                        <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[#7c3aed] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition shadow-sm">
                          Open Link / Document <ExternalLink size={14} />
                        </a>
                      ) : 
                      /* If it's normal text */
                      (
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      )}
                    </div>
                  )
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
               {selectedVerification.status !== 'approved' && (
                  <button
                    onClick={() => handleAction(selectedVerification, 'approved')}
                    className="flex-1 btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 !py-3 text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 size={18} /> Approve Request
                  </button>
                )}
                {selectedVerification.status !== 'rejected' && (
                  <button
                    onClick={() => handleAction(selectedVerification, 'rejected')}
                    className="flex-1 btn-outline !border-red-200 !text-red-600 hover:!bg-red-50 !py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} /> Reject Request
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}