const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    default: null,
  },
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, default: null },
  role: {
    type: String,
    enum: ["superuser", "owner", "admin", "employee"],
    required: true,
  },
  department: { type: String, trim: true, default: null },
  avatarUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  notificationPrefs: {
    emailOnLeaveReviewed: { type: Boolean, default: true },
    emailOnRemarkCreated: { type: Boolean, default: true },
    emailOnRemarkReply: { type: Boolean, default: true },
    emailOnRemarkResolved: { type: Boolean, default: true },
    emailOnManualLogReview: { type: Boolean, default: true },
    emailOnOvertime: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
