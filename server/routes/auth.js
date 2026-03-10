const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  getNotificationPrefs,
  updateNotificationPrefs,
} = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected
router.get("/me", verifyToken, getMe);
router.post("/change-password", verifyToken, changePassword);
router.patch("/profile", verifyToken, updateProfile);
router.get('/notification-prefs', verifyToken, getNotificationPrefs)
router.patch('/notification-prefs', verifyToken, updateNotificationPrefs)

module.exports = router;
