import api from './axios'

export const submitManualLog = (data) => api.post('/api/manual-log', data)
export const getMyManualRequests = () => api.get('/api/manual-log/my')
export const getPendingRequests = (params) => api.get('/api/manual-log', { params })
export const approveRequest = (id, adminNote) =>
  api.patch(`/api/manual-log/${id}/approve`, { adminNote })
export const rejectRequest = (id, adminNote) =>
  api.patch(`/api/manual-log/${id}/reject`, { adminNote })