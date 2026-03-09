const express = require('express')
const router = express.Router()
const {
  setSchedule,
  getSchedule,
  deleteSchedule,
  getAllSchedules,
  getFlags,
  getMyFlags,
} = require('../controllers/shiftController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const adminOnly = [
  verifyToken,
  requireRole('admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

const employeeProtect = [
  verifyToken,
  requireRole('employee', 'admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

// Employee
router.get('/my-flags', ...employeeProtect, getMyFlags)

// Admin/Owner
router.get('/', ...adminOnly, getAllSchedules)
router.get('/flags', ...adminOnly, getFlags)
router.get('/:userId', ...adminOnly, getSchedule)
router.put('/:userId', ...adminOnly, setSchedule)
router.delete('/:userId', ...adminOnly, deleteSchedule)

module.exports = router