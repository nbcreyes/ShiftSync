const mongoose = require('mongoose')

const threadMessageSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'employee'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const remarkSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  logId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeLog',
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminNote: {
    type: String,
    required: true,
    trim: true,
  },
  thread: [threadMessageSchema],
  employeeEdited: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open',
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Remark', remarkSchema)