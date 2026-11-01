import { LayoutTemplate, Save, Eye } from 'lucide-react'

export default function AdminLanding() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-[#1a1c23] text-white pt-10 pb-8 px-4 sm:px-6">
        <div className="container-app max-w-6xl">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <LayoutTemplate size={28} className="text-[#eab308]" /> Landing Page Manager
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Update hero sections, banners, and featured content for the public site.
          </p>
        </div>
      </div>

      <div className="container-app max-w-6xl mt-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Hero Section Content</h2>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Main Headline</label>
              <input type="text" className="input" defaultValue="Find Your Dream Job in Nigeria" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Subheadline</label>
              <textarea className="input resize-none" rows={3} defaultValue="Nigeria's most trusted job portal — find verified vacancies updated daily across Lagos, Abuja, Port Harcourt and all 36 states." />
            </div>
            <div className="pt-4 flex gap-3">
              <button className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0">
                <Save size={16} /> Save Changes
              </button>
              <button className="btn-outline !border-gray-200">
                <Eye size={16} /> Preview Site
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}