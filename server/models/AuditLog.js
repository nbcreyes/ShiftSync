const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: [
      'log_edited',
      'log_flagged',
      'log_bulk_flagged',
      'leave_approved',
      'leave_rejected',
      'shift_set',
      'shift_deleted',
      'member_role_changed',
      'member_deactivated',
      'member_activated',
      'member_deleted',
      'workspace_updated',
      'manual_log_approved',
      'manual_log_rejected',
    ],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['timelog', 'leave', 'shift', 'user', 'workspace', 'manual_log'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  description: {
    type: String,
    required: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

auditLogSchema.index({ tenantId: 1, createdAt: -1 })
auditLogSchema.index({ tenantId: 1, performedBy: 1 })
auditLogSchema.index({ tenantId: 1, action: 1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)