import api from './axios'
import useSessionStore from '../store/sessionStore'

const tz = () => useSessionStore.getState().timezone

export const timeIn = () => api.post('/api/timelog/in', { timezone: tz() })
export const startBreak = () => api.post('/api/timelog/break/start', { timezone: tz() })
export const endBreak = () => api.post('/api/timelog/break/end', { timezone: tz() })
export const timeOut = () => api.post('/api/timelog/out', { timezone: tz() })
export const updateNote = (logId, note) => api.patch(`/api/timelog/${logId}/note`, { note })
export const editLog = (logId, data) => api.patch(`/api/timelog/${logId}/edit`, data)
export const getToday = () => api.get('/api/timelog/today', { params: { timezone: tz() } })
export const getHistory = (params) => api.get('/api/timelog/history', { params })
export const exportCSV = (params) =>
  api.get('/api/timelog/export/csv', {
    params: { ...params, timezone: tz() },
    responseType: 'blob',
  })