const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'remark_created',
      'remark_reply',
      'remark_resolved',
      'invite_accepted',
      'manual_log_requested',
      'manual_log_approved',
      'manual_log_rejected',
      'leave_requested',
      'leave_approved',
      'leave_rejected',
      'overtime_alert',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  remarkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Remark',
    default: null,
  },
  logId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeLog',
    default: null,
  },
  leaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveRequest',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

notificationSchema.index({ recipientId: 1, read: 1 })
notificationSchema.index({ tenantId: 1, recipientId: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)