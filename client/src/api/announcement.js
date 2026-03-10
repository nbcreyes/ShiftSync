import api from './axios'

export const getActiveAnnouncements = () => api.get('/api/announcement/active')
export const getAllAnnouncements = () => api.get('/api/announcement')
export const createAnnouncement = (data) => api.post('/api/announcement', data)
export const deleteAnnouncement = (id) => api.delete(`/api/announcement/${id}`)