import api from './axios'

export const getAuditLogs = (params) => api.get('/api/audit', { params })