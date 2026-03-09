const express = require('express')
const router = express.Router()
const {
  createRemark,
  replyToRemark,
  resolveRemark,
  getMyRemarks,
  getAllRemarks,
  getRemarkById,
} = require('../controllers/remarkController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [verifyToken, scopeToTenant, mustChangePassword]
const adminOnly = [verifyToken, requireRole('admin', 'owner'), scopeToTenant, mustChangePassword]

// Employee
router.get('/my', ...protect, getMyRemarks)

// Admin + Owner
router.get('/', ...adminOnly, getAllRemarks)
router.get('/:remarkId', ...protect, getRemarkById)
router.post('/:logId', ...adminOnly, createRemark)
router.post('/:remarkId/reply', ...protect, replyToRemark)
router.patch('/:remarkId/resolve', ...adminOnly, resolveRemark)

module.exports = router