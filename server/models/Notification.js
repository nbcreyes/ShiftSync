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
      'remark_created',      // admin flagged employee's log
      'remark_reply',        // someone replied to a thread
      'remark_resolved',     // admin resolved a remark
      'invite_accepted',     // invitee accepted invite
      'manual_log_requested',
      'manual_log_approved',
      'manual_log_rejected',
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
  // Optional references for deep-linking
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
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for fast unread count queries
notificationSchema.index({ recipientId: 1, read: 1 })
notificationSchema.index({ tenantId: 1, recipientId: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)