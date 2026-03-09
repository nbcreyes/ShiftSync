const User = require('../models/User')
const TimeLog = require('../models/TimeLog')
const Break = require('../models/Break')
const Tenant = require('../models/Tenant')
const ShiftSchedule = require('../models/ShiftSchedule')
const { createAuditLog } = require('./auditController')
const { toZonedTime, format } = require('date-fns-tz')

// ─── Get All Users ────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .select('-passwordHash -refreshToken')
    return res.status(200).json(users)
  } catch (error) {
    console.error('GetUsers error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Workspace ────────────────────────────────────────────────────────────
const getWorkspace = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId)
    if (!tenant) return res.status(404).json({ message: 'Workspace not found' })
    return res.status(200).json({
      companyName: tenant.companyName,
      timezone: tenant.timezone || 'UTC',
    })
  } catch (error) {
    console.error('GetWorkspace error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Update Role ──────────────────────────────────────────────────────────────
const updateRole = async (req, res) => {
  try {
    const { role } = req.body
    const { id } = req.params

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or employee' })
    }

    const user = await User.findOne({ _id: id, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'owner') {
      return res.status(403).json({ message: 'Cannot change the role of the workspace owner' })
    }

    const previousRole = user.role
    user.role = role
    await user.save()

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'member_role_changed',
      targetType: 'user',
      targetId: user._id,
      targetUser: user._id,
      description: `Changed ${user.name}'s role from ${previousRole} to ${role}`,
      meta: { previousRole, newRole: role },
    })

    return res.status(200).json({
      message: `User role updated to ${role}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('UpdateRole error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Deactivate User ──────────────────────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findOne({ _id: id, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'owner') {
      return res.status(403).json({ message: 'Cannot deactivate the workspace owner' })
    }

    user.isActive = !user.isActive
    await user.save()

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: user.isActive ? 'member_activated' : 'member_deactivated',
      targetType: 'user',
      targetId: user._id,
      targetUser: user._id,
      description: `${user.isActive ? 'Activated' : 'Deactivated'} account for ${user.name}`,
    })

    return res.status(200).json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
    })
  } catch (error) {
    console.error('DeactivateUser error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findOne({ _id: id, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'owner') {
      return res.status(403).json({ message: 'Cannot delete the workspace owner' })
    }

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'member_deleted',
      targetType: 'user',
      targetId: user._id,
      description: `Deleted member ${user.name} (${user.email})`,
      meta: { name: user.name, email: user.email, role: user.role },
    })

    await user.deleteOne()

    return res.status(200).json({ message: 'User deleted. Their logs have been preserved.' })
  } catch (error) {
    console.error('DeleteUser error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get User Timelog ─────────────────────────────────────────────────────────
const getUserTimelog = async (req, res) => {
  try {
    const { userId } = req.params
    const { startDate, endDate, page = 1, limit = 10 } = req.query

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const query = { tenantId: req.tenantId, userId }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = startDate
      if (endDate) query.date.$lte = endDate
    }

    const total = await TimeLog.countDocuments(query)
    const logs = await TimeLog.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, department: user.department },
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GetUserTimelog error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Live Board ───────────────────────────────────────────────────────────────
const getLiveBoard = async (req, res) => {
  try {
    const { timezone } = req.query
    if (!timezone) return res.status(400).json({ message: 'Timezone is required' })

    const now = new Date()
    const zoned = toZonedTime(now, timezone)
    const today = format(zoned, 'yyyy-MM-dd', { timeZone: timezone })

    const logs = await TimeLog.find({
      tenantId: req.tenantId,
      date: today,
    }).populate('userId', 'name email department avatarUrl')

    const openBreaks = await Break.find({ tenantId: req.tenantId, breakEnd: null })
    const openBreakLogIds = new Set(openBreaks.map((b) => b.logId.toString()))

    const board = logs.map((log) => {
      let status = 'clocked-out'
      if (!log.timeOut) {
        status = openBreakLogIds.has(log._id.toString()) ? 'on-break' : 'working'
      }
      return {
        user: log.userId,
        logId: log._id,
        timeIn: log.timeIn,
        timeOut: log.timeOut,
        totalBreakMins: log.totalBreakMins,
        overtime: log.overtime,
        status,
      }
    })

    return res.status(200).json(board)
  } catch (error) {
    console.error('GetLiveBoard error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
const exportCSV = async (req, res) => {
  try {
    const { userId, startDate, endDate, timezone } = req.query
    if (!timezone) return res.status(400).json({ message: 'Timezone is required' })

    const query = { tenantId: req.tenantId }
    if (userId) query.userId = userId
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = startDate
      if (endDate) query.date.$lte = endDate
    }

    const logs = await TimeLog.find(query)
      .populate('userId', 'name email department')
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

    const header = 'Name,Email,Department,Date,Time In,Time Out,Break Mins,Hours Worked,Overtime,Status,Note'
    const csv = [header, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=team-timelog.csv')
    return res.status(200).send(csv)
  } catch (error) {
    console.error('AdminExportCSV error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Update Workspace ─────────────────────────────────────────────────────────
const updateWorkspace = async (req, res) => {
  try {
    const { companyName, timezone } = req.body
    if (!companyName && !timezone) {
      return res.status(400).json({ message: 'Nothing to update' })
    }

    const updates = {}
    if (companyName) updates.companyName = companyName
    if (timezone) updates.timezone = timezone

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, { new: true })
    if (!tenant) return res.status(404).json({ message: 'Workspace not found' })

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'workspace_updated',
      targetType: 'workspace',
      targetId: req.tenantId,
      description: `Updated workspace settings`,
      meta: updates,
    })

    return res.status(200).json({
      message: 'Workspace updated',
      companyName: tenant.companyName,
      timezone: tenant.timezone,
    })
  } catch (error) {
    console.error('UpdateWorkspace error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Summary Report ───────────────────────────────────────────────────────────
const getSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, timezone } = req.query
    if (!startDate || !endDate || !timezone) {
      return res.status(400).json({ message: 'startDate, endDate, and timezone are required' })
    }

    const users = await User.find({
      tenantId: req.tenantId,
      isActive: true,
      role: { $in: ['employee', 'admin', 'owner'] },
    }).select('name email department')

    const logs = await TimeLog.find({
      tenantId: req.tenantId,
      date: { $gte: startDate, $lte: endDate },
    })

    const schedules = await ShiftSchedule.find({ tenantId: req.tenantId, isActive: true })
    const scheduleMap = {}
    schedules.forEach((s) => { scheduleMap[s.userId.toString()] = s })

    const dates = []
    const cursor = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')
    while (cursor <= end) {
      dates.push(format(cursor, 'yyyy-MM-dd'))
      cursor.setDate(cursor.getDate() + 1)
    }

    const today = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd', { timeZone: timezone })

    const logMap = {}
    logs.forEach((log) => {
      const key = `${log.userId.toString()}__${log.date}`
      logMap[key] = log
    })

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const report = users.map((user) => {
      const uid = user._id.toString()
      const schedule = scheduleMap[uid]
      let daysPresent = 0, daysAbsent = 0, daysLate = 0
      let totalWorkedMins = 0, totalBreakMins = 0, overtimeDays = 0

      dates.forEach((date) => {
        if (date > today) return
        const isWorkDay = schedule
          ? schedule.workDays.includes(new Date(date + 'T12:00:00').getDay())
          : true
        if (!isWorkDay) return

        const log = logMap[`${uid}__${date}`]
        if (!log) { if (schedule) daysAbsent++; return }

        daysPresent++
        if (log.timeOut) {
          const worked = (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
          totalWorkedMins += Math.max(0, worked)
        }
        totalBreakMins += log.totalBreakMins || 0
        if (log.overtime) overtimeDays++

        if (schedule && log.timeIn) {
          const zonedTimeIn = toZonedTime(new Date(log.timeIn), schedule.timezone)
          const actualMins = zonedTimeIn.getHours() * 60 + zonedTimeIn.getMinutes()
          const scheduledMins = toMinutes(schedule.startTime)
          if (actualMins - scheduledMins > schedule.lateTolerance) daysLate++
        }
      })

      const scheduledDays = schedule
        ? dates.filter((d) => d <= today && schedule.workDays.includes(new Date(d + 'T12:00:00').getDay())).length
        : dates.filter((d) => d <= today).length

      const attendanceRate = scheduledDays > 0
        ? Math.round((daysPresent / scheduledDays) * 100)
        : null

      return {
        user: { _id: user._id, name: user.name, email: user.email, department: user.department },
        daysPresent, daysAbsent, daysLate, overtimeDays,
        totalWorkedHours: parseFloat((totalWorkedMins / 60).toFixed(1)),
        avgWorkedHours: daysPresent > 0 ? parseFloat((totalWorkedMins / 60 / daysPresent).toFixed(1)) : 0,
        totalBreakMins: Math.round(totalBreakMins),
        attendanceRate, scheduledDays,
      }
    })

    return res.status(200).json(report)
  } catch (error) {
    console.error('GetSummaryReport error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Department Report ────────────────────────────────────────────────────────
const getDepartmentReport = async (req, res) => {
  try {
    const { startDate, endDate, timezone } = req.query
    if (!startDate || !endDate || !timezone) {
      return res.status(400).json({ message: 'startDate, endDate, and timezone are required' })
    }

    const users = await User.find({ tenantId: req.tenantId, isActive: true }).select('name department')
    const logs = await TimeLog.find({
      tenantId: req.tenantId,
      date: { $gte: startDate, $lte: endDate },
    })

    const userDeptMap = {}
    users.forEach((u) => { userDeptMap[u._id.toString()] = u.department || 'Unassigned' })

    const deptMap = {}
    logs.forEach((log) => {
      const dept = userDeptMap[log.userId.toString()] || 'Unassigned'
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, totalLogs: 0, totalWorkedMins: 0, totalBreakMins: 0, overtimeDays: 0, memberCount: 0 }
      }
      deptMap[dept].totalLogs++
      if (log.timeOut) {
        const worked = (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
        deptMap[dept].totalWorkedMins += Math.max(0, worked)
      }
      deptMap[dept].totalBreakMins += log.totalBreakMins || 0
      if (log.overtime) deptMap[dept].overtimeDays++
    })

    users.forEach((u) => {
      const dept = u.department || 'Unassigned'
      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, totalLogs: 0, totalWorkedMins: 0, totalBreakMins: 0, overtimeDays: 0, memberCount: 0 }
      }
      deptMap[dept].memberCount++
    })

    const result = Object.values(deptMap).map((d) => ({
      ...d,
      totalWorkedHours: parseFloat((d.totalWorkedMins / 60).toFixed(1)),
      avgWorkedHoursPerLog: d.totalLogs > 0 ? parseFloat((d.totalWorkedMins / 60 / d.totalLogs).toFixed(1)) : 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    console.error('GetDepartmentReport error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Admin Edit Log ───────────────────────────────────────────────────────────
const adminEditLog = async (req, res) => {
  try {
    const { logId } = req.params
    const { timeIn, timeOut, adminNote } = req.body

    const log = await TimeLog.findOne({ _id: logId, tenantId: req.tenantId })
    if (!log) return res.status(404).json({ message: 'Log not found' })

    const previous = {
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      adminNote: log.adminNote,
    }

    if (timeIn) log.timeIn = new Date(timeIn)
    if (timeOut) log.timeOut = new Date(timeOut)
    if (adminNote !== undefined) log.adminNote = adminNote

    if (log.timeIn && log.timeOut) {
      const totalMins = (new Date(log.timeOut) - new Date(log.timeIn)) / 60000
      const workedMins = totalMins - (log.totalBreakMins || 0)
      log.overtime = workedMins > 8 * 60
    }

    await log.save()

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'log_edited',
      targetType: 'timelog',
      targetId: log._id,
      targetUser: log.userId,
      description: `Edited time log for ${log.date}`,
      meta: { previous, updated: { timeIn, timeOut, adminNote } },
    })

    return res.status(200).json(log)
  } catch (error) {
    console.error('AdminEditLog error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getUsers,
  getWorkspace,
  updateRole,
  deactivateUser,
  deleteUser,
  getUserTimelog,
  getLiveBoard,
  exportCSV,
  updateWorkspace,
  getSummaryReport,
  getDepartmentReport,
  adminEditLog,
}