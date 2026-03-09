const express = require('express')
const router = express.Router()
const {
  sendInvite,
  validateToken,
  acceptInvite,
  getPendingInvites,
  cancelInvite,
} = require('../controllers/inviteController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

// Protected — must be defined BEFORE /:token to avoid route conflict
router.post(
  '/',
  verifyToken,
  requireRole('owner', 'admin'),
  scopeToTenant,
  mustChangePassword,
  sendInvite
)

router.get(
  '/pending',
  verifyToken,
  requireRole('owner', 'admin'),
  scopeToTenant,
  mustChangePassword,
  getPendingInvites
)

router.delete(
  '/:id',
  verifyToken,
  requireRole('owner', 'admin'),
  scopeToTenant,
  mustChangePassword,
  cancelInvite
)

// Public — token routes AFTER all static routes
router.get('/:token', validateToken)
router.post('/:token/accept', acceptInvite)

module.exports = router