const mustChangePassword = (req, res, next) => {
  if (req.user.mustChangePassword) {
    return res.status(403).json({
      message: 'You must change your password before continuing',
      mustChangePassword: true,
    })
  }

  next()
}

module.exports = mustChangePassword