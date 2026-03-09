const express = require('express')
const router = express.Router()
const {
  getUsers,
  getWorkspace,
  updateRole,
  deactivateUser,
  deleteUser,
  getUserTimelog,
  getLiveBoard,
  exportCSV,
  updateWorkspace,
  getSummaryReport,
  getDepartmentReport,
  adminEditLog,
} = require('../controllers/adminController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const adminProtect = [
  verifyToken,
  requireRole('admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

const ownerOnly = [
  verifyToken,
  requireRole('owner'),
  scopeToTenant,
  mustChangePassword,
]

// Admin + Owner
router.get('/users', ...adminProtect, getUsers)
router.get('/timelog/:userId', ...adminProtect, getUserTimelog)
router.get('/live', ...adminProtect, getLiveBoard)
router.get('/export/csv', ...adminProtect, exportCSV)
router.get('/workspace', ...adminProtect, getWorkspace)
router.get('/reports/summary', ...adminProtect, getSummaryReport)
router.get('/reports/department', ...adminProtect, getDepartmentReport)
router.patch('/timelog/:logId/edit', ...adminProtect, adminEditLog)

// Owner only
router.patch('/users/:id/role', ...ownerOnly, updateRole)
router.patch('/users/:id/deactivate', ...ownerOnly, deactivateUser)
router.delete('/users/:id', ...ownerOnly, deleteUser)
router.patch('/workspace', ...ownerOnly, updateWorkspace)

module.exports = router