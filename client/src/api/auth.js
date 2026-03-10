import api from './axios'

export const register = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)
export const logout = () => api.post('/api/auth/logout')
export const getMe = () => api.get('/api/auth/me')
export const changePassword = (data) => api.post('/api/auth/change-password', data)
export const updateProfile = (data) => api.patch('/api/auth/profile', data)
export const forgotPassword = (data) => api.post('/api/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/api/auth/reset-password', data)
export const getNotificationPrefs = () => api.get('/api/auth/notification-prefs')
export const updateNotificationPrefs = (data) => api.patch('/api/auth/notification-prefs', data)