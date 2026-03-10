import api from './axios'

export const getPendingCounts = () => api.get('/api/admin/pending-counts')