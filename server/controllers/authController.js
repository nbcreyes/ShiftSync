const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tenant = await Tenant.create({ companyName });

    const user = await User.create({
      tenantId: tenant._id,
      name,
      email,
      passwordHash,
      role: "owner",
      isActive: true,
      mustChangePassword: false,
    });

    tenant.createdBy = user._id;
    await tenant.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await User.findOneAndUpdate(
        { refreshToken: token },
        { refreshToken: null },
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh error:", error.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
      department: req.user.department,
      avatarUrl: req.user.avatarUrl,
      mustChangePassword: req.user.mustChangePassword,
    });
  } catch (error) {
    console.error("GetMe error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("ChangePassword error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name.trim();
    if (department !== undefined) user.department = department.trim() || null;
    await user.save();

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      tenantId: user.tenantId,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error("UpdateProfile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Always respond 200 to prevent email enumeration
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        toName: user.name,
        resetLink,
      });
    } catch (emailErr) {
      console.error("[forgotPassword] email failed:", emailErr.message);
    }

    return res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("ForgotPassword error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("ResetPassword error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Notification Prefs ───────────────────────────────────────────────────
const getNotificationPrefs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notificationPrefs");
    if (!user) return res.status(404).json({ message: "User not found" });
    // Return with defaults if field is missing (existing users)
    const defaults = {
      emailOnLeaveReviewed: true,
      emailOnRemarkCreated: true,
      emailOnRemarkReply: true,
      emailOnRemarkResolved: true,
      emailOnManualLogReview: true,
      emailOnOvertime: true,
    };
    return res.status(200).json({
      ...defaults,
      ...(user.notificationPrefs?.toObject?.() ?? user.notificationPrefs),
    });
  } catch (error) {
    console.error("GetNotificationPrefs error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Update Notification Prefs ────────────────────────────────────────────────
const updateNotificationPrefs = async (req, res) => {
  try {
    const VALID_KEYS = [
      "emailOnLeaveReviewed",
      "emailOnRemarkCreated",
      "emailOnRemarkReply",
      "emailOnRemarkResolved",
      "emailOnManualLogReview",
      "emailOnOvertime",
    ];

    const updates = {};
    VALID_KEYS.forEach((key) => {
      if (typeof req.body[key] === "boolean") {
        updates[`notificationPrefs.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid preferences provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true },
    ).select("notificationPrefs");

    return res.status(200).json(user.notificationPrefs);
  } catch (error) {
    console.error("UpdateNotificationPrefs error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  getNotificationPrefs,
  updateNotificationPrefs,
};
