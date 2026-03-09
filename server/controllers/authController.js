const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt')

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const tenant = await Tenant.create({ companyName })

    const user = await User.create({
      tenantId: tenant._id,
      name,
      email,
      passwordHash,
      role: 'owner',
      isActive: true,
      mustChangePassword: false,
    })

    tenant.createdBy = user._id
    await tenant.save()

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

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
    })
  } catch (error) {
    console.error('Register error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

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
    })
  } catch (error) {
    console.error('Login error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null })
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' })
    }

    const decoded = verifyRefreshToken(token)
    const user = await User.findById(decoded.id)

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' })
    }

    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    user.refreshToken = newRefreshToken
    await user.save()

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh error:', error.message)
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

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
    })
  } catch (error) {
    console.error('GetMe error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' })
    }

    const user = await User.findById(req.user._id)

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    user.mustChangePassword = false
    await user.save()

    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('ChangePassword error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, department } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.name = name.trim()
    if (department !== undefined) user.department = department.trim() || null
    await user.save()

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      tenantId: user.tenantId,
      mustChangePassword: user.mustChangePassword,
    })
  } catch (error) {
    console.error('UpdateProfile error:', error.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  updateProfile,
}