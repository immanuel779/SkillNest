import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  ExternalLink,
  Loader2,
  Eye,
  Megaphone,
  AlertTriangle,
  X
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { 
  approveAdSubmission, 
  rejectAdSubmission, 
  deleteAdSubmission 
} from '../../services/adsService'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

export default function AdminAdSubmissions() {
  const { user } = useAuth()
  const toast = useToast()
  
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)
  
  // Modals
  const [selectedAd, setSelectedAd] = useState(null)
  const [rejectingAd, setRejectingAd] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Real-time listener for ads
  useEffect(() => {
    const q = query(collection(db, 'adSubmissions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSubmissions(items)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleApprove = async (ad) => {
    setActionLoading(ad.id)
    try {
      await approveAdSubmission(ad.id, user.uid)
      toast.success('Approved', 'The ad is now live and running.')
      setSelectedAd(null)
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectingAd) return
    setActionLoading(rejectingAd.id)
    try {
      await rejectAdSubmission(rejectingAd.id, user.uid, rejectReason)
      toast.success('Rejected', 'The ad has been stopped and the user notified.')
      setRejectingAd(null)
      setRejectReason('')
      setSelectedAd(null)
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (ad) => {
    if (!window.confirm('Are you sure you want to permanently delete this ad? This cannot be undone.')) return
    setActionLoading(ad.id)
    try {
      await deleteAdSubmission(ad.id, ad.advertisementId)
      toast.success('Deleted', 'Ad removed permanently.')
      setSelectedAd(null)
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = submissions.filter(ad => {
    if (activeTab === 'all') return true
    return ad.status === activeTab
  })

  const counts = {
    pending: submissions.filter(a => a.status === 'pending').length,
    approved: submissions.filter(a => a.status === 'approved').length,
    rejected: submissions.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Megaphone className="text-[#7c3aed]" size={28} /> Ad Submissions
        </h1>
        <p className="text-gray-500 mt-1">Review, approve, and manage all platform advertisements.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'pending', label: `Pending (${counts.pending})`, icon: Clock },
          { id: 'approved', label: `Live (${counts.approved})`, icon: CheckCircle2 },
          { id: 'rejected', label: `Rejected (${counts.rejected})`, icon: XCircle },
          { id: 'all', label: 'All Ads', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
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
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#7c3aed]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No {activeTab} ads</h3>
          <p className="text-sm text-gray-500 mt-1">You're all caught up here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ad => {
            const isPending = ad.status === 'pending'
            const isApproved = ad.status === 'approved'
            const isRejected = ad.status === 'rejected'
            const isExpired = ad.expiresAt && (ad.expiresAt.seconds * 1000) < Date.now()

            return (
              <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition">
                
                {/* Card Image/Banner */}
                <div className="h-32 bg-gray-50 relative border-b border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : ad.logoUrl ? (
                    <img src={ad.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <Megaphone size={32} className="text-gray-300" />
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {isExpired ? (
                      <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow">EXPIRED</span>
                    ) : isApproved ? (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">LIVE</span>
                    ) : isRejected ? (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">REJECTED</span>
                    ) : (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow">PENDING</span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider mb-1 truncate">
                    {ad.businessName}
                  </p>
                  <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mb-2">
                    {ad.headline}
                  </h3>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                    <p>Plan: <span className="font-semibold text-gray-800">{ad.packageName}</span></p>
                    <p>Price: <span className="font-semibold text-gray-800">₦{ad.price?.toLocaleString()}</span></p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedAd(ad)} 
                    className="flex-1 btn-outline !py-2 !px-2 text-xs !border-gray-300 !text-gray-700 hover:!bg-white"
                  >
                    <Eye size={14} className="mr-1 inline" /> Details
                  </button>
                  
                  {!isApproved && (
                    <button 
                      onClick={() => handleApprove(ad)} 
                      disabled={actionLoading === ad.id}
                      className="flex-1 btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 !py-2 !px-2 text-xs"
                    >
                      {actionLoading === ad.id ? <Loader2 size={14} className="animate-spin"/> : 'Approve'}
                    </button>
                  )}

                  {!isRejected && (
                    <button 
                      onClick={() => setRejectingAd(ad)} 
                      disabled={actionLoading === ad.id}
                      className="flex-1 btn-outline !border-red-200 !text-red-600 hover:!bg-red-50 !py-2 !px-2 text-xs"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── DETAILS MODAL ─── */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-gray-900">Ad Details</h3>
              <button onClick={() => setSelectedAd(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex gap-4">
                {selectedAd.logoUrl && (
                  <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-200 p-2 shrink-0">
                    <img src={selectedAd.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-[#7c3aed] uppercase">{selectedAd.businessName}</p>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedAd.headline}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedAd.description}</p>
                  {selectedAd.subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{selectedAd.subtext}</p>}
                </div>
              </div>

              {selectedAd.imageUrl && (
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Banner Image</p>
                  <img src={selectedAd.imageUrl} alt="Banner" className="w-full rounded-xl border border-gray-200" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Destination URL</p>
                  <a href={selectedAd.ctaUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#7c3aed] hover:underline flex items-center gap-1 truncate">
                    {selectedAd.ctaUrl} <ExternalLink size={12} />
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Button Text</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedAd.ctaText}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Advertiser</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedAd.userName} ({selectedAd.userEmail})</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Plan Details</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedAd.packageName} — ₦{selectedAd.price?.toLocaleString()} / {selectedAd.durationDays} Days</p>
                </div>
              </div>

              {selectedAd.status === 'rejected' && selectedAd.rejectionReason && (
                <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
                  <strong>Rejection Reason:</strong> {selectedAd.rejectionReason}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
               {selectedAd.status !== 'approved' && (
                  <button onClick={() => handleApprove(selectedAd)} className="flex-1 btn-primary !bg-[#1db365] !border-0 !py-3">
                    <CheckCircle2 size={16} className="inline mr-2"/> Approve Ad
                  </button>
                )}
                {selectedAd.status !== 'rejected' && (
                  <button onClick={() => { setRejectingAd(selectedAd); }} className="flex-1 btn-outline !border-red-200 !text-red-600 !py-3">
                    Reject Ad
                  </button>
                )}
                <button onClick={() => handleDelete(selectedAd)} className="btn-outline !border-gray-300 !text-gray-600 !py-3 !px-4">
                  <Trash2 size={16} />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT MODAL ─── */}
      {rejectingAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900">Reject Ad</h3>
                <p className="text-xs text-gray-500">This will stop the ad and notify the user.</p>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for rejection</label>
              <textarea
                autoFocus
                rows={3}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                placeholder="e.g. The banner contains prohibited content, or the link is broken."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setRejectingAd(null)} className="btn-outline !py-2 !px-4 text-sm">
                Cancel
              </button>
              <button onClick={handleReject} disabled={actionLoading === rejectingAd.id} className="btn-primary !bg-red-600 hover:!bg-red-700 !border-0 !py-2 !px-6 text-sm">
                {actionLoading === rejectingAd.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}