import { Users, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function AdminCommunity() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-[#1a1c23] text-white pt-10 pb-8 px-4 sm:px-6">
        <div className="container-app max-w-6xl">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Users size={28} className="text-[#7c3aed]" /> Community Moderation
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Manage user posts, comments, and reported content across SkillNest.
          </p>
        </div>
      </div>

      <div className="container-app max-w-6xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Total Posts</p>
            <p className="text-3xl font-extrabold text-[#7c3aed] mt-2">1,248</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Reported Content</p>
            <p className="text-3xl font-extrabold text-red-500 mt-2">14</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Active Members</p>
            <p className="text-3xl font-extrabold text-teal-500 mt-2">8,430</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Community Feed Integration</h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Your community moderation tools will appear here. Connect this to your `posts` or `reports` Firestore collection to start managing content.
          </p>
        </div>
      </div>
    </div>
  )
}