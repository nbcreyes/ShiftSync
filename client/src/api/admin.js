import api from './axios'
import useSessionStore from '../store/sessionStore'

const tz = () => useSessionStore.getState().timezone

export const getUsers = () => api.get('/api/admin/users')
export const getWorkspace = () => api.get('/api/admin/workspace')
export const updateRole = (id, role) => api.patch(`/api/admin/users/${id}/role`, { role })
export const deactivateUser = (id) => api.patch(`/api/admin/users/${id}/deactivate`)
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`)
export const getUserTimelog = (userId, params) =>
  api.get(`/api/admin/timelog/${userId}`, { params })
export const getLiveBoard = () =>
  api.get('/api/admin/live', { params: { timezone: tz() } })
export const exportCSV = (params) =>
  api.get('/api/admin/export/csv', {
    params: { ...params, timezone: tz() },
    responseType: 'blob',
  })
export const updateWorkspace = (data) => api.patch('/api/admin/workspace', data)
export const getSummaryReport = (params) =>
  api.get('/api/admin/reports/summary', { params: { ...params, timezone: tz() } })
export const getDepartmentReport = (params) =>
  api.get('/api/admin/reports/department', { params: { ...params, timezone: tz() } })
export const adminEditLog = (logId, data) =>
  api.patch(`/api/admin/timelog/${logId}/edit`, data)
export const getMemberDetail = (id) => api.get(`/api/admin/members/${id}`)