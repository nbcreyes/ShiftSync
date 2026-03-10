const express = require('express')
const router = express.Router()
const {
  getMyBalance,
  getUserBalance,
  getAllBalances,
  setUserBalance,
} = require('../controllers/leaveBalanceController')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const scopeToTenant = require('../middleware/scopeToTenant')
const mustChangePassword = require('../middleware/mustChangePassword')

const protect = [verifyToken, scopeToTenant, mustChangePassword]
const adminProtect = [verifyToken, requireRole('admin', 'owner'), scopeToTenant, mustChangePassword]
const ownerOnly = [verifyToken, requireRole('owner'), scopeToTenant, mustChangePassword]

router.get('/my', ...protect, getMyBalance)
router.get('/', ...adminProtect, getAllBalances)
router.get('/:userId', ...adminProtect, getUserBalance)
router.patch('/:userId', ...ownerOnly, setUserBalance)

module.exports = router