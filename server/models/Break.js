const mongoose = require('mongoose')

const breakSchema = new mongoose.Schema({
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
  breakStart: {
    type: Date,
    required: true,
  },
  breakEnd: {
    type: Date,
    default: null,
  },
})

module.exports = mongoose.model('Break', breakSchema)