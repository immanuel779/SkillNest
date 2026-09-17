import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Inbox, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/notificationService'

const ICONS = {
  new_application: '📩',
  application_status: '📊',
  message: '💬',
  interview: '📅',
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeNotifications(user.uid, (list) => {
      setItems(list)
      setLoading(false)
    })
    return unsub
  }, [user])

  const unread = items.filter((n) => !n.isRead)

  const open = (n) => {
    markNotificationRead(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="container-app py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unread.length} unread of {items.length}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllNotificationsRead(user.uid)}
            className="btn-outline"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-1">
            We'll let you know when something happens.
          </p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {items.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-3 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition ${
                !n.isRead ? 'bg-brand-50/40' : ''
              }`}
            >
              <button
                onClick={() => open(n)}
                className="flex-1 flex items-start gap-3 text-left min-w-0"
              >
                <span className="text-2xl shrink-0">{ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'} text-gray-900`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />}
                  </div>
                  {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
                  {n.createdAt?.seconds && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(n.createdAt.seconds * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => deleteNotification(n.id)}
                className="shrink-0 text-gray-300 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}