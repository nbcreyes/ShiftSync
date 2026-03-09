const AuditLog = require('../models/AuditLog')
const User = require('../models/User')

// ─── Create Audit Log (internal helper) ──────────────────────────────────────
const createAuditLog = async (data) => {
  try {
    await AuditLog.create(data)
  } catch (err) {
    console.error('[audit] failed to create:', err.message)
  }
}

// ─── Get Audit Logs (admin/owner) ─────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, performedBy } = req.query

    const query = { tenantId: req.tenantId }
    if (action) query.action = action
    if (performedBy) query.performedBy = performedBy

    const total = await AuditLog.countDocuments(query)
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('performedBy', 'name email role')
      .populate('targetUser', 'name email')

    return res.status(200).json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GetAuditLogs error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { createAuditLog, getAuditLogs }