import api from './axios'

export const getMyBalance = (year) =>
  api.get('/api/leave-balance/my', { params: { year } })

export const getAllBalances = (year) =>
  api.get('/api/leave-balance', { params: { year } })

export const getUserBalance = (userId, year) =>
  api.get(`/api/leave-balance/${userId}`, { params: { year } })

export const setUserBalance = (userId, data) =>
  api.patch(`/api/leave-balance/${userId}`, data)