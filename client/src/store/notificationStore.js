import { create } from 'zustand'
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
} from '../api/notification'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const res = await getMyNotifications()
      const notifications = res.data
      const unreadCount = notifications.filter((n) => !n.read).length
      set({ notifications, unreadCount })
    } catch (err) {
      console.error('[notifications] fetch failed:', err.message)
    } finally {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount()
      set({ unreadCount: res.data.count })
    } catch (err) {
      console.error('[notifications] unread count failed:', err.message)
    }
  },

  markAsRead: async (id) => {
    try {
      await markAsReadApi(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (err) {
      console.error('[notifications] mark as read failed:', err.message)
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllAsReadApi()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.error('[notifications] mark all as read failed:', err.message)
    }
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))

export default useNotificationStore