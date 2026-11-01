import { useEffect, useState } from 'react'
import { ShieldCheck, ExternalLink, Check, X, Loader2, FileText } from 'lucide-react'
import { listPendingVerifications, approveVerification, rejectVerification } from '../../services/verificationService'
import { useToast } from '../../context/ToastContext'

export default function AdminVerifications() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listPendingVerifications())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (v) => {
    if (!window.confirm(`Approve ${v.regNumber}?`)) return
    setBusyId(v.id)
    try {
      await approveVerification(v.id, v.companyId, v.userId)
      toast.success('Approved', 'Company is now verified.')
      load()
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (v) => {
    const reason = window.prompt('Reason for rejection? (User will see this)')
    if (reason === null) return // user cancelled
    setBusyId(v.id)
    try {
      await rejectVerification(v.id, v.userId, reason)
      toast.success('Rejected', 'User has been notified.')
      load()
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-brand-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Business Verifications</h2>
          <p className="text-sm text-gray-500 mt-1">Review documents and approve employer accounts.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={24} /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No pending verifications</h3>
          <p className="text-sm text-gray-500 mt-1">All employer requests have been reviewed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(v => (
            <div key={v.id} className="card flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 capitalize">{v.docType} Document</p>
                  <p className="text-sm text-gray-600 mt-0.5">Reg Number: <strong className="text-gray-900">{v.regNumber}</strong></p>
                  {v.additionalInfo && <p className="text-xs text-gray-500 mt-1 max-w-md">"{v.additionalInfo}"</p>}
                  
                  <a 
                    href={v.documentUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline mt-2"
                  >
                    View Uploaded Document <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button 
                  onClick={() => handleApprove(v)} 
                  disabled={busyId === v.id}
                  className="btn-primary !bg-green-600 hover:!bg-green-700 !py-2 !px-4 text-xs w-full justify-center"
                >
                  {busyId === v.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Approve
                </button>
                <button 
                  onClick={() => handleReject(v)} 
                  disabled={busyId === v.id}
                  className="btn-outline !text-red-600 !border-red-200 !py-2 !px-4 text-xs w-full justify-center"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}