function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.user; // Assume req.user is set after authentication middleware

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

module.exports = authorizeRole;
