const TimeLog = require("../models/TimeLog");
const Break = require("../models/Break");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { toZonedTime, format } = require("date-fns-tz");
const { sendOvertimeAlertEmail } = require("../utils/email");

const getLocalDate = (timezone) => {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return format(zoned, "yyyy-MM-dd", { timeZone: timezone });
};

const calculateTotalBreakMins = async (logId) => {
  const breaks = await Break.find({ logId });
  return breaks.reduce((total, b) => {
    if (b.breakStart && b.breakEnd) {
      return total + (new Date(b.breakEnd) - new Date(b.breakStart)) / 60000;
    }
    return total;
  }, 0);
};

// ─── Time In ──────────────────────────────────────────────────────────────────
const timeIn = async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const date = getLocalDate(timezone);
    const existing = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "You have already clocked in today" });

    const log = await TimeLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
      timeIn: new Date(),
    });
    return res.status(201).json(log);
  } catch (error) {
    console.error("TimeIn error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Start Break ──────────────────────────────────────────────────────────────
const startBreak = async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const date = getLocalDate(timezone);
    const log = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (!log)
      return res
        .status(404)
        .json({ message: "No active session found for today" });
    if (log.timeOut)
      return res.status(400).json({ message: "Session already ended" });

    const openBreak = await Break.findOne({ logId: log._id, breakEnd: null });
    if (openBreak)
      return res
        .status(409)
        .json({ message: "A break is already in progress" });

    const breakEntry = await Break.create({
      tenantId: req.tenantId,
      logId: log._id,
      breakStart: new Date(),
    });
    return res.status(201).json(breakEntry);
  } catch (error) {
    console.error("StartBreak error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── End Break ────────────────────────────────────────────────────────────────
const endBreak = async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const date = getLocalDate(timezone);
    const log = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (!log)
      return res
        .status(404)
        .json({ message: "No active session found for today" });

    const openBreak = await Break.findOne({ logId: log._id, breakEnd: null });
    if (!openBreak)
      return res.status(404).json({ message: "No active break found" });

    openBreak.breakEnd = new Date();
    await openBreak.save();

    const totalBreakMins = await calculateTotalBreakMins(log._id);
    log.totalBreakMins = totalBreakMins;
    await log.save();

    return res.status(200).json(openBreak);
  } catch (error) {
    console.error("EndBreak error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Time Out ─────────────────────────────────────────────────────────────────
const timeOut = async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const date = getLocalDate(timezone);
    const log = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (!log)
      return res
        .status(404)
        .json({ message: "No active session found for today" });
    if (log.timeOut)
      return res.status(400).json({ message: "Already clocked out" });

    const openBreak = await Break.findOne({ logId: log._id, breakEnd: null });
    if (openBreak) {
      openBreak.breakEnd = new Date();
      await openBreak.save();
    }

    const totalBreakMins = await calculateTotalBreakMins(log._id);
    const timeOutNow = new Date();
    const totalMins = (timeOutNow - new Date(log.timeIn)) / 60000;
    const workedMins = totalMins - totalBreakMins;
    const overtime = workedMins > 8 * 60;

    log.timeOut = timeOutNow;
    log.totalBreakMins = totalBreakMins;
    log.overtime = overtime;
    await log.save();

    // ── Overtime alert (silent, gated on prefs) ───────────────────────────────
    if (overtime) {
      const hoursWorked = (workedMins / 60).toFixed(1);

      try {
        await Notification.create({
          tenantId: req.tenantId,
          recipientId: req.user._id,
          type: "overtime_alert",
          title: "Overtime Recorded",
          message: `You worked ${hoursWorked} hours on ${date}, exceeding the standard 8-hour shift.`,
        });
      } catch (err) {
        console.error("[overtime] notification failed:", err.message);
      }

      try {
        const user = await User.findById(req.user._id).select(
          "name email notificationPrefs",
        );
        if (user && user.notificationPrefs?.emailOnOvertime !== false) {
          await sendOvertimeAlertEmail({
            toEmail: user.email,
            toName: user.name,
            date,
            hoursWorked,
          });
        }
      } catch (err) {
        console.error("[overtime] email failed:", err.message);
      }
    }

    return res.status(200).json(log);
  } catch (error) {
    console.error("TimeOut error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Add / Edit Note ──────────────────────────────────────────────────────────
const updateNote = async (req, res) => {
  try {
    const { note } = req.body;
    const log = await TimeLog.findOne({
      _id: req.params.logId,
      tenantId: req.tenantId,
      userId: req.user._id,
    });
    if (!log) return res.status(404).json({ message: "Log not found" });

    log.employeeNote = note || null;
    await log.save();
    return res.status(200).json(log);
  } catch (error) {
    console.error("UpdateNote error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Edit Log (only if remarked) ──────────────────────────────────────────────
const editLog = async (req, res) => {
  try {
    const { timeIn, timeOut, employeeNote } = req.body;
    const log = await TimeLog.findOne({
      _id: req.params.logId,
      tenantId: req.tenantId,
      userId: req.user._id,
    });
    if (!log) return res.status(404).json({ message: "Log not found" });
    if (log.status !== "remarked") {
      return res
        .status(403)
        .json({ message: "Log can only be edited when it has been remarked" });
    }

    if (timeIn) log.timeIn = new Date(timeIn);
    if (timeOut) log.timeOut = new Date(timeOut);
    if (employeeNote !== undefined) log.employeeNote = employeeNote;

    if (log.timeIn && log.timeOut) {
      const totalMins = (new Date(log.timeOut) - new Date(log.timeIn)) / 60000;
      const workedMins = totalMins - log.totalBreakMins;
      log.overtime = workedMins > 8 * 60;
    }

    await log.save();
    return res.status(200).json(log);
  } catch (error) {
    console.error("EditLog error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Today's Log ──────────────────────────────────────────────────────────
const getToday = async (req, res) => {
  try {
    const { timezone } = req.query;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const date = getLocalDate(timezone);
    const log = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (!log) return res.status(200).json(null);

    const breaks = await Break.find({ logId: log._id });
    const openBreak = breaks.find((b) => !b.breakEnd) || null;
    return res.status(200).json({ log, breaks, openBreak });
  } catch (error) {
    console.error("GetToday error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Get History ──────────────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { tenantId: req.tenantId, userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await TimeLog.countDocuments(query);
    const logs = await TimeLog.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res
      .status(200)
      .json({
        logs,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      });
  } catch (error) {
    console.error("GetHistory error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Export CSV ───────────────────────────────────────────────────────────────
const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, timezone } = req.query;
    if (!timezone)
      return res.status(400).json({ message: "Timezone is required" });

    const query = { tenantId: req.tenantId, userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const logs = await TimeLog.find(query).sort({ date: -1 });

    const formatLocal = (date) => {
      if (!date) return "";
      const zoned = toZonedTime(new Date(date), timezone);
      return format(zoned, "hh:mm a", { timeZone: timezone });
    };

    const rows = logs.map((log) => {
      const totalMins = log.timeOut
        ? (new Date(log.timeOut) - new Date(log.timeIn)) / 60000
        : null;
      const workedMins =
        totalMins !== null ? totalMins - log.totalBreakMins : null;
      return [
        log.date,
        formatLocal(log.timeIn),
        formatLocal(log.timeOut),
        log.totalBreakMins,
        workedMins !== null ? (workedMins / 60).toFixed(2) : "",
        log.overtime ? "Yes" : "No",
        log.status,
        log.employeeNote || "",
      ].join(",");
    });

    const header =
      "Date,Time In,Time Out,Break Mins,Hours Worked,Overtime,Status,Note";
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=timelog.csv");
    return res.status(200).send(csv);
  } catch (error) {
    console.error("ExportCSV error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  timeIn,
  startBreak,
  endBreak,
  timeOut,
  updateNote,
  editLog,
  getToday,
  getHistory,
  exportCSV,
};
