const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

announcementSchema.index({ tenantId: 1, createdAt: -1 })

module.exports = mongoose.model('Announcement', announcementSchema)