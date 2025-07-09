const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role.name;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireRestaurantManager = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role.name;
    if (userRole !== 'restaurant_manager' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Restaurant manager access required' });
    }

    if (req.user.status !== 'active' && req.user.status !== 'approved') {
      return res.status(403).json({ error: 'Account not approved' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireRestaurantManager
};