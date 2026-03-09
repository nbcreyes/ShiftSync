const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const Invite = require('../models/Invite')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const Notification = require('../models/Notification')
const { sendInviteEmail } = require('../utils/email')

// ─── Helper: create a notification silently (never throws) ───────────────────
const notify = async (data) => {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message)
  }
}

// ─── Send Invite ──────────────────────────────────────────────────────────────
const sendInvite = async (req, res) => {
  try {
    const { name, email, role, department, tempPassword } = req.body
    const inviter = req.user

    if (!name || !email || !role || !tempPassword) {
      return res.status(400).json({ message: 'Name, email, role and temporary password are required' })
    }

    // Only owner can assign admin role
    if (role === 'admin' && inviter.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can invite admins' })
    }

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or employee' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' })
    }

    // Check for existing pending invite
    const existingInvite = await Invite.findOne({
      email,
      tenantId: req.tenantId,
      used: false,
      expiresAt: { $gt: new Date() },
    })
    if (existingInvite) {
      return res.status(409).json({ message: 'A pending invite already exists for this email' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tempPasswordHash = await bcrypt.hash(tempPassword, 12)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const invite = await Invite.create({
      tenantId: req.tenantId,
      email,
      name,
      role,
      department: department || null,
      tempPasswordHash,
      token,
      invitedBy: inviter._id,
      expiresAt,
    })

    const tenant = await Tenant.findById(req.tenantId)
    const inviteLink = `${process.env.CLIENT_URL}/invite?token=${token}`

    await sendInviteEmail({
      toEmail: email,
      toName: name,
      workspaceName: tenant.companyName,
      inviteLink,
      tempPassword,
    })

    return res.status(201).json({
      message: 'Invite sent successfully',
      invite: {
        id: invite._id,
        email: invite.email,
        name: invite.name,
        role: invite.role,
        department: invite.department,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error) {
    console.error('SendInvite error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Validate Token ───────────────────────────────────────────────────────────
const validateToken = async (req, res) => {
  try {
    const { token } = req.params

    const invite = await Invite.findOne({ token }).populate('tenantId', 'companyName')

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' })
    }

    if (invite.used) {
      return res.status(410).json({ message: 'This invite has already been used' })
    }

    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite has expired. Contact your admin for a new invite.' })
    }

    return res.status(200).json({
      name: invite.name,
      email: invite.email,
      role: invite.role,
      department: invite.department,
      workspaceName: invite.tenantId.companyName,
    })
  } catch (error) {
    console.error('ValidateToken error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Accept Invite ────────────────────────────────────────────────────────────
const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: 'Password is required' })
    }

    const invite = await Invite.findOne({ token })

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' })
    }

    if (invite.used) {
      return res.status(410).json({ message: 'This invite has already been used' })
    }

    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ message: 'This invite has expired. Contact your admin for a new invite.' })
    }

    const isMatch = await bcrypt.compare(password, invite.tempPasswordHash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect temporary password' })
    }

    // Check if user was already created (edge case)
    const existingUser = await User.findOne({ email: invite.email })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const user = await User.create({
      tenantId: invite.tenantId,
      name: invite.name,
      email: invite.email,
      passwordHash: invite.tempPasswordHash,
      role: invite.role,
      department: invite.department,
      isActive: true,
      mustChangePassword: true,
    })

    // Invalidate invite
    invite.used = true
    await invite.save()

    // ── Notify the inviter ──
    const inviter = await User.findById(invite.invitedBy)
    if (inviter) {
      await notify({
        tenantId: invite.tenantId,
        recipientId: inviter._id,
        type: 'invite_accepted',
        title: 'Invite accepted',
        message: `${invite.name} accepted your invite and joined the workspace as ${invite.role}.`,
      })
    }

    return res.status(201).json({
      message: 'Account created. Please change your password to continue.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
    })
  } catch (error) {
    console.error('AcceptInvite error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── List Pending Invites ─────────────────────────────────────────────────────
const getPendingInvites = async (req, res) => {
  try {
    const invites = await Invite.find({
      tenantId: req.tenantId,
      used: false,
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    return res.status(200).json(invites)
  } catch (error) {
    console.error('GetPendingInvites error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Cancel Invite ────────────────────────────────────────────────────────────
const cancelInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    })

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' })
    }

    if (invite.used) {
      return res.status(400).json({ message: 'Cannot cancel an already used invite' })
    }

    await invite.deleteOne()

    return res.status(200).json({ message: 'Invite cancelled' })
  } catch (error) {
    console.error('CancelInvite error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  sendInvite,
  validateToken,
  acceptInvite,
  getPendingInvites,
  cancelInvite,
}