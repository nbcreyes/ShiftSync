const Announcement = require('../models/Announcement')

// ─── Create Announcement (owner only) ────────────────────────────────────────
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, expiresAt } = req.body
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' })
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      createdBy: req.user._id,
      title: title.trim(),
      message: message.trim(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })

    return res.status(201).json(announcement)
  } catch (error) {
    console.error('CreateAnnouncement error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Active Announcements (all authed users) ──────────────────────────────
const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date()
    const announcements = await Announcement.find({
      tenantId: req.tenantId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')

    return res.status(200).json(announcements)
  } catch (error) {
    console.error('GetActiveAnnouncements error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Announcements (owner only) ───────────────────────────────────────
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')

    return res.status(200).json(announcements)
  } catch (error) {
    console.error('GetAllAnnouncements error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Delete Announcement (owner only) ────────────────────────────────────────
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    })
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' })

    await announcement.deleteOne()
    return res.status(200).json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error('DeleteAnnouncement error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  deleteAnnouncement,
}