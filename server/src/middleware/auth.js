const User = require('../models/User');
const { verifyJwt } = require('../utils/jwt');

async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = verifyJwt(token);
    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };

