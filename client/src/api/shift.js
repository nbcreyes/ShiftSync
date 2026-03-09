import api from './axios'

export const getAllSchedules = () => api.get('/api/shift')
export const getSchedule = (userId) => api.get(`/api/shift/${userId}`)
export const setSchedule = (userId, data) => api.put(`/api/shift/${userId}`, data)
export const deleteSchedule = (userId) => api.delete(`/api/shift/${userId}`)
export const getFlags = (params) => api.get('/api/shift/flags', { params })