const mongoose = require('mongoose')

const leaveBalanceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  balances: {
    vacation: { allowed: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
    sick:     { allowed: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
    personal: { allowed: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
    unpaid:   { allowed: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
    other:    { allowed: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

leaveBalanceSchema.index({ tenantId: 1, userId: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema)