const User = require('../models/User')
const TimeLog = require('../models/TimeLog')
const ShiftSchedule = require('../models/ShiftSchedule')
const Tenant = require('../models/Tenant')
const { toZonedTime, format } = require('date-fns-tz')

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// ─── Generate digest data for a tenant + date range ───────────────────────────
const generateDigestData = async ({ tenantId, startDate, endDate, timezone }) => {
  const users = await User.find({
    tenantId,
    isActive: true,
    role: { $in: ['employee', 'admin', 'owner'] },
  }).select('name email department')

  const logs = await TimeLog.find({
    tenantId,
    date: { $gte: startDate, $lte: endDate },
  })

  const schedules = await ShiftSchedule.find({
    tenantId,
    isActive: true,
  })

  const scheduleMap = {}
  schedules.forEach((s) => { scheduleMap[s.userId.toString()] = s })

  const logMap = {}
  logs.forEach((log) => {
    const key = `${log.userId.toString()}__${log.date}`
    logMap[key] = log
  })

  // Build date list
  const dates = []
  const cursor = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  while (cursor <= end) {
    dates.push(format(cursor, 'yyyy-MM-dd'))
    cursor.setDate(cursor.getDate() + 1)
  }

  let totalPresent = 0
  let totalAbsent = 0
  let totalLate = 0
  let totalWorkedMins = 0
  let overtimeDays = 0

  const employeeRows = users.map((user) => {
    const uid = user._id.toString()
    const schedule = scheduleMap[uid]

    let present = 0
    let absent = 0
    let late = 0
    let workedMins = 0

    dates.forEach((date) => {
      const isWorkDay = schedule
        ? schedule.workDays.includes(new Date(date + 'T12:00:00').getDay())
        : true
      if (!isWorkDay) return

      const log = logMap[`${uid}__${date}`]

      if (!log) {
        if (schedule) absent++
        return
      }

      present++

      if (log.timeOut) {
        const worked = (new Date(log.timeOut) - new Date(log.timeIn)) / 60000 - log.totalBreakMins
        workedMins += Math.max(0, worked)
        if (log.overtime) overtimeDays++
      }

      if (schedule && log.timeIn) {
        const zonedTimeIn = toZonedTime(new Date(log.timeIn), schedule.timezone)
        const actualMins = zonedTimeIn.getHours() * 60 + zonedTimeIn.getMinutes()
        const scheduledMins = toMinutes(schedule.startTime)
        if (actualMins - scheduledMins > schedule.lateTolerance) late++
      }
    })

    totalPresent += present
    totalAbsent += absent
    totalLate += late
    totalWorkedMins += workedMins

    return {
      name: user.name,
      department: user.department || '—',
      present,
      absent,
      late,
      avgHours: present > 0 ? (workedMins / 60 / present).toFixed(1) : '0.0',
    }
  })

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    overtimeDays,
    avgWorkedHours: totalPresent > 0 ? (totalWorkedMins / 60 / totalPresent).toFixed(1) : '0.0',
    employeeRows,
    totalEmployees: users.length,
  }
}

// ─── Get yesterday's date string in a timezone ────────────────────────────────
const getYesterday = (timezone) => {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  zoned.setDate(zoned.getDate() - 1)
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone })
}

// ─── Get last week's date range in a timezone ─────────────────────────────────
const getLastWeek = (timezone) => {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  const dayOfWeek = zoned.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const lastMonday = new Date(zoned)
  lastMonday.setDate(zoned.getDate() - diffToMonday - 7)

  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)

  return {
    startDate: format(lastMonday, 'yyyy-MM-dd'),
    endDate: format(lastSunday, 'yyyy-MM-dd'),
  }
}

module.exports = {
  generateDigestData,
  getYesterday,
  getLastWeek,
}