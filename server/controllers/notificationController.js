const Notification = require('../models/Notification')

// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      tenantId: req.tenantId,
      recipientId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)

    return res.status(200).json(notifications)
  } catch (error) {
    console.error('GetMyNotifications error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Unread Count ─────────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      tenantId: req.tenantId,
      recipientId: req.user._id,
      read: false,
    })

    return res.status(200).json({ count })
  } catch (error) {
    console.error('GetUnreadCount error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Mark One as Read ─────────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientId: req.user._id,
        tenantId: req.tenantId,
      },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    return res.status(200).json(notification)
  } catch (error) {
    console.error('MarkAsRead error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        tenantId: req.tenantId,
        recipientId: req.user._id,
        read: false,
      },
      { read: true }
    )

    return res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('MarkAllAsRead error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
}