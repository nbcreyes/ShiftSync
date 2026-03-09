import api from './axios'

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const getStats = () => api.get('/api/superuser/stats')
export const getWorkspaces = () => api.get('/api/superuser/workspaces')
export const getWorkspaceById = (id) => api.get(`/api/superuser/workspaces/${id}`)
export const getAllUsers = (params) => api.get('/api/superuser/users', { params })
export const exportCSV = (params) =>
  api.get('/api/superuser/export/csv', {
    params: { ...params, timezone: tz() },
    responseType: 'blob',
  })