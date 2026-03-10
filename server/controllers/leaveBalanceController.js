const LeaveBalance = require('../models/LeaveBalance')
const User = require('../models/User')

const currentYear = () => new Date().getFullYear()

// ─── Get or init balance for a user+year ─────────────────────────────────────
const getOrCreate = async (tenantId, userId, year) => {
  let balance = await LeaveBalance.findOne({ tenantId, userId, year })
  if (!balance) {
    balance = await LeaveBalance.create({ tenantId, userId, year })
  }
  return balance
}

// ─── Get my balance (employee) ────────────────────────────────────────────────
const getMyBalance = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear()
    const balance = await getOrCreate(req.tenantId, req.user._id, year)
    return res.status(200).json(balance)
  } catch (error) {
    console.error('GetMyBalance error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get balance for any user (admin) ────────────────────────────────────────
const getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params
    const year = parseInt(req.query.year) || currentYear()

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const balance = await getOrCreate(req.tenantId, userId, year)
    return res.status(200).json(balance)
  } catch (error) {
    console.error('GetUserBalance error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get all balances for tenant (admin) ─────────────────────────────────────
const getAllBalances = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || currentYear()

    const users = await User.find({
      tenantId: req.tenantId,
      isActive: true,
      role: { $in: ['employee', 'admin', 'owner'] },
    }).select('name email department')

    // Ensure all users have a balance record for this year
    await Promise.all(
      users.map((u) => getOrCreate(req.tenantId, u._id, year))
    )

    const balances = await LeaveBalance.find({ tenantId: req.tenantId, year })
      .populate('userId', 'name email department')

    return res.status(200).json(balances)
  } catch (error) {
    console.error('GetAllBalances error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Set allowed days for a user (owner only) ─────────────────────────────────
const setUserBalance = async (req, res) => {
  try {
    const { userId } = req.params
    const { year, balances } = req.body

    if (!year || !balances) {
      return res.status(400).json({ message: 'year and balances are required' })
    }

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const TYPES = ['vacation', 'sick', 'personal', 'unpaid', 'other']
    const updateFields = {}
    TYPES.forEach((type) => {
      if (balances[type] !== undefined) {
        updateFields[`balances.${type}.allowed`] = Math.max(0, parseInt(balances[type]) || 0)
      }
    })
    updateFields.updatedAt = new Date()

    const balance = await LeaveBalance.findOneAndUpdate(
      { tenantId: req.tenantId, userId, year },
      { $set: updateFields },
      { new: true, upsert: true }
    )

    return res.status(200).json(balance)
  } catch (error) {
    console.error('SetUserBalance error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getMyBalance, getUserBalance, getAllBalances, setUserBalance, getOrCreate }