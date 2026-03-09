const express = require('express')
const router = express.Router()
const { getAuditLogs } = require('../controllers/auditController')
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

router.get('/', ...adminOnly, getAuditLogs)

module.exports = router