import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Users, Loader2, Inbox, Plus, MessageSquare, Sparkles, Hash, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  subscribeMyGroups,
  ensureGeneralMembership,
  subscribeMyInvites,
  acceptGroupInvite,
  declineGroupInvite,
} from '../services/communityGroupService'
import GroupSidebar from '../components/community/GroupSidebar'
import CreateGroupModal from '../components/community/CreateGroupModal'
import InvitesBanner from '../components/community/InvitesBanner'
import ForumChat from '../components/community/ForumChat'

export default function Community() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [groups, setGroups] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  
  const activeId = searchParams.get('g')
  const [showSidebarMobile, setShowSidebarMobile] = useState(!activeId)

  const activeGroup = groups.find((g) => g.id === activeId) || null

  // Ensure user is in the general channel + subscribe to groups
  useEffect(() => {
    if (!user) return
    ensureGeneralMembership(user.uid).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeMyGroups(user.uid, (list) => {
      setGroups(list)
      setLoading(false)
      // If nothing selected, default to general
      if (!activeId && list.length > 0) {
        const general = list.find((g) => g.id === 'general') || list[0]
        setSearchParams({ g: general.id }, { replace: true })
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Invites
  useEffect(() => {
    if (!user) return
    const unsub = subscribeMyInvites(user.uid, setInvites)
    return unsub
  }, [user])

  // Handle mobile sidebar
  useEffect(() => {
    if (activeId) setShowSidebarMobile(false)
  }, [activeId])

  const handleSelectGroup = (id) => {
    setSearchParams({ g: id })
  }

  const handleAcceptInvite = async (invite) => {
    try {
      const groupId = await acceptGroupInvite(invite.id)
      toast.success('Joined group', invite.groupName)
      setSearchParams({ g: groupId })
    } catch (err) {
      toast.error('Could not join', err.message)
    }
  }

  const handleDeclineInvite = async (invite) => {
    try {
      await declineGroupInvite(invite.id)
      toast.info('Invite declined')
    } catch (err) {
      toast.error('Could not decline', err.message)
    }
  }

  // ─── UNAUTHENTICATED STATE ───
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-[#7c3aed]" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Join the Community</h1>
          <p className="text-gray-500 mb-8 text-sm">
            SkillNest Community connects top Nigerian job seekers and employers. Sign in to participate in discussions, join groups, and network.
          </p>
          <Link to="/login" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 w-full !py-3">
            Sign in to your account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-[#1a1c23] text-white pt-10 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="container-app relative max-w-6xl z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7c3aed] mb-3 uppercase tracking-wider">
                <MessageSquare size={14} /> SkillNest Network
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                Community Hub
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-lg">
                Connect, share insights, and chat with other professionals and employers in real-time.
              </p>
            </div>
            
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-2.5 !px-6 shadow-lg shadow-[#7c3aed]/20 flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
            >
              <Plus size={18} /> Create New Group
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CHAT CONTAINER ─── */}
      <div className="container-app max-w-6xl -mt-12 relative z-20 px-4 sm:px-6">
        
        {/* Invites Banner - Floating above chat */}
        {invites.length > 0 && (
          <div className="mb-4">
            <InvitesBanner
              invites={invites}
              onAccept={handleAcceptInvite}
              onDecline={handleDeclineInvite}
            />
          </div>
        )}

        {loading ? (
          /* Advanced Loading Skeleton */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-[calc(100vh-16rem)] min-h-[600px] flex items-center justify-center">
             <div className="flex flex-col items-center gap-3 text-[#7c3aed]">
               <Loader2 size={32} className="animate-spin" />
               <p className="text-sm font-semibold text-gray-500 animate-pulse">Loading your workspace...</p>
             </div>
          </div>
        ) : (
          /* Main App-like Chat Interface */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-[320px_1fr] h-[calc(100vh-16rem)] min-h-[600px]">
              
              {/* SIDEBAR (Desktop) & MAIN CHAT (Mobile toggle) */}
              <aside
                className={`border-r border-gray-100 overflow-y-auto w-full min-w-0 bg-white ${
                  showSidebarMobile ? 'block' : 'hidden lg:block'
                }`}
              >
                {/* Sidebar Header (Optional visual improvement) */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                   <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                     <Hash size={14} /> Your Channels
                   </h2>
                </div>
                
                <GroupSidebar
                  groups={groups}
                  activeId={activeId}
                  onSelect={handleSelectGroup}
                />
              </aside>

              {/* CHAT AREA */}
              <section
                className={`flex-col w-full min-w-0 bg-[#fafafa] ${
                  showSidebarMobile ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {activeGroup ? (
                  <ForumChat
                    group={activeGroup}
                    user={user}
                    profile={profile}
                    onBack={() => setShowSidebarMobile(true)}
                  />
                ) : (
                  /* Advanced Empty State */
                  <div className="flex-1 flex items-center justify-center p-8 text-center h-full">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
                        <Inbox size={40} className="text-[#7c3aed]" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">No Channel Selected</h2>
                      <p className="text-sm text-gray-500 mb-6">
                        Select a group from the sidebar to start chatting, or create your own private group to collaborate.
                      </p>
                      
                      <button 
                        onClick={() => setShowCreate(true)}
                        className="btn-outline !border-[#7c3aed] !text-[#7c3aed] hover:!bg-purple-50 inline-flex items-center gap-2"
                      >
                        <Sparkles size={16} /> Create a Group
                      </button>
                    </div>
                  </div>
                )}
              </section>

            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <CreateGroupModal
          user={user}
          profile={profile}
          onClose={() => setShowCreate(false)}
          onCreated={(groupId) => {
            setShowCreate(false)
            setSearchParams({ g: groupId })
          }}
        />
      )}
    </div>
  )
}