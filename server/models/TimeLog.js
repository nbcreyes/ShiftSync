const mongoose = require('mongoose')

const timeLogSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: true,
  },
  timeIn: {
    type: Date,
    required: true,
  },
  timeOut: {
    type: Date,
    default: null,
  },
  employeeNote: {
    type: String,
    trim: true,
    default: null,
  },
  totalBreakMins: {
    type: Number,
    default: 0,
  },
  overtime: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['clean', 'remarked', 'resolved'],
    default: 'clean',
  },
  isManual: {
    type: Boolean,
    default: false,
  },
  manualRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManualLogRequest',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Enforce one active session per user per day
timeLogSchema.index({ tenantId: 1, userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('TimeLog', timeLogSchema)