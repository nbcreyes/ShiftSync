const express = require('express')
const router = express.Router()
const {
  submitRequest,
  getMyRequests,
  getPendingRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/manualLogController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [verifyToken, scopeToTenant, mustChangePassword]
const adminOnly = [verifyToken, requireRole('admin', 'owner'), scopeToTenant, mustChangePassword]

// Employee
router.post('/', ...protect, submitRequest)
router.get('/my', ...protect, getMyRequests)

// Admin + Owner
router.get('/', ...adminOnly, getPendingRequests)
router.patch('/:id/approve', ...adminOnly, approveRequest)
router.patch('/:id/reject', ...adminOnly, rejectRequest)

module.exports = router