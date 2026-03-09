const express = require('express')
const router = express.Router()
const {
  setSchedule,
  getSchedule,
  deleteSchedule,
  getAllSchedules,
  getFlags,
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

// All shift routes are admin/owner only
router.get('/', ...adminOnly, getAllSchedules)
router.get('/flags', ...adminOnly, getFlags)
router.get('/:userId', ...adminOnly, getSchedule)
router.put('/:userId', ...adminOnly, setSchedule)
router.delete('/:userId', ...adminOnly, deleteSchedule)

module.exports = router