const mongoose = require('mongoose')

const shiftScheduleSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Expected start time as "HH:mm" in 24hr format e.g. "09:00"
  startTime: {
    type: String,
    required: true,
  },
  // Expected end time as "HH:mm" e.g. "18:00"
  endTime: {
    type: String,
    required: true,
  },
  // Work days: 0 = Sunday, 1 = Monday ... 6 = Saturday
  workDays: {
    type: [Number],
    required: true,
    default: [1, 2, 3, 4, 5], // Mon–Fri
  },
  // Late tolerance in minutes
  lateTolerance: {
    type: Number,
    default: 5,
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

shiftScheduleSchema.index({ tenantId: 1, userId: 1 }, { unique: true })

module.exports = mongoose.model('ShiftSchedule', shiftScheduleSchema)