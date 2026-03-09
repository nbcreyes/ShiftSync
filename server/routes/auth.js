const express = require('express')
const router = express.Router()
const {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  updateProfile,
} = require('../controllers/authController')
const verifyToken = require('../middleware/verifyToken')

// Public
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)

// Protected
router.get('/me', verifyToken, getMe)
router.post('/change-password', verifyToken, changePassword)
router.patch('/profile', verifyToken, updateProfile)

module.exports = router