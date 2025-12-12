const jwt = require('jsonwebtoken');

const auth = (allowedRoles = null) => {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: 'Missing or invalid token' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // normalize user payload
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };

      // If no roles passed => any authenticated user allowed
      if (!allowedRoles || allowedRoles.length === 0) {
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }

      return next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

module.exports = auth;