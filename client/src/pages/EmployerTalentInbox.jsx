import { Link } from 'react-router-dom'
import { Inbox, ArrowLeft } from 'lucide-react'

export default function EmployerTalentInbox() {
  return (
    <div className="container-app py-10 max-w-4xl">
      <Link to="/dashboard/employer" className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"><ArrowLeft size={14} /> Back</Link>
      <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-2"><Inbox /> Talent Inbox</h1>
      <div className="card text-center py-20 border-dashed">
         <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
         <h2 className="text-xl font-bold text-gray-700">No Messages Yet</h2>
         <p className="text-sm text-gray-500 mt-2">When you message job seekers from the Talent Directory, their replies appear here.</p>
      </div>
    </div>
  )
}