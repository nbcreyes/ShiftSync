import api from './axios'

export const validateToken = (token) => api.get(`/api/invite/${token}`)
export const acceptInvite = (token, password) =>
  api.post(`/api/invite/${token}/accept`, { password })
export const sendInvite = (data) => api.post('/api/invite', data)
export const getPendingInvites = () => api.get('/api/invite/pending')
export const cancelInvite = (id) => api.delete(`/api/invite/${id}`)