const express = require('express')
const router = express.Router()
const {
  getStats,
  getWorkspaces,
  getWorkspaceById,
  getAllUsers,
  exportCSV,
} = require('../controllers/superuserController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')

const superProtect = [verifyToken, requireRole('superuser')]

router.get('/stats', ...superProtect, getStats)
router.get('/workspaces', ...superProtect, getWorkspaces)
router.get('/workspaces/:id', ...superProtect, getWorkspaceById)
router.get('/users', ...superProtect, getAllUsers)
router.get('/export/csv', ...superProtect, exportCSV)

module.exports = router