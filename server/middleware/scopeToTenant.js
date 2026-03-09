const scopeToTenant = (req, res, next) => {
  // Superuser bypasses tenant scoping
  if (req.user.role === 'superuser') {
    return next()
  }

  if (!req.user.tenantId) {
    return res.status(403).json({ message: 'No workspace assigned to this account' })
  }

  // Attach tenantId to req for use in all controllers
  req.tenantId = req.user.tenantId.toString()
  next()
}

module.exports = scopeToTenant