const ManualLogRequest = require("../models/ManualLogRequest");
const TimeLog = require("../models/TimeLog");
const Notification = require("../models/Notification");
const User = require("../models/User");

const notify = async (data) => {
  try {
    await Notification.create(data);
  } catch (err) {
    console.error("[notify] failed to create notification:", err.message);
  }
};

// ─── Submit Request (employee) ────────────────────────────────────────────────
const submitRequest = async (req, res) => {
  try {
    const { date, timeIn, timeOut, reason } = req.body;

    if (!date || !timeIn || !timeOut || !reason) {
      return res
        .status(400)
        .json({ message: "Date, time in, time out, and reason are required" });
    }
    if (new Date(timeOut) <= new Date(timeIn)) {
      return res
        .status(400)
        .json({ message: "Time out must be after time in" });
    }

    const existingLog = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
    });
    if (existingLog)
      return res
        .status(409)
        .json({ message: "A time log already exists for this date" });

    const existingRequest = await ManualLogRequest.findOne({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
      status: "pending",
    });
    if (existingRequest)
      return res
        .status(409)
        .json({ message: "A pending request already exists for this date" });

    const request = await ManualLogRequest.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      date,
      timeIn: new Date(timeIn),
      timeOut: new Date(timeOut),
      reason,
    });

    const admins = await User.find({
      tenantId: req.tenantId,
      role: { $in: ["admin", "owner"] },
      isActive: true,
    });
    await Promise.all(
      admins.map((admin) =>
        notify({
          tenantId: req.tenantId,
          recipientId: admin._id,
          type: "manual_log_requested",
          title: "Manual log request",
          message: `${req.user.name} requested a manual log for ${date}: "${reason.slice(0, 80)}${reason.length > 80 ? "…" : ""}"`,
          manualLogRequestId: request._id,
        }),
      ),
    );

    return res.status(201).json(request);
  } catch (error) {
    console.error("SubmitRequest error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Get My Requests (employee) ───────────────────────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const requests = await ManualLogRequest.find({
      tenantId: req.tenantId,
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("GetMyRequests error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Pending Requests (admin/owner) ───────────────────────────────────────
const getPendingRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const requests = await ManualLogRequest.find({
      tenantId: req.tenantId,
      status,
    })
      .populate("userId", "name email department")
      .sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error("GetPendingRequests error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Approve Request (admin/owner) ────────────────────────────────────────────
const approveRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const request = await ManualLogRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .json({ message: "Request has already been reviewed" });

    const existingLog = await TimeLog.findOne({
      tenantId: req.tenantId,
      userId: request.userId,
      date: request.date,
    });
    if (existingLog)
      return res
        .status(409)
        .json({ message: "A time log already exists for this date" });

    const totalMins =
      (new Date(request.timeOut) - new Date(request.timeIn)) / 60000;
    const overtime = totalMins > 8 * 60;

    const log = await TimeLog.create({
      tenantId: req.tenantId,
      userId: request.userId,
      date: request.date,
      timeIn: request.timeIn,
      timeOut: request.timeOut,
      totalBreakMins: 0,
      overtime,
      status: "clean",
      isManual: true,
      manualRequestId: request._id,
      employeeNote: request.reason,
    });

    request.status = "approved";
    request.adminNote = adminNote || null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await notify({
      tenantId: req.tenantId,
      recipientId: request.userId,
      type: "manual_log_approved",
      title: "Manual log approved",
      message: `${req.user.name} approved your manual log request for ${request.date}.`,
      manualLogRequestId: request._id,
      logId: log._id,
    });

    return res.status(200).json({ request, log });
  } catch (error) {
    console.error("ApproveRequest error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Reject Request (admin/owner) ─────────────────────────────────────────────
const rejectRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const request = await ManualLogRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .json({ message: "Request has already been reviewed" });

    request.status = "rejected";
    request.adminNote = adminNote || null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await notify({
      tenantId: req.tenantId,
      recipientId: request.userId,
      type: "manual_log_rejected",
      title: "Manual log rejected",
      message: `${req.user.name} rejected your manual log request for ${request.date}${adminNote ? `: "${adminNote}"` : "."}`,
      manualLogRequestId: request._id,
    });

    return res.status(200).json(request);
  } catch (error) {
    console.error("RejectRequest error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitRequest,
  getMyRequests,
  getPendingRequests,
  approveRequest,
  rejectRequest,
};
