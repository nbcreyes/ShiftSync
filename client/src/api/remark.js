import api from './axios'

export const createRemark = (logId, adminNote) =>
  api.post(`/api/remark/${logId}`, { adminNote })
export const replyToRemark = (remarkId, message) =>
  api.post(`/api/remark/${remarkId}/reply`, { message })
export const resolveRemark = (remarkId) =>
  api.patch(`/api/remark/${remarkId}/resolve`)
export const getMyRemarks = () => api.get('/api/remark/my')
export const getAllRemarks = (params) => api.get('/api/remark', { params })
export const getRemarkById = (remarkId) => api.get(`/api/remark/${remarkId}`)