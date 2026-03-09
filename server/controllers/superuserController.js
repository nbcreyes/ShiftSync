const User = require('../models/User')
const Tenant = require('../models/Tenant')
const TimeLog = require('../models/TimeLog')
const Break = require('../models/Break')
const { toZonedTime, format } = require('date-fns-tz')

// ─── Platform Stats ───────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const totalWorkspaces = await Tenant.countDocuments()
    const totalUsers = await User.countDocuments({ role: { $ne: 'superuser' } })

    // Active sessions = logs with no timeOut for today across all tenants
    const today = new Date().toISOString().split('T')[0]
    const activeSessions = await TimeLog.countDocuments({
      date: today,
      timeOut: null,
    })

    const totalAdmins = await User.countDocuments({ role: 'admin' })
    const totalEmployees = await User.countDocuments({ role: 'employee' })
    const totalOwners = await User.countDocuments({ role: 'owner' })

    return res.status(200).json({
      totalWorkspaces,
      totalUsers,
      totalAdmins,
      totalEmployees,
      totalOwners,
      activeSessions,
    })
  } catch (error) {
    console.error('GetStats error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Workspaces ───────────────────────────────────────────────────────
const getWorkspaces = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 })

    const workspaces = await Promise.all(
      tenants.map(async (tenant) => {
        const memberCount = await User.countDocuments({ tenantId: tenant._id })
        const owner = await User.findOne({
          tenantId: tenant._id,
          role: 'owner',
        }).select('name email')

        return {
          id: tenant._id,
          companyName: tenant.companyName,
          owner,
          memberCount,
          createdAt: tenant.createdAt,
        }
      })
    )

    return res.status(200).json(workspaces)
  } catch (error) {
    console.error('GetWorkspaces error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Single Workspace ─────────────────────────────────────────────────────
const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params

    const tenant = await Tenant.findById(id)
    if (!tenant) {
      return res.status(404).json({ message: 'Workspace not found' })
    }

    const members = await User.find({ tenantId: id })
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })

    const recentLogs = await TimeLog.find({ tenantId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)

    return res.status(200).json({
      id: tenant._id,
      companyName: tenant.companyName,
      createdAt: tenant.createdAt,
      members,
      recentLogs,
    })
  } catch (error) {
    console.error('GetWorkspaceById error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Users (platform-wide) ───────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query

    const query = { role: { $ne: 'superuser' } }
    if (role) query.role = role

    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('-passwordHash -refreshToken')
      .populate('tenantId', 'companyName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    return res.status(200).json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GetAllUsers error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Platform-wide CSV Export ─────────────────────────────────────────────────
const exportCSV = async (req, res) => {
  try {
    const { tenantId, startDate, endDate, timezone = 'UTC' } = req.query

    const query = {}
    if (tenantId) query.tenantId = tenantId
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = startDate
      if (endDate) query.date.$lte = endDate
    }

    const logs = await TimeLog.find(query)
      .populate('userId', 'name email department')
      .populate('tenantId', 'companyName')
      .sort({ date: -1 })

    const formatLocal = (date) => {
      if (!date) return ''
      const zoned = toZonedTime(new Date(date), timezone)
      return format(zoned, 'hh:mm a', { timeZone: timezone })
    }

    const rows = logs.map((log) => {
      const totalMins = log.timeOut
        ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000
        : null
      const workedMins = totalMins !== null ? totalMins - log.totalBreakMins : null

      return [
        log.tenantId?.companyName || '',
        log.userId?.name || '',
        log.userId?.email || '',
        log.userId?.department || '',
        log.date,
        formatLocal(log.timeIn),
        formatLocal(log.timeOut),
        log.totalBreakMins,
        workedMins !== null ? (workedMins / 60).toFixed(2) : '',
        log.overtime ? 'Yes' : 'No',
        log.status,
        log.employeeNote || '',
      ].join(',')
    })

    const header = 'Workspace,Name,Email,Department,Date,Time In,Time Out,Break Mins,Hours Worked,Overtime,Status,Note'
    const csv = [header, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=platform-timelog.csv')
    return res.status(200).send(csv)
  } catch (error) {
    console.error('SuperuserExportCSV error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getStats,
  getWorkspaces,
  getWorkspaceById,
  getAllUsers,
  exportCSV,
}