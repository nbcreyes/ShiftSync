const express = require('express')
const router = express.Router()
const {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [verifyToken, scopeToTenant, mustChangePassword]
const ownerOnly = [verifyToken, requireRole('owner'), scopeToTenant, mustChangePassword]

router.get('/active', ...protect, getActiveAnnouncements)
router.get('/', ...ownerOnly, getAllAnnouncements)
router.post('/', ...ownerOnly, createAnnouncement)
router.delete('/:id', ...ownerOnly, deleteAnnouncement)

module.exports = router