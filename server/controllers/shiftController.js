const ShiftSchedule = require('../models/ShiftSchedule')
const TimeLog = require('../models/TimeLog')
const User = require('../models/User')
const { createAuditLog } = require('./auditController')
const { toZonedTime, format } = require('date-fns-tz')

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

const getLocalDate = (timezone) => {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
}

// ─── Set / Update Schedule ────────────────────────────────────────────────────
const setSchedule = async (req, res) => {
  try {
    const { userId } = req.params
    const { startTime, endTime, workDays, lateTolerance, timezone } = req.body

    if (!startTime || !endTime || !workDays || !timezone) {
      return res.status(400).json({ message: 'startTime, endTime, workDays, and timezone are required' })
    }

    if (!Array.isArray(workDays) || workDays.length === 0) {
      return res.status(400).json({ message: 'workDays must be a non-empty array' })
    }

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const schedule = await ShiftSchedule.findOneAndUpdate(
      { tenantId: req.tenantId, userId },
      {
        tenantId: req.tenantId,
        userId,
        startTime,
        endTime,
        workDays,
        lateTolerance: lateTolerance ?? 5,
        timezone,
        isActive: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'shift_set',
      targetType: 'shift',
      targetId: schedule._id,
      targetUser: user._id,
      description: `Set shift schedule for ${user.name} (${startTime}–${endTime})`,
      meta: { startTime, endTime, workDays, lateTolerance, timezone },
    })

    return res.status(200).json(schedule)
  } catch (error) {
    console.error('SetSchedule error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get Schedule for a User ──────────────────────────────────────────────────
const getSchedule = async (req, res) => {
  try {
    const { userId } = req.params

    const schedule = await ShiftSchedule.findOne({ tenantId: req.tenantId, userId })
    if (!schedule) return res.status(404).json({ message: 'No schedule found for this user' })

    return res.status(200).json(schedule)
  } catch (error) {
    console.error('GetSchedule error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Delete Schedule ──────────────────────────────────────────────────────────
const deleteSchedule = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId })

    const schedule = await ShiftSchedule.findOneAndDelete({ tenantId: req.tenantId, userId })
    if (!schedule) return res.status(404).json({ message: 'No schedule found for this user' })

    await createAuditLog({
      tenantId: req.tenantId,
      performedBy: req.user._id,
      action: 'shift_deleted',
      targetType: 'shift',
      targetId: schedule._id,
      targetUser: userId,
      description: `Removed shift schedule for ${user?.name || userId}`,
    })

    return res.status(200).json({ message: 'Schedule removed' })
  } catch (error) {
    console.error('DeleteSchedule error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Schedules ────────────────────────────────────────────────────────
const getAllSchedules = async (req, res) => {
  try {
    const schedules = await ShiftSchedule.find({ tenantId: req.tenantId })
      .populate('userId', 'name email department')
    return res.status(200).json(schedules)
  } catch (error) {
    console.error('GetAllSchedules error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Shared flag generation logic ─────────────────────────────────────────────
const generateFlags = async ({ tenantId, schedules, startDate, endDate }) => {
  const dates = []
  const cursor = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cursor <= end) {
    dates.push(format(cursor, 'yyyy-MM-dd'))
    cursor.setDate(cursor.getDate() + 1)
  }

  const userIds = schedules.map((s) => s.userId?._id ? s.userId._id : s.userId)

  const logs = await TimeLog.find({
    tenantId,
    userId: { $in: userIds },
    date: { $gte: startDate, $lte: endDate },
  })

  const logMap = {}
  logs.forEach((log) => {
    const key = `${log.userId.toString()}__${log.date}`
    logMap[key] = log
  })

  const flags = []
  const today = format(toZonedTime(new Date(), 'UTC'), 'yyyy-MM-dd')

  for (const schedule of schedules) {
    const uid = schedule.userId?._id
      ? schedule.userId._id.toString()
      : schedule.userId.toString()

    for (const date of dates) {
      if (date > today) continue

      const dayOfWeek = new Date(date + 'T12:00:00').getDay()
      if (!schedule.workDays.includes(dayOfWeek)) continue

      const key = `${uid}__${date}`
      const log = logMap[key]

      if (!log) {
        flags.push({
          type: 'absent',
          userId: schedule.userId,
          date,
          schedule: { startTime: schedule.startTime, endTime: schedule.endTime },
        })
      } else if (log.timeIn) {
        const zonedTimeIn = toZonedTime(new Date(log.timeIn), schedule.timezone)
        const actualMinutes = zonedTimeIn.getHours() * 60 + zonedTimeIn.getMinutes()
        const scheduledMinutes = toMinutes(schedule.startTime)
        const lateBy = actualMinutes - scheduledMinutes

        if (lateBy > schedule.lateTolerance) {
          flags.push({
            type: 'late',
            userId: schedule.userId,
            date,
            lateBy,
            timeIn: log.timeIn,
            schedule: { startTime: schedule.startTime, endTime: schedule.endTime },
          })
        }
      }
    }
  }

  flags.sort((a, b) => (a.date < b.date ? 1 : -1))
  return flags
}

// ─── Get Flags (admin/owner) ──────────────────────────────────────────────────
const getFlags = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' })
    }

    const schedules = await ShiftSchedule.find({ tenantId: req.tenantId, isActive: true })
      .populate('userId', 'name email department')

    if (schedules.length === 0) return res.status(200).json([])

    const flags = await generateFlags({ tenantId: req.tenantId, schedules, startDate, endDate })
    return res.status(200).json(flags)
  } catch (error) {
    console.error('GetFlags error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get My Flags (employee) ──────────────────────────────────────────────────
const getMyFlags = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' })
    }

    const schedule = await ShiftSchedule.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      isActive: true,
    })

    if (!schedule) return res.status(200).json([])

    const flags = await generateFlags({
      tenantId: req.tenantId,
      schedules: [schedule],
      startDate,
      endDate,
    })

    return res.status(200).json(flags)
  } catch (error) {
    console.error('GetMyFlags error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  setSchedule,
  getSchedule,
  deleteSchedule,
  getAllSchedules,
  getFlags,
  getMyFlags,
}