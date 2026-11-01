import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, Search, Sparkles, Zap, Lock, Crown, Plus, CheckCircle2, 
  MapPin, Briefcase, ChevronRight, AlertCircle, Trash2, Power,
  ArrowLeft, Star, Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createCandidateAlert, subscribeToMyAlerts, deleteAlert, toggleAlertStatus } from '../services/alertService'

// Import Firebase for real-time payment verification
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

const EXPERIENCE_LEVELS = ['Any Level', 'Entry level', 'Mid level', 'Senior', 'Lead', 'Executive']
const AVAILABILITY = ['Any Availability', 'Immediately', '2 weeks notice', '1 month notice']

export default function EmployerCandidateAlerts() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  // ─── REAL-TIME PREMIUM VERIFICATION ───
  const [isPremium, setIsPremium] = useState(false)
  const [verifyingPlan, setVerifyingPlan] = useState(true)

  useEffect(() => {
    if (!user) return
    
    // Listen to the user's document in real-time. 
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data()
        setIsPremium(userData.plan === 'premium' || userData.plan === 'enterprise')
      }
      setVerifyingPlan(false)
    })

    return () => unsubscribe()
  }, [user])

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form State
  const [form, setForm] = useState({
    name: '',
    mode: 'manual',
    keywords: '',
    location: '',
    experienceLevel: 'Any Level',
    availability: 'Any Availability',
    requiredSkills: '',
    excludeKeywords: '',
    frequency: 'weekly'
  })

  // Real-time listener for Alerts
  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToMyAlerts(user.uid, (data) => {
      setAlerts(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  // Helper to handle locked features
  const handleLockedFeatureClick = () => {
    if (!isPremium) {
      navigate('/employer/upgrade') 
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (alerts.length >= 1 && !isPremium) {
      setMessage({ type: 'error', text: 'Free plan is limited to 1 alert. Please upgrade to create more.' })
      return
    }
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Please provide an alert name.' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        excludeKeywords: form.excludeKeywords.split(',').map(s => s.trim()).filter(Boolean),
      }
      
      await createCandidateAlert(user.uid, payload)
      setMessage({ type: 'success', text: 'Alert created successfully! We will notify you.' })
      
      setForm({
        name: '', mode: 'manual', keywords: '', location: '', 
        experienceLevel: 'Any Level', availability: 'Any Availability', 
        requiredSkills: '', excludeKeywords: '', frequency: 'weekly'
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (verifyingPlan) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20 font-sans">
      
      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#4c1d95] pt-12 pb-24 px-4 sm:px-6">
        <div className="container-app max-w-6xl relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-6 uppercase tracking-wider">
            <Bell size={14} /> Candidate Alerts — {profile?.fullName || 'Employer'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">
            Get notified when <br/>
            <span className="text-purple-400">top candidates appear</span>
          </h1>
          
          <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                {isPremium ? <Crown size={18} className="text-purple-400" /> : <Lock size={18} className="text-purple-400" />}
              </div>
              <div>
                <p className="font-bold text-sm">{isPremium ? 'Premium Plan Active' : `Free Plan — ${alerts.length}/1 alert used`}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {isPremium ? 'Unlimited access to AI matching, instant alerts, and exclusions.' : 'Manual filters only • Weekly digest only'}
                </p>
                {!isPremium && <p className="text-[10px] text-gray-400 mt-1">Upgrade for AI Auto-Match, 3 alerts, Daily frequency (Premium) • Instant frequency (Enterprise), keyword exclusions & pause scheduling.</p>}
              </div>
            </div>
            
            {!isPremium && (
              <button 
                onClick={() => navigate('/employer/upgrade')} 
                className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold text-sm px-6 py-2.5 rounded-lg shrink-0 flex items-center gap-2 transition"
              >
                <Crown size={16} /> Upgrade — ₦29,999/mo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-6xl -mt-12 relative z-20 px-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: FORM & ALERTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* FORM CARD */}
            <div className="bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#7c3aed]" /> CREATE A NEW CANDIDATE ALERT
                </h2>

                {message.text && (
                  <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-purple-50 text-[#7c3aed]' : 'bg-red-50 text-red-600'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-6">
                  {/* Alert Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Alert Name *</label>
                    <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" placeholder="e.g. Senior Dev Lagos, Entry Accountants" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>

                  {/* Alert Mode */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Alert Mode <span className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded ml-1">AI REQUIRES PREMIUM</span></label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {/* Manual */}
                      <div onClick={() => setForm({...form, mode: 'manual'})} className={`border-2 rounded-xl p-4 cursor-pointer transition ${form.mode === 'manual' ? 'border-[#7c3aed] bg-purple-50/50' : 'border-gray-200 hover:border-purple-300'}`}>
                        <Search size={20} className={form.mode === 'manual' ? 'text-[#7c3aed]' : 'text-gray-400'} />
                        <p className="font-bold text-sm mt-2">Manual Filters</p>
                        <p className="text-[11px] text-gray-500 mt-1">Set the criteria — location, experience, availability, salary.</p>
                      </div>
                      {/* AI Auto */}
                      <div onClick={handleLockedFeatureClick} className={`border-2 rounded-xl p-4 cursor-pointer transition ${form.mode === 'ai_auto' ? 'border-[#7c3aed] bg-purple-50/50' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                        <Sparkles size={20} className={form.mode === 'ai_auto' ? 'text-[#7c3aed]' : 'text-gray-400'} />
                        <p className="font-bold text-sm mt-2 flex items-center gap-1">AI Auto-Match {!isPremium && <Lock size={12}/>}</p>
                        <p className="text-[11px] text-gray-500 mt-1">AI scores new candidates against your active job posts.</p>
                      </div>
                      {/* AI + Manual */}
                      <div onClick={handleLockedFeatureClick} className={`border-2 rounded-xl p-4 cursor-pointer transition ${form.mode === 'ai_manual' ? 'border-[#7c3aed] bg-purple-50/50' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                        <Zap size={20} className={form.mode === 'ai_manual' ? 'text-[#7c3aed]' : 'text-gray-400'} />
                        <p className="font-bold text-sm mt-2 flex items-center gap-1">AI + Manual {!isPremium && <Lock size={12}/>}</p>
                        <p className="text-[11px] text-gray-500 mt-1">Combine your filters with AI scoring.</p>
                      </div>
                    </div>
                  </div>

                  {/* Keywords & Location */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Candidate Keywords <span className="text-[9px] text-gray-400 font-normal">HIGH WEIGHT</span></label>
                      <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" placeholder="e.g. Python developer, accountant" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} />
                      <p className="text-[10px] text-gray-400 mt-1">Matched against candidate title and bio.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                      <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" placeholder="e.g. Lagos, Abuja" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                    </div>
                  </div>

                  {/* Exp & Availability */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Experience Level</label>
                      <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" value={form.experienceLevel} onChange={e => setForm({...form, experienceLevel: e.target.value})}>
                        {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Availability</label>
                      <select className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})}>
                        {AVAILABILITY.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Required Skills</label>
                    <input className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7c3aed] outline-none" placeholder="e.g. PHP, Excel, Project Management (comma-separated)" value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills: e.target.value})} />
                  </div>

                  {/* Exclude Keywords (Premium) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      Exclude Candidates with these keywords <span className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded">PREMIUM</span>
                    </label>
                    <div className="relative cursor-pointer" onClick={handleLockedFeatureClick}>
                      <input disabled={!isPremium} className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 outline-none pr-10 cursor-pointer" placeholder={isPremium ? "e.g. unpaid, junior" : "Upgrade to Premium to exclude low-fit candidates"} />
                      {!isPremium && <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Alert Frequency</label>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={handleLockedFeatureClick} className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${form.frequency === 'instant' ? 'bg-purple-50 border-[#7c3aed] text-[#7c3aed]' : 'border-gray-200 text-gray-400 opacity-60 hover:opacity-100'}`}>
                        <Zap size={14}/> Instant {!isPremium && <Lock size={12}/>}
                      </button>
                      <button type="button" onClick={handleLockedFeatureClick} className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${form.frequency === 'daily' ? 'bg-purple-50 border-[#7c3aed] text-[#7c3aed]' : 'border-gray-200 text-gray-400 opacity-60 hover:opacity-100'}`}>
                        <Bell size={14}/> Daily Digest {!isPremium && <Lock size={12}/>}
                      </button>
                      <button type="button" onClick={() => setForm({...form, frequency: 'weekly'})} className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${form.frequency === 'weekly' ? 'bg-purple-50 border-[#7c3aed] text-[#7c3aed]' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}>
                        <Briefcase size={14}/> Weekly Digest
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Daily & Instant alerts require a paid plan. Upgrade to Premium for Daily.</p>
                  </div>

                  <button type="submit" disabled={saving} className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-3.5 rounded-xl transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                    <Plus size={18}/> {saving ? 'Creating...' : 'Create Candidate Alert'}
                  </button>
                </form>
              </div>

              {/* YOUR ALERTS LIST */}
              <div className="bg-gray-50 p-6 sm:p-8">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-[#7c3aed]"/> YOUR CANDIDATE ALERTS
                </h2>
                
                {loading ? (
                  <div className="text-center py-6 text-gray-400 text-sm">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="text-gray-400" size={24} />
                    </div>
                    <p className="font-bold text-gray-700">No candidate alerts yet</p>
                    <p className="text-xs text-gray-500 mt-1">Create your first alert above — get notified the moment a matching candidate joins.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{alert.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${alert.status === 'active' ? 'bg-purple-100 text-[#7c3aed]' : 'bg-gray-100 text-gray-600'}`}>
                              {alert.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.mode === 'manual' ? 'Manual' : 'AI'} • {alert.frequency} • {alert.location || 'Any location'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => toggleAlertStatus(alert.id, alert.status)} className={`p-2 rounded-lg transition ${alert.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-[#7c3aed] hover:bg-purple-50'}`} title="Pause/Activate">
                             <Power size={18} />
                           </button>
                           <button onClick={() => deleteAlert(alert.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                             <Trash2 size={18} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR (SCORING, TIPS, UPGRADE) */}
          <div className="space-y-6">
            
            {/* Overview Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl text-gray-900">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                 <Search size={14} /> Overview
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-extrabold text-[#7c3aed]">{alerts.length}/{isPremium ? 'Unlimited' : '1'}</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">Alerts Used</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-extrabold text-[#7c3aed]">0</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">Candidates Matched</p>
                </div>
              </div>
            </div>

            {/* Premium Upgrade Sidebar Card */}
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 shadow-xl text-white">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Crown className="text-purple-400" size={18} />
              </div>
              <p className="text-3xl font-extrabold mb-6">₦29,999<span className="text-sm text-gray-400 font-normal">/mo</span></p>
              
              <ul className="space-y-4 mb-6">
                {[
                  { title: 'Daily Frequency (Premium)', desc: 'Get candidates delivered every day' },
                  { title: 'Instant Frequency (Enterprise only)', desc: 'Be notified the moment a matching candidate registers' },
                  { title: '3 Alerts (up to 3)', desc: 'Watch multiple roles, locations, and skill levels' },
                  { title: 'AI Auto-Match', desc: 'AI scores new candidates against your published job posts' },
                  { title: 'Keyword Exclusions', desc: 'Hard-reject low-fit candidates before they hit your inbox' }
                ].map((feat, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">{feat.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => navigate('/employer/upgrade')}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition"
              >
                Upgrade Plan
              </button>
            </div>

            {/* How Scoring Works */}
            <div className="bg-white rounded-2xl p-6 shadow-xl text-gray-900">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                 <CheckCircle2 size={14} /> How Candidate Scoring Works
              </h3>
              <p className="text-xs text-gray-600 mb-4">Your score is proportional — only criteria you actually set count. An alert with just the keywords can still score 100% if the candidate title matches perfectly.</p>
              
              <div className="space-y-3">
                {[
                  { label: 'AI match vs job posts (Premium)', val: '+40' },
                  { label: 'Keywords in title / bio', val: '+25' },
                  { label: 'Required skills (profile skills)', val: '+20' },
                  { label: 'Location match', val: '+15' },
                  { label: 'Experience level match', val: '+10' },
                  { label: 'Availability match', val: '+10' },
                  { label: 'Salary expectation vs your max', val: '+10' }
                ].map((score, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{score.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7c3aed]" style={{ width: score.val === '+40' ? '100%' : score.val === '+25' ? '60%' : '40%' }} />
                      </div>
                      <span className="font-bold text-[#7c3aed] w-6 text-right">{score.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4">Only criteria you set contribute to the denominator — a keywords-only alert is scored out of 25, not 100.</p>
            </div>

            {/* Tips for better results */}
            <div className="bg-white rounded-2xl p-6 shadow-xl text-gray-900">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                 <Sparkles size={14} /> Tips for Better Results
              </h3>
              <ul className="space-y-4">
                {[
                  { title: 'Use AI + Manual mode', desc: 'AI scores candidates against your actual job requirements — no filter guessing needed.' },
                  { title: 'Use Instant for scarce roles (Enterprise)', desc: 'Senior developers and niche specialists get hired fast. Beat other employers to their inbox.' },
                  { title: 'Add a location filter', desc: 'Narrows your pool to attainable candidates in the right state.' },
                  { title: 'Keep job posts published', desc: 'AI Auto-Match needs active job posts to score against.' }
                ].map((tip, i) => (
                  <li key={i}>
                    <p className="text-xs font-bold text-gray-800">{tip.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PLACEHOLDER UPGRADE PAGE ───
// Added at the bottom of the file so you can export it for the router
export function EmployerUpgradePlaceholder() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)

  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-12 px-4 sm:px-6">
      <div className="container-app max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
          <ArrowLeft size={16} /> Back
        </button>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Upgrade your hiring power</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Choose the plan that fits your company's hiring needs. Unlock AI matching, instant alerts, and more.</p>
        </div>

        {success && (
          <div className="bg-green-500/20 text-green-400 p-4 rounded-xl text-center mb-8 border border-green-500/30">
            Payment integration will go here! Once connected, your account will instantly upgrade.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 text-sm mb-6">For casual hiring</p>
            <p className="text-4xl font-extrabold mb-6">₦0</p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-sm text-gray-300"><Check size={16} className="text-gray-500"/> 1 active job</li>
              <li className="flex gap-2 text-sm text-gray-300"><Check size={16} className="text-gray-500"/> Basic manual alerts</li>
            </ul>
            <button disabled className="w-full bg-white/10 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed">
              Current Plan
            </button>
          </div>

          {/* Premium Plan (Highlighted) */}
          <div className="bg-gradient-to-b from-[#7c3aed]/20 to-[#0f172a] border-2 border-[#7c3aed] rounded-2xl p-6 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-purple-900/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7c3aed] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star size={12} fill="currentColor"/> MOST POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-purple-300 text-sm mb-6">For growing teams</p>
            <p className="text-4xl font-extrabold mb-6">₦29,999<span className="text-sm text-gray-400 font-normal">/mo</span></p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-sm text-white"><Check size={16} className="text-[#7c3aed]"/> Unlimited active jobs</li>
              <li className="flex gap-2 text-sm text-white"><Check size={16} className="text-[#7c3aed]"/> 3 AI Auto-Match alerts</li>
              <li className="flex gap-2 text-sm text-white"><Check size={16} className="text-[#7c3aed]"/> Daily frequency</li>
              <li className="flex gap-2 text-sm text-white"><Check size={16} className="text-[#7c3aed]"/> Keyword exclusions</li>
            </ul>
            <button onClick={() => setSuccess(true)} className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-3 rounded-xl transition">
              Upgrade Now
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-gray-400 text-sm mb-6">For large organizations</p>
            <p className="text-4xl font-extrabold mb-6">Custom</p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-sm text-gray-300"><Check size={16} className="text-gray-500"/> Instant alerts</li>
              <li className="flex gap-2 text-sm text-gray-300"><Check size={16} className="text-gray-500"/> Unlimited alerts</li>
              <li className="flex gap-2 text-sm text-gray-300"><Check size={16} className="text-gray-500"/> Dedicated support</li>
            </ul>
            <button onClick={() => setSuccess(true)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}