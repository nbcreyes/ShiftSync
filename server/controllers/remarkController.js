const Remark = require('../models/Remark')
const TimeLog = require('../models/TimeLog')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { sendRemarkCreatedEmail, sendRemarkReplyEmail, sendRemarkResolvedEmail } = require('../utils/email')

const notify = async (data) => {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message)
  }
}

// ─── Create Remark ────────────────────────────────────────────────────────────
const createRemark = async (req, res) => {
  try {
    const { adminNote } = req.body
    const { logId } = req.params

    if (!adminNote) {
      return res.status(400).json({ message: 'Admin note is required' })
    }

    const log = await TimeLog.findOne({ _id: logId, tenantId: req.tenantId })
    if (!log) return res.status(404).json({ message: 'Time log not found' })
    if (log.status === 'remarked') {
      return res.status(409).json({ message: 'This log has already been remarked' })
    }

    const remark = await Remark.create({
      tenantId: req.tenantId,
      logId,
      adminId: req.user._id,
      adminNote,
      thread: [{ authorId: req.user._id, role: req.user.role, message: adminNote }],
    })

    log.status = 'remarked'
    await log.save()

    const employee = await User.findById(log.userId)
    if (employee) {
      await notify({
        tenantId: req.tenantId,
        recipientId: employee._id,
        type: 'remark_created',
        title: 'New remark on your log',
        message: `${req.user.name} flagged your log for ${new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}: "${adminNote.slice(0, 80)}${adminNote.length > 80 ? '…' : ''}"`,
        remarkId: remark._id,
        logId: log._id,
      })

      try {
        const recipientFull = await User.findById(employee._id).select('notificationPrefs')
        if (recipientFull?.notificationPrefs?.emailOnRemarkCreated !== false) {
          await sendRemarkCreatedEmail({
            toEmail: employee.email,
            toName: employee.name,
            adminName: req.user.name,
            logDate: log.date,
            adminNote,
          })
        }
      } catch (emailErr) {
        console.error('[email] sendRemarkCreatedEmail failed:', emailErr.message)
      }
    }

    return res.status(201).json(remark)
  } catch (error) {
    console.error('CreateRemark error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Reply to Thread ──────────────────────────────────────────────────────────
const replyToRemark = async (req, res) => {
  try {
    const { message } = req.body
    const { remarkId } = req.params

    if (!message) return res.status(400).json({ message: 'Message is required' })

    const remark = await Remark.findOne({ _id: remarkId, tenantId: req.tenantId })
    if (!remark) return res.status(404).json({ message: 'Remark not found' })
    if (remark.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot reply to a resolved remark' })
    }

    if (req.user.role === 'employee') {
      const log = await TimeLog.findOne({ _id: remark.logId, userId: req.user._id, tenantId: req.tenantId })
      if (!log) return res.status(403).json({ message: 'You can only reply to remarks on your own logs' })
    }

    remark.thread.push({ authorId: req.user._id, role: req.user.role, message })
    await remark.save()

    const log = await TimeLog.findById(remark.logId)
    const isEmployee = req.user.role === 'employee'
    const recipientId = isEmployee ? remark.adminId : log?.userId

    if (recipientId && recipientId.toString() !== req.user._id.toString()) {
      const recipient = await User.findById(recipientId)
      if (recipient) {
        await notify({
          tenantId: req.tenantId,
          recipientId: recipient._id,
          type: 'remark_reply',
          title: 'New reply in remark thread',
          message: `${req.user.name} replied: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
          remarkId: remark._id,
          logId: remark.logId,
        })

        try {
          const recipientFull = await User.findById(recipient._id).select('notificationPrefs')
          if (recipientFull?.notificationPrefs?.emailOnRemarkReply !== false) {
            await sendRemarkReplyEmail({
              toEmail: recipient.email,
              toName: recipient.name,
              replierName: req.user.name,
              message,
              logDate: log?.date,
            })
          }
        } catch (emailErr) {
          console.error('[email] sendRemarkReplyEmail failed:', emailErr.message)
        }
      }
    }

    return res.status(200).json(remark)
  } catch (error) {
    console.error('ReplyToRemark error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Resolve Remark ───────────────────────────────────────────────────────────
const resolveRemark = async (req, res) => {
  try {
    const { remarkId } = req.params

    const remark = await Remark.findOne({ _id: remarkId, tenantId: req.tenantId })
    if (!remark) return res.status(404).json({ message: 'Remark not found' })
    if (remark.status === 'resolved') {
      return res.status(400).json({ message: 'Remark is already resolved' })
    }

    remark.status = 'resolved'
    remark.resolvedAt = new Date()
    await remark.save()

    const log = await TimeLog.findById(remark.logId)
    if (log) {
      log.status = 'resolved'
      await log.save()

      const employee = await User.findById(log.userId)
      if (employee) {
        await notify({
          tenantId: req.tenantId,
          recipientId: employee._id,
          type: 'remark_resolved',
          title: 'Remark resolved',
          message: `${req.user.name} resolved the remark on your log for ${new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`,
          remarkId: remark._id,
          logId: log._id,
        })

        try {
          const recipientFull = await User.findById(employee._id).select('notificationPrefs')
          if (recipientFull?.notificationPrefs?.emailOnRemarkResolved !== false) {
            await sendRemarkResolvedEmail({
              toEmail: employee.email,
              toName: employee.name,
              adminName: req.user.name,
              logDate: log.date,
            })
          }
        } catch (emailErr) {
          console.error('[email] sendRemarkResolvedEmail failed:', emailErr.message)
        }
      }
    }

    return res.status(200).json(remark)
  } catch (error) {
    console.error('ResolveRemark error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get My Remarks ───────────────────────────────────────────────────────────
const getMyRemarks = async (req, res) => {
  try {
    const logs = await TimeLog.find({
      tenantId: req.tenantId,
      userId: req.user._id,
      status: { $in: ['remarked', 'resolved'] },
    }).select('_id')

    const logIds = logs.map((l) => l._id)

    const remarks = await Remark.find({ tenantId: req.tenantId, logId: { $in: logIds } })
      .populate('adminId', 'name email')
      .populate('logId', 'date timeIn timeOut')
      .populate('thread.authorId', 'name role')
      .sort({ createdAt: -1 })

    return res.status(200).json(remarks)
  } catch (error) {
    console.error('GetMyRemarks error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Remarks ──────────────────────────────────────────────────────────
const getAllRemarks = async (req, res) => {
  try {
    const { status } = req.query
    const query = { tenantId: req.tenantId }
    if (status) query.status = status

    const remarks = await Remark.find(query)
      .populate('adminId', 'name email')
      .populate('logId', 'date timeIn timeOut userId')
      .populate('thread.authorId', 'name role')
      .sort({ createdAt: -1 })

    return res.status(200).json(remarks)
  } catch (error) {
    console.error('GetAllRemarks error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Single Remark ────────────────────────────────────────────────────────
const getRemarkById = async (req, res) => {
  try {
    const remark = await Remark.findOne({ _id: req.params.remarkId, tenantId: req.tenantId })
      .populate('adminId', 'name email')
      .populate('logId', 'date timeIn timeOut userId employeeNote')
      .populate('thread.authorId', 'name role')

    if (!remark) return res.status(404).json({ message: 'Remark not found' })
    return res.status(200).json(remark)
  } catch (error) {
    console.error('GetRemarkById error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  createRemark,
  replyToRemark,
  resolveRemark,
  getMyRemarks,
  getAllRemarks,
  getRemarkById,
}