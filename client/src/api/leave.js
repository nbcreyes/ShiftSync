import api from './axios'

export const submitLeave = (data) => api.post('/api/leave', data)
export const getMyLeaves = () => api.get('/api/leave/my')
export const cancelLeave = (id) => api.delete(`/api/leave/${id}`)
export const getAllLeaves = (params) => api.get('/api/leave', { params })
export const reviewLeave = (id, data) => api.patch(`/api/leave/${id}/review`, data)