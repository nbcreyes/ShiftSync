const LeaveRequest = require('../models/LeaveRequest')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { createAuditLog } = require('./auditController')
const { sendLeaveRequestEmail, sendLeaveReviewedEmail } = require('../utils/email')

// ─── Create Notification (silent) ────────────────────────────────────────────
const createNotification = async (data) => {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('[notification] failed to create:', err.message)
  }
}

// ─── Submit Leave Request ─────────────────────────────────────────────────────
const submitLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ message: 'type, startDate, and endDate are required' })
    }

    if (endDate < startDate) {
      return res.status(400).json({ message: 'endDate must be on or after startDate' })
    }

    const leave = await LeaveRequest.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      type,
      startDate,
      endDate,
      reason: reason?.trim() || null,
    })

    const admins = await User.find({
      tenantId: req.tenantId,
      role: { $in: ['admin', 'owner'] },
      isActive: true,
    })

    await Promise.all(
      admins.map(async (admin) => {
        await createNotification({
          tenantId: req.tenantId,
          recipientId: admin._id,
          type: 'leave_requested',
          title: 'New Leave Request',
          message: `${req.user.name} submitted a ${type} leave request from ${startDate} to ${endDate}.`,
          leaveId: leave._id,
        })

        try {
          await sendLeaveRequestEmail({
            toEmail: admin.email,
            toName: admin.name,
            employeeName: req.user.name,
            leaveType: type,
            startDate,
            endDate,
            reason: reason?.trim() || null,
          })
        } catch (err) {
          console.error('[email] leave request notification failed:', err.message)
        }
      })
    )

    return res.status(201).json(leave)
  } catch (error) {
    console.error('SubmitLeave error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get My Leave Requests ────────────────────────────────────────────────────
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      tenantId: req.tenantId,
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name')

    return res.status(200).json(leaves)
  } catch (error) {
    console.error('GetMyLeaves error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Cancel Leave Request ─────────────────────────────────────────────────────
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params

    const leave = await LeaveRequest.findOne({
      _id: id,
      tenantId: req.tenantId,
      userId: req.user._id,
    })

    if (!leave) return res.status(404).json({ message: 'Leave request not found' })
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' })
    }

    await leave.deleteOne()

    return res.status(200).json({ message: 'Leave request cancelled' })
  } catch (error) {
    console.error('CancelLeave error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Leave Requests ───────────────────────────────────────────────────
const getAllLeaves = async (req, res) => {
  try {
    const { status, userId } = req.query

    const query = { tenantId: req.tenantId }
    if (status) query.status = status
    if (userId) query.userId = userId

    const leaves = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email department')
      .populate('reviewedBy', 'name')

    return res.status(200).json(leaves)
  } catch (error) {
    console.error('GetAllLeaves error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Review Leave Request ─────────────────────────────────────────────────────
const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNote } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' })
    }

    const leave = await LeaveRequest.findOne({
      _id: id,
      tenantId: req.tenantId,
    }).populate('userId', 'name email')

    if (!leave) return res.status(404).json({ message: 'Leave request not found' })
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' })
    }

    leave.status = status
    leave.adminNote = adminNote?.trim() || null
    leave.reviewedBy = req.user._id
    leave.reviewedAt = new Date()
    await leave.save()

    await createNotification({
      tenantId: req.tenantId,
      recipientId: leave.userId._id,
      type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${leave.type} leave request from ${leave.startDate} to ${leave.endDate} has been ${status}.`,
      leaveId: leave._id,
    })

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: status === 'approved' ? 'leave_approved' : 'leave_rejected',
      targetType: 'leave',
      targetId: leave._id,
      targetUser: leave.userId._id,
      description: `${status === 'approved' ? 'Approved' : 'Rejected'} ${leave.type} leave request for ${leave.userId.name} (${leave.startDate} to ${leave.endDate})`,
      meta: { leaveType: leave.type, startDate: leave.startDate, endDate: leave.endDate, adminNote },
    })

    try {
      await sendLeaveReviewedEmail({
        toEmail: leave.userId.email,
        toName: leave.userId.name,
        adminName: req.user.name,
        leaveType: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status,
        adminNote: adminNote?.trim() || null,
      })
    } catch (err) {
      console.error('[email] leave reviewed notification failed:', err.message)
    }

    return res.status(200).json(leave)
  } catch (error) {
    console.error('ReviewLeave error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  submitLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  reviewLeave,
}