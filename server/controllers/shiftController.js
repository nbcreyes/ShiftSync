const ShiftSchedule = require('../models/ShiftSchedule')
const TimeLog = require('../models/TimeLog')
const User = require('../models/User')
const { toZonedTime, format } = require('date-fns-tz')

// ─── Helper: parse "HH:mm" into minutes since midnight ───────────────────────
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// ─── Helper: get current date string in a timezone ───────────────────────────
const getLocalDate = (timezone) => {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
}

// ─── Set / Update Schedule (admin/owner) ─────────────────────────────────────
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

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

    const schedule = await ShiftSchedule.findOne({
      tenantId: req.tenantId,
      userId,
    })

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this user' })
    }

    return res.status(200).json(schedule)
  } catch (error) {
    console.error('GetSchedule error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Delete Schedule (admin/owner) ────────────────────────────────────────────
const deleteSchedule = async (req, res) => {
  try {
    const { userId } = req.params

    const schedule = await ShiftSchedule.findOneAndDelete({
      tenantId: req.tenantId,
      userId,
    })

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this user' })
    }

    return res.status(200).json({ message: 'Schedule removed' })
  } catch (error) {
    console.error('DeleteSchedule error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Get All Schedules in Workspace ──────────────────────────────────────────
const getAllSchedules = async (req, res) => {
  try {
    const schedules = await ShiftSchedule.find({
      tenantId: req.tenantId,
    }).populate('userId', 'name email department')

    return res.status(200).json(schedules)
  } catch (error) {
    console.error('GetAllSchedules error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Generate Flags for a Date Range ─────────────────────────────────────────
// Checks all scheduled employees and returns late/absent flags
const getFlags = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' })
    }

    const schedules = await ShiftSchedule.find({
      tenantId: req.tenantId,
      isActive: true,
    }).populate('userId', 'name email department')

    if (schedules.length === 0) {
      return res.status(200).json([])
    }

    // Build date range array
    const dates = []
    const cursor = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    while (cursor <= end) {
      dates.push(format(cursor, 'yyyy-MM-dd'))
      cursor.setDate(cursor.getDate() + 1)
    }

    // Fetch all logs for these users in the date range
    const userIds = schedules.map((s) => s.userId._id)
    const logs = await TimeLog.find({
      tenantId: req.tenantId,
      userId: { $in: userIds },
      date: { $gte: startDate, $lte: endDate },
    })

    // Map logs by userId + date for fast lookup
    const logMap = {}
    logs.forEach((log) => {
      const key = `${log.userId.toString()}__${log.date}`
      logMap[key] = log
    })

    const flags = []
    const today = format(toZonedTime(new Date(), 'UTC'), 'yyyy-MM-dd')

    for (const schedule of schedules) {
      for (const date of dates) {
        // Only flag past dates and today — never future
        if (date > today) continue

        // Check if this is a scheduled work day
        const dayOfWeek = new Date(date + 'T12:00:00').getDay()
        if (!schedule.workDays.includes(dayOfWeek)) continue

        const key = `${schedule.userId._id.toString()}__${date}`
        const log = logMap[key]

        if (!log) {
          // No log at all — absent
          flags.push({
            type: 'absent',
            userId: schedule.userId,
            date,
            schedule: {
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            },
          })
        } else if (log.timeIn) {
          // Log exists — check if late
          const zonedTimeIn = toZonedTime(new Date(log.timeIn), schedule.timezone)
          const actualMinutes =
            zonedTimeIn.getHours() * 60 + zonedTimeIn.getMinutes()
          const scheduledMinutes = toMinutes(schedule.startTime)
          const lateBy = actualMinutes - scheduledMinutes

          if (lateBy > schedule.lateTolerance) {
            flags.push({
              type: 'late',
              userId: schedule.userId,
              date,
              lateBy,
              timeIn: log.timeIn,
              schedule: {
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              },
            })
          }
        }
      }
    }

    // Sort by date descending
    flags.sort((a, b) => (a.date < b.date ? 1 : -1))

    return res.status(200).json(flags)
  } catch (error) {
    console.error('GetFlags error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  setSchedule,
  getSchedule,
  deleteSchedule,
  getAllSchedules,
  getFlags,
}