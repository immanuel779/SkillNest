import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService'

const ICONS = {
  new_application: '📩',
  application_status: '📊',
  message: '💬',
  interview: '📅',
  admin_new_application: '📥',
  admin_status_change: '📊',
  admin_new_job: '💼',
  admin_new_user: '👤',
  system: '🔔',
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications(user.uid, setItems)
    return unsub
  }, [user])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = items.filter((n) => !n.isRead).length

  const handleOpen = (n) => {
    markNotificationRead(n.id).catch(() => {})
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const handleMarkAll = async () => {
    if (!user) return
    await markAllNotificationsRead(user.uid)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:text-brand-700 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-brand-700 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Inbox size={28} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              items.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex gap-3 ${
                    !n.isRead ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <div className="text-xl shrink-0">{ICONS[n.type] || '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p
                        className={`text-sm ${
                          !n.isRead ? 'font-bold' : 'font-medium'
                        } text-gray-900`}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    {n.createdAt?.seconds && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt.seconds * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-brand-700 py-3 border-t border-gray-100 hover:bg-gray-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}