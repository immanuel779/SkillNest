import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  CreditCard,
  Building2,
  AlertCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useToast } from '../../context/ToastContext'

/* ============================================================
   EDIT THESE — your bank details go here
   ============================================================ */
const BANK_DETAILS = {
  bankName: 'Access Bank',
  accountName: 'opeyemi oluwadamilare',
  accountNumber: '1504020994',
  supportEmail: 'opeyemioluwadamilare415@gmail.com',
  supportPhone: '+234 708 958 4607',
}

function fmtPrice(price, currency) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : ''
  return `${symbol}${Number(price || 0).toLocaleString()}`
}

export default function PaymentInstructionsModal({
  submissionId,
  pkg,
  onClose,
  onConfirmed,
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const accountLine = `${BANK_DETAILS.accountNumber}`

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(accountLine)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.info('Copy this account number', accountLine)
    }
  }

  const handlePaid = async () => {
    setConfirming(true)
    try {
      await updateDoc(doc(db, 'adSubmissions', submissionId), {
        paymentMarkedPaid: true,
        paymentMarkedPaidAt: serverTimestamp(),
        status: 'awaiting_payment_confirmation',
        updatedAt: serverTimestamp(),
      })
      toast.success(
        'Marked as paid',
        "We'll confirm within 24 hours and your ad goes live."
      )
      onConfirmed?.()
    } catch (err) {
      toast.error('Could not update', err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Complete your payment</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Transfer to the account below to activate your ad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50/60 dark:from-brand-950/60 dark:to-gray-900 border border-brand-100 dark:border-brand-900 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              Amount to pay
            </p>
            <p className="text-3xl font-extrabold mt-1">
              {fmtPrice(pkg.price, pkg.currency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {pkg.name} plan · {pkg.durationDays} days
            </p>
          </div>

          {/* Bank details */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-950 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Transfer to
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Bank</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {BANK_DETAILS.bankName}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500 pl-6">Account name</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                  {BANK_DETAILS.accountName}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-brand-50/60 dark:bg-brand-950/40">
                <span className="text-xs text-gray-500 pl-6">
                  Account number
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-brand-800 dark:text-brand-300 tracking-wider">
                    {BANK_DETAILS.accountNumber}
                  </span>
                  <button
                    onClick={copyAccount}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900 transition"
                    aria-label="Copy"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 flex items-start gap-2">
            <AlertCircle
              size={14}
              className="text-blue-700 dark:text-blue-400 mt-0.5 shrink-0"
            />
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-bold">How to complete your order:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Transfer the exact amount above</li>
                <li>
                  Use your <strong>business name</strong> as the transfer
                  narration
                </li>
                <li>Click "I've made the payment" below</li>
                <li>We confirm within 24 hours — your ad goes live instantly</li>
              </ol>
            </div>
          </div>

          {/* Support */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare size={13} />
              Need help?
            </div>
            <a
              href={`mailto:${BANK_DETAILS.supportEmail}?subject=Ad%20payment%20help`}
              className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-5 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="btn-outline w-full sm:w-auto">
            I'll pay later
          </button>
          <button
            onClick={handlePaid}
            disabled={confirming}
            className="btn-primary w-full sm:w-auto disabled:opacity-50"
          >
            {confirming ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Marking...
              </>
            ) : (
              <>
                <Check size={14} /> I&apos;ve made the payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}