const db = require('../config/db');
const { verifyToken } = require('../utils/jwt');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const [rows] = await db.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = ?', [decoded.userId]);

    if (!rows.length) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
}

module.exports = {
  authenticate,
  authorizeAdmin
};
