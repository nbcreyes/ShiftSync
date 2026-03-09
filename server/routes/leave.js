const express = require('express')
const router = express.Router()
const {
  submitLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  reviewLeave,
} = require('../controllers/leaveController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const employeeProtect = [
  verifyToken,
  requireRole('employee', 'admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

const adminOnly = [
  verifyToken,
  requireRole('admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

// Employee
router.post('/', ...employeeProtect, submitLeave)
router.get('/my', ...employeeProtect, getMyLeaves)
router.delete('/:id', ...employeeProtect, cancelLeave)

// Admin/Owner
router.get('/', ...adminOnly, getAllLeaves)
router.patch('/:id/review', ...adminOnly, reviewLeave)

module.exports = router