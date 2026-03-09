const express = require('express')
const router = express.Router()
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController')
const verifyToken = require('../middleware/verifyToken')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [verifyToken, scopeToTenant, mustChangePassword]

router.get('/', ...protect, getMyNotifications)
router.get('/unread-count', ...protect, getUnreadCount)
router.patch('/read-all', ...protect, markAllAsRead)
router.patch('/:id/read', ...protect, markAsRead)

module.exports = router