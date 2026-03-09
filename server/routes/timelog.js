const express = require('express')
const router = express.Router()
const {
  timeIn,
  startBreak,
  endBreak,
  timeOut,
  updateNote,
  editLog,
  getToday,
  getHistory,
  exportCSV,
} = require('../controllers/timelogController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [
  verifyToken,
  requireRole('employee', 'admin', 'owner'),
  scopeToTenant,
  mustChangePassword,
]

router.post('/in', ...protect, timeIn)
router.post('/break/start', ...protect, startBreak)
router.post('/break/end', ...protect, endBreak)
router.post('/out', ...protect, timeOut)
router.patch('/:logId/note', ...protect, updateNote)
router.patch('/:logId/edit', ...protect, editLog)
router.get('/today', ...protect, getToday)
router.get('/history', ...protect, getHistory)
router.get('/export/csv', ...protect, exportCSV)

module.exports = router