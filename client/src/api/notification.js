import api from './axios'

export const getMyNotifications = () => api.get('/api/notification')
export const getUnreadCount = () => api.get('/api/notification/unread-count')
export const markAsRead = (id) => api.patch(`/api/notification/${id}/read`)
export const markAllAsRead = () => api.patch('/api/notification/read-all')